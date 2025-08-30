import { PrismaClient } from '@prisma/client';
import * as mysql from 'mysql2/promise';

const prisma = new PrismaClient();

const mysqlConfig = {
  host: process.env.OLD_DB_HOST || '127.0.0.1',
  user: process.env.OLD_DB_USER || 'root',
  password: process.env.OLD_DB_PASSWORD || 'password',
  database: process.env.OLD_DB_NAME || 'db',
};

function safeParseDate(dateInput: any): Date | null {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  return isNaN(date.getTime()) ? null : date;
}

async function main() {
  console.log('🚀 Starting migration seed script...');

  let mysqlConnection;
  try {
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Connected to old MySQL database.');
  } catch (error) {
    console.error(
      '❌ Failed to connect to the old MySQL database. Please check your connection details.',
    );
    console.error(error);
    process.exit(1);
  }

  // const [rows] = await mysqlConnection.execute('SELECT * FROM `users`');
  const [rows] = await mysqlConnection.execute(
    'SELECT * FROM vtuapp_customuser',
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    console.log('No users found in the old database. Seeding finished.');
    return;
  }

  console.log(
    `🔍 Found ${rows.length} users in the old database to potentially migrate.`,
  );

  const usernameToOldIdMap = new Map<string, number>();
  const oldIdToNewIdMap = new Map<number, string>();

  // Pre-populate the map of old usernames to their old IDs for quick lookups.
  for (const oldUser of rows as any[]) {
    if (oldUser.username) {
      usernameToOldIdMap.set(oldUser.username, oldUser.id);
    }
  }

  console.log('\n--- PASS 1: Migrating User Data ---');
  for (const oldUser of rows as any[]) {
    if (!oldUser.email) {
      console.warn(
        `⚠️ Skipping user (old ID: ${oldUser.id}) because they have no email address.`,
      );
      continue;
    }

    const normalizedEmail = oldUser.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      oldIdToNewIdMap.set(oldUser.id, existingUser.id);
      continue;
    }

    try {
      let finalUsername = oldUser.username;
      if (!finalUsername || finalUsername.trim() === '') {
        const emailPrefix = normalizedEmail
          .split('@')[0]
          .replace(/[^a-zA-Z0-9]/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        finalUsername = `${emailPrefix}${randomSuffix}`;
        console.log(
          `   -> User with email ${normalizedEmail} has no username. Generated: ${finalUsername}`,
        );
      }

      let role = 'user';
      const newUser = await prisma.user.create({
        data: {
          username: finalUsername,
          fullName:
            oldUser.FullName ||
            `${oldUser.first_name || ''} ${oldUser.last_name || ''}`.trim(),
          email: normalizedEmail,
          phone: oldUser.Phone,
          address: oldUser.Address,
          userRole: role as any,
          password: null,
          isEmailVerified: !!oldUser.email_verify,
          isMigrated: false,
          cashbackBalance: oldUser.Bonus || 0,
          createdAt: safeParseDate(oldUser.date_joined) || new Date(),
          wallet: {
            create: {
              name: `${finalUsername}-wallet`,
              balance: oldUser.Account_Balance || 0,
            },
          },
          profile: {
            create: {},
          },
        },
      });

      console.log(`✅ Migrated user: ${normalizedEmail}`);

      oldIdToNewIdMap.set(oldUser.id, newUser.id);
    } catch (error) {
      console.error(`❌ Failed to migrate user ${normalizedEmail}:`, error);
    }
  }

  console.log('\n--- PASS 2: Linking Referrals ---');
  for (const oldUser of rows as any[]) {
    const refererUsername = oldUser.referer_username;
    if (refererUsername) {
      const referrerOldId = usernameToOldIdMap.get(refererUsername);
      if (referrerOldId) {
        const referrerNewId = oldIdToNewIdMap.get(referrerOldId);
        const refereeNewId = oldIdToNewIdMap.get(oldUser.id);

        if (referrerNewId && refereeNewId) {
          try {
            await prisma.user.update({
              where: { id: refereeNewId },
              data: { referredById: referrerNewId },
            });
            console.log(
              `🔗 Linked user ${oldUser.email} to referrer '${refererUsername}'`,
            );
          } catch (error) {
            if ((error as any).code !== 'P2025') {
              console.error(
                `❌ Failed to link referral for user ${oldUser.email}:`,
                error,
              );
            }
          }
        }
      } else {
        console.warn(
          `⚠️ Could not find referrer '${refererUsername}' for user ${oldUser.email}.`,
        );
      }
    }
  }

  console.log('\n🎉 Migration seed script finished successfully.');

  await mysqlConnection.end();
}

main()
  .catch((e) => {
    console.error('An unexpected error occurred during the seed process:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
