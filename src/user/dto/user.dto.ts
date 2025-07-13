import { IsNumber, IsString } from 'class-validator';

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
}
