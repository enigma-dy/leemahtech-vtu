import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/user.dto';
import { Public } from 'src/decorators/auth.decorator';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post('user')
  async createUser(@Body() data: CreateUserDto) {
    return this.userService.createUser(data);
  }
}
