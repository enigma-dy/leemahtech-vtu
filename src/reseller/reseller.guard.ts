import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { verifyApiKey } from 'src/misc/api-key.util';

@Injectable()
export class ResellerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    console.log(apiKey);

    const { valid, expired, resellerEmail } = verifyApiKey(apiKey);
    if (!valid)
      throw new UnauthorizedException(
        expired ? 'API key expired' : 'Invalid API key',
      );

    const user = await this.prisma.user.findUnique({
      where: { email: resellerEmail },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActiveReseller: true,
        isEmailVerified: true,
        userRole: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found');
    if (!user.isActiveReseller)
      throw new ForbiddenException('User is not an active reseller');
    if (!user.isEmailVerified)
      throw new ForbiddenException('Reseller email is not verified');

    request.user = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.userRole,
    };

    return true;
  }
}
