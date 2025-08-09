import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { jwtConstants } from './auth.constant';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/decorators/auth.decorator';
import { ROLES_KEY } from 'src/decorators/roles.decorator';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    console.log('Guard activated for URL:', request.originalUrl); // <-- ADD THIS LINE

    if (request.originalUrl.startsWith('/api-doc')) {
      console.log('Skipping auth for API docs.'); // <-- ADD THIS LINE
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException();

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    let isEmailVerified = payload.isEmailVerified;
    let refreshedToken: string | undefined;

    if (!isEmailVerified) {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          userRole: true,
          isEmailVerified: true,
        },
      });

      if (!dbUser) throw new UnauthorizedException('User not found');

      if (!dbUser.isEmailVerified) {
        throw new ForbiddenException('Please verify your email to continue');
      }

      const newPayload = {
        sub: dbUser.id,
        email: dbUser.email,
        userRole: dbUser.userRole,
        isEmailVerified: dbUser.isEmailVerified,
      };
      refreshedToken = await this.jwtService.signAsync(newPayload, {
        secret: jwtConstants.secret,
        expiresIn: '1h',
      });

      payload = newPayload;
      isEmailVerified = true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (requiredRoles && !requiredRoles.includes(payload.userRole)) {
      throw new ForbiddenException(
        'You do not have permission for this action',
      );
    }

    request['user'] = { ...payload, isEmailVerified };
    request['refreshedToken'] = refreshedToken;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
