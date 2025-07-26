import { Body, Controller, Get, Post, Put, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Public } from 'src/decorators/auth.decorator';
import { request } from 'http';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post('register')
  async createUser(@Body() data: CreateUserDto) {
    return this.userService.createUser(data);
  }

  @Get('email')
  async getUserEmail(@Req() request: Request) {
    const { sub, email } = request['user'];

    return this.userService.getUserByEmail(email);
  }

  @Get('id')
  async getUserById(@Req() request: Request) {
    const { sub, email } = request['user'];

    return this.userService.getUserById(sub);
  }

  @Put('update')
  async updateUser(@Req() request: Request, @Body() data: UpdateUserDto) {
    const { email } = request['user'];

    return this.userService.updateUser(email, data);
  }
}
