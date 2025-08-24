import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Get admin by email' })
  @Get('email/:email')
  async getAdminByEmail(@Param('email') email: string) {
    return this.adminService.getAdminByEmail(email);
  }

  @ApiOperation({ summary: 'Get admin by ID' })
  @Get(':id')
  async getAdminById(@Param('id') id: string) {
    return this.adminService.getAdminById(id);
  }

  @ApiOperation({ summary: 'List all admins' })
  @Get()
  async listAdmins() {
    return this.adminService.listAdmins();
  }

  @ApiOperation({ summary: 'Create a new admin' })
  @Post()
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.createAdmin(createAdminDto);
  }

  @ApiOperation({ summary: 'Update an existing admin' })
  @Patch(':id')
  async updateAdmin(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.adminService.updateAdmin(id, updateAdminDto);
  }

  @ApiOperation({ summary: 'Delete an admin (optionally with wallet)' })
  @Delete(':id')
  async deleteAdmin(
    @Param('id') id: string,
    @Query('deleteWallet') deleteWallet: string,
  ) {
    return this.adminService.deleteAdmin(id, deleteWallet === 'true');
  }
}
