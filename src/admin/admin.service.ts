import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/db/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const adminEmail = process.env.ADMIN_EMAIL!;
      const adminPassword = process.env.ADMIN_PASSWORD!;

      if (!adminEmail || !adminPassword) {
        throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in env');
      }

      const existingAdmin = await this.prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        console.log('Admin user already exists. Skipping initialization.');
        return;
      }

      console.log('Admin user not found. Initializing new admin...');

      const wallet = await this.findOrCreateAdminWallet();

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await this.prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: uuidv4(),
            fullName: 'System Admin',
            email: adminEmail,
            password: hashedPassword,
            userRole: 'admin',
            walletId: wallet.id,
            isEmailVerified: true,
          },
        });
      });

      console.log(`✅ Admin user created successfully: ${adminEmail}`);
    } catch (error) {
      console.error('❌ CRITICAL ERROR during admin initialization:', error);
    }
  }

  private async findOrCreateAdminWallet() {
    const walletName = 'Admin Wallet';

    let wallet = await this.prisma.wallet.findUnique({
      where: { name: walletName },
    });

    if (!wallet) {
      console.log(`'${walletName}' not found. Creating it now.`);
      wallet = await this.prisma.wallet.create({
        data: {
          id: uuidv4(),
          name: walletName,
          balance: 0,
        },
      });
    }

    return wallet;
  }
  async ensureSingleAdmin() {
    const admins = await this.prisma.user.findMany({
      where: { userRole: 'admin' },
    });
    if (admins.length > 0) {
      throw new ForbiddenException('Only one admin is allowed.');
    }
  }

  async getAdminById(id: string) {
    const admin = await this.prisma.user.findFirst({
      where: { id, userRole: 'admin' },
      include: { wallet: true },
    });

    if (!admin) throw new NotFoundException('Admin not found');

    return this.formatAdmin(admin);
  }

  async getAdminByEmail(email: string) {
    const admin = await this.prisma.user.findFirst({
      where: { email, userRole: 'admin' },
      include: { wallet: true },
    });

    if (!admin) throw new NotFoundException('Admin not found');

    return this.formatAdmin(admin);
  }

  async listAdmins() {
    const admins = await this.prisma.user.findMany({
      where: { userRole: 'admin' },
      include: { wallet: true },
    });
    return admins.map((a) => this.formatAdmin(a));
  }

  async createAdmin(data: {
    fullName: string;
    email: string;
    password: string;
  }) {
    await this.ensureSingleAdmin();

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const wallet = await this.findOrCreateAdminWallet();

    const admin = await this.prisma.user.create({
      data: {
        id: uuidv4(),
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        userRole: 'admin',
        walletId: wallet.id,
      },
      include: { wallet: true },
    });

    return this.formatAdmin(admin);
  }

  async updateAdmin(
    id: string,
    data: { fullName?: string; email?: string; password?: string },
  ) {
    const admin = await this.prisma.user.findFirst({
      where: { id, userRole: 'admin' },
    });

    if (!admin) throw new NotFoundException('Admin not found');

    if (data.email && data.email !== admin.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser)
        throw new BadRequestException('Email is already in use');
    }

    const updateData: any = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.email) updateData.email = data.email;
    if (data.password)
      updateData.password = await bcrypt.hash(data.password, 10);

    const updatedAdmin = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { wallet: true },
    });

    return this.formatAdmin(updatedAdmin);
  }

  async deleteAdmin(id: string, deleteWallet: boolean = false) {
    const admin = await this.prisma.user.findFirst({
      where: { id, userRole: 'admin' },
      include: { wallet: true },
    });

    if (!admin) throw new NotFoundException('Admin not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id } });

      if (deleteWallet && admin.wallet?.name === 'Admin Wallet') {
        await tx.wallet.delete({ where: { id: admin.wallet.id } });
        console.log(' Admin Wallet deleted.');
      }
    });

    return { message: 'Admin deleted successfully' };
  }

  private formatAdmin(admin: any) {
    return {
      id: admin.id,
      fullName: admin.fullName,
      email: admin.email,
      userRole: admin.userRole,
      wallet: admin.wallet
        ? {
            id: admin.wallet.id,
            name: admin.wallet.name,
            balance: admin.wallet.balance,
          }
        : null,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }
}
