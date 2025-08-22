import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // -----------------------
  // Routes
  // -----------------------
  @Get('email/:email')
  async getAdminByEmail(@Param('email') email: string) {
    return this.adminService.getAdminByEmail(email);
  }

  @Get(':id')
  async getAdminById(@Param('id') id: string) {
    return this.adminService.getAdminById(id);
  }

  @Get()
  async listAdmins() {
    return this.adminService.listAdmins();
  }

  @Post()
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.createAdmin(createAdminDto);
  }

  @Patch(':id')
  async updateAdmin(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.adminService.updateAdmin(id, updateAdminDto);
  }

  @Delete(':id')
  async deleteAdmin(
    @Param('id') id: string,
    @Query('deleteWallet') deleteWallet: string,
  ) {
    return this.adminService.deleteAdmin(id, deleteWallet === 'true');
  }
}
