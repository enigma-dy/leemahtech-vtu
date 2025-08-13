import { ApiProperty, ApiResponse } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class WalletDto {
  @ApiProperty({ example: '500', description: 'Wallet balance amount' })
  @IsString()
  amount: string;
}
