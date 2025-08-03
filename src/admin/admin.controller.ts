import { Controller, Get } from '@nestjs/common';

import { AdminService } from './admin.service';
import { AdminOnly } from 'src/decorators/roles.decorator';

@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @AdminOnly()
  getDashboard() {
    return { message: 'Welcome Admin' };
  }
}
