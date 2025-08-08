import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/db/prisma.service';

import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { User } from 'generated/prisma';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailEvent } from 'src/email/events/mail.event';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createUser(data: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { passwordConfirm, password, referralCode, ...userData } = data;

    if (password !== passwordConfirm) {
      throw new ConflictException('Password and confirmation do not match');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: userData.username }, { email: userData.email }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Username or email already in use');
    }

    try {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
      const uniqueReferralCode = uuidv4().substring(0, 8);

      return await this.prisma.$transaction(async (prisma) => {
        const account = await prisma.wallet.create({
          data: {
            name: `${userData.fullName.trim()} VTU ${Math.random().toString(36).substring(2, 8)}`,
          },
        });

        let referredBy;

        if (referralCode) {
          referredBy = await prisma.user.findFirst({
            where: { referralCode },
            select: { id: true },
          });
          if (!referredBy) {
            throw new NotFoundException('Invalid referral code');
          }
        }

        const user = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
            walletId: account.id,
          },
        });
        const { password: _, ...data } = user;

        //Generate API KEY
        if (!userData.role) {
          throw new ConflictException('User role cannot be empty');
        }
        if (['reseller', 'affiliate', 'agent'].includes(userData.role)) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              apiKey: uuidv4(),
              apiKeyCreatedAt: new Date(),
            },
          });
        }

        //Referral Reward
        if (referredBy) {
          await prisma.referralReward.create({
            data: {
              userId: referredBy.id,
              amount: 100,
              description: `Referral bonus for user ${user.email}`,
            },
          });
          await prisma.user.update({
            where: { id: referredBy.id },
            data: {
              cashbackBalance: { increment: 100 },
            },
          });
        }

        const emailToken = uuidv4();
        await prisma.emailVerificationToken.create({
          data: {
            token: emailToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        // Send verification email
        this.eventEmitter.emit(
          'email.verification.requested',
          new EmailEvent(user.email!, user.fullName!, {
            verificationToken: emailToken,
          }),
        );
        return data;
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: email },
      include: { wallet: true },
    });
    if (!user) {
      throw new NotFoundException();
    }
    const { password, ...userData } = user;
    return userData;
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: id },
      include: { wallet: true },
    });
    if (!user) {
      throw new NotFoundException();
    }
    const { password, ...userData } = user;
    return userData;
  }

  async updateUser(sub: string, data: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id: sub } });

    if (!user) {
      throw new NotFoundException();
    }

    const updateUser = await this.prisma.user.update({
      where: { id: user.id },
      data: data,
      include: { wallet: true },
    });

    const { password, ...userData } = updateUser;
    return userData;
  }

  async activateResellerAccount(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        userRole: { in: ['reseller', 'affiliate', 'agent'] },
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found or not a reseller/affiliate/agent',
      );
    }

    if (user.isActiveReseller) {
      throw new ConflictException('Account already activated');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActiveReseller: true },
    });

    this.eventEmitter.emit(
      'user.activated',
      new EmailEvent(user.email!, user.fullName!),
    );

    return { message: 'Account activated successfully' };
  }

  async generateApiKey(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        userRole: { in: ['reseller', 'affiliate', 'agent'] },
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found or not a reseller/affiliate/agent',
      );
    }

    const newApiKey = uuidv4();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        apiKey: newApiKey,
        apiKeyCreatedAt: new Date(),
      },
    });

    return { apiKey: newApiKey };
  }

  async getReferralStats(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      include: {
        referrals: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
        ReferralReward: {
          select: {
            amount: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException();
    }

    return {
      referralCode: user.referralCode,
      totalReferrals: user.referrals.length,
      referrals: user.referrals,
      totalRewards: user.ReferralReward.reduce(
        (sum, reward) => sum + Number(reward.amount),
        0,
      ),
      rewards: user.ReferralReward,
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour expiry

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    this.eventEmitter.emit(
      'password.reset.requested',
      new EmailEvent(user.email!, user.fullName!, { resetToken: token }),
    );

    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
    passwordConfirm: string,
  ) {
    if (newPassword !== passwordConfirm) {
      throw new BadRequestException('Passwords do not match');
    }

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this.prisma.$transaction(async (prisma) => {
      await prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      });

      await prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId },
      });
    });

    this.eventEmitter.emit(
      'password.reset.completed',
      new EmailEvent(resetToken.user.email!, resetToken.user.fullName!),
    );

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(token: string) {
    const verification = await this.prisma.emailVerificationToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!verification) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.user.update({
        where: { id: verification.userId },
        data: { isEmailVerified: true },
      });

      await prisma.emailVerificationToken.deleteMany({
        where: { userId: verification.userId },
      });
    });

    this.eventEmitter.emit(
      'email.verification.completed',
      new EmailEvent(verification.user.email!, verification.user.fullName!),
    );

    return { message: 'Email verified successfully' };
  }
}
