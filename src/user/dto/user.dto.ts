import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full legal name of the user',
  })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'johndoe', description: 'Unique username for login' })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
  })
  @IsString()
  email: string;

  @ApiProperty({
    example: 'StrongPass123!',
    description: 'Password for the account',
  })
  @IsString()
  password: string;

  @ApiProperty({
    example: 'StrongPass123!',
    description: 'Password confirmation',
  })
  @IsString()
  passwordConfirm: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number of the user',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    example: '123 Main St, New York, NY',
    description: 'Residential address',
  })
  @IsString()
  address: string;

  @ApiPropertyOptional({
    example: 'ABC12345',
    description: 'Optional referral code from another user',
  })
  @IsString()
  @IsOptional()
  referralCode: string;

  @ApiPropertyOptional({
    enum: Role,
    default: Role.user,
    description: 'Role assigned to the user',
  })
  @IsOptional()
  @IsEnum(Role)
  @Transform(({ value }) => value ?? Role.user)
  role?: Role;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Updated full name' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'johndoe', description: 'Updated username' })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'NewStrongPass123!',
    description: 'Updated password',
  })
  @IsString()
  password: string;

  @ApiProperty({ example: '+1234567890', description: 'Updated phone number' })
  @IsString()
  phone: string;

  @ApiProperty({
    example: '456 Park Ave, New York, NY',
    description: 'Updated address',
  })
  @IsString()
  address: string;
}
