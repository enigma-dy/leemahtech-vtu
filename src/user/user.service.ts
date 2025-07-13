import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/db/prisma.service';
import { CreateUserDto } from './dto/user.dto';
import { User } from 'generated/prisma';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { passwordConfirm, password, ...userData } = data;

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

      return await this.prisma.$transaction(async (prisma) => {
        const account = await prisma.account.create({
          data: {
            name: `${userData.fullName.trim()} VTU ${Math.random().toString(36).substring(2, 8)}`,
          },
        });

        const user = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
            accountId: account.id,
          },
        });
        const { password: _, ...data } = user;

        return data;
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async getUser(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: email },
      include: { account: true },
    });
    if (!user) {
      throw new BadRequestException();
    }
    const { password, ...userData } = user;
    return userData;
  }
}
