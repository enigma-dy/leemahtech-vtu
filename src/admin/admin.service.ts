import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'AdminPass123!';

    const existingAdmin = await this.prisma.user.findFirst({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const wallet = await this.prisma.wallet.create({
        data: { name: 'Admin Wallet' },
      });

      await this.prisma.user.create({
        data: {
          fullName: 'System Admin',
          email: adminEmail,
          password: hashedPassword,
          userRole: 'admin',
          walletId: wallet.id,
        },
      });

      console.log(`✅ Admin user created: ${adminEmail}`);
    }
  }
}
