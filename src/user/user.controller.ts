import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/user.dto';
import { Public } from 'src/decorators/auth.decorator';
import { request } from 'http';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post('user')
  async createUser(@Body() data: CreateUserDto) {
    return this.userService.createUser(data);
  }

  @Get('user')
  async getUser(@Req() request: Request) {
    const { email } = request['user'];

    return this.userService.getUser(email);
  }
}
