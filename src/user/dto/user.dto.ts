import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Role } from 'generated/prisma';

export class CreateUserDto {
  @IsString()
  fullName: string;

  @IsString()
  username: string;

  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsString()
  passwordConfirm: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsString()
  @IsOptional()
  referralCode: string;

  @IsOptional()
  @IsEnum(Role)
  @Transform(({ value }) => value ?? Role.user)
  role?: Role;
}

export class UpdateUserDto {
  @IsString()
  fullName: string;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;
}
