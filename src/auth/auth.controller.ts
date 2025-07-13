import {
  Body,
  Controller,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.services';
import { LoginDto } from './dto/auth.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        data: result,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid email or password',
          error: 'Unauthorized',
        });
      }
      throw error;
    }
  }
}
