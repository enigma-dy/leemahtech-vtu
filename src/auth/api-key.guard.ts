import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        apiKey,
        userRole: { in: ['reseller', 'affiliate', 'agent'] },
        isActiveReseller: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid API key or inactive account');
    }

    request['user'] = { id: user.id, userRole: user.userRole };
    return true;
  }
}
