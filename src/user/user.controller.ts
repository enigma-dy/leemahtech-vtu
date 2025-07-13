import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreatUserDto } from './dto/user.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('user')
  async createUser(@Body() data: CreatUserDto) {
    return this.userService.createUser(data);
  }
}
