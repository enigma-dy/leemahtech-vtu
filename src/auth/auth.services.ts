import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    // --- START: THE CRITICAL FIX ---
    // This single check handles three cases:
    // 1. User with this email does not exist (`!user` is true).
    // 2. User exists, but was created without a password (`!user.password` is true).
    // The `||` operator short-circuits, so if `!user` is true, it never tries to access `user.password`, preventing a crash.
    if (!user || !user.password) {
      throw new UnauthorizedException('Email or password incorrect');
    }
    // --- END: THE CRITICAL FIX ---

    // Now, we are GUARANTEED that `user` is a valid object and `user.password` is a string.
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email or password incorrect');
    }

    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload);

    const { password, ...result } = user;
    return {
      user: result,
      token: accessToken,
    };
  }
}
