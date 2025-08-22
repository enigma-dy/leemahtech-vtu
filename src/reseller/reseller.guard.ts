import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class ResellerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] || request.headers['X-API-KEY'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    const user = await this.prisma.user.findUnique({
      where: { apiKey },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActiveReseller: true,
        isEmailVerified: true,
        userRole: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!user.isActiveReseller) {
      throw new ForbiddenException('User is not an active reseller');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Reseller email is not verified');
    }

    // attach user to request
    request.user = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.userRole,
    };

    return true;
  }
}
