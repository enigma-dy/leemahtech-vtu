import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Req,
  NotFoundException,
  Query,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Public } from 'src/decorators/auth.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Username or email already in use' })
  @Public()
  @Post('register')
  async createUser(@Body() data: CreateUserDto) {
    return this.userService.createUser(data);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user data by email ( user)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get('email')
  async getUserEmail(@Req() request: Request) {
    const { email } = request['user'];
    return this.userService.getUserByEmail(email);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user data by ID (user)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Post('getUserById')
  async getUserById(@Body('id') id: string) {
    const user = await this.userService.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user data' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Put('update')
  async updateUser(@Req() request: Request, @Body() data: UpdateUserDto) {
    const { sub } = request['user'];
    return this.userService.updateUser(sub, data);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate reseller/affiliate/agent account' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Account activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found or not eligible' })
  @ApiResponse({ status: 409, description: 'Account already activated' })
  @Put('activate-reseller/:id')
  async activateResellerAccount(@Param('id') id: string) {
    return this.userService.activateResellerAccount(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate API key for reseller/affiliate/agent' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'API key generated successfully' })
  @ApiResponse({ status: 404, description: 'User not found or not eligible' })
  @Put('generate-api-key/:id')
  async generateApiKey(@Param('id') id: string) {
    return this.userService.generateApiKey(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral stats for user' })
  @ApiResponse({
    status: 200,
    description: 'Referral stats retrieved successfully',
  })
  @Get('referral-stats')
  async getReferralStats(@Req() request: Request) {
    const { sub } = request['user'];
    return this.userService.getReferralStats(sub);
  }

  @ApiOperation({ summary: 'Request password reset link' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { email: { type: 'string', example: 'john@example.com' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Password reset link sent' })
  @ApiResponse({
    status: 404,
    description: 'User with this email does not exist',
  })
  @Public()
  @Post('password-reset-request')
  async requestPasswordReset(@Body('email') email: string) {
    return this.userService.requestPasswordReset(email);
  }

  @ApiOperation({ summary: 'Reset password using token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'abc123' },
        newPassword: { type: 'string', example: 'NewStrongPass123!' },
        passwordConfirm: { type: 'string', example: 'NewStrongPass123!' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Passwords do not match' })
  @ApiResponse({ status: 404, description: 'Invalid or expired token' })
  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
    @Body('passwordConfirm') passwordConfirm: string,
  ) {
    return this.userService.resetPassword(token, newPassword, passwordConfirm);
  }

  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({
    status: 404,
    description: 'Invalid or expired verification token',
  })
  @Public()
  @Get('verify-email')
  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    try {
      await this.userService.verifyEmail(token);
      return res.redirect(`${process.env.FRONTEND_URL}/`);
    } catch (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/verificaion-failed`);
    }
  }
}
