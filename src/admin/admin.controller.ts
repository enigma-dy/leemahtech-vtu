import { Controller, Get } from '@nestjs/common';

import { AdminService } from './admin.service';
import { Admin } from 'src/decorators/roles.decorator';

@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @Admin()
  getDashboard() {
    return { message: 'Welcome Admin' };
  }
}
