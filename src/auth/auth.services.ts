import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email or password incorrect');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email or password incorrect');
    }

    const payload = { sub: user.id, email: user.email };

    const accesToken = await this.jwtService.signAsync(payload);

    const { password, ...result } = user;
    return {
      user: result,
      token: accesToken,
    };
  }
}
