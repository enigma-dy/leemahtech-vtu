import { ApiProperty, ApiResponse } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class WalletDto {
  @ApiProperty({ example: '500', description: 'Wallet balance amount' })
  @IsString()
  amount: string;
}

class CreditWalletDto {
  userId: string;
  amount: number;
}

class DebitWalletDto {
  userId: string;
  amount: number;
}

export class TransactionFilterDto {
  @IsOptional()
  @IsEnum(TransactionStatus, {
    message:
      'Status must be a valid transaction status (e.g., PENDING, SUCCESS)',
  })
  status?: TransactionStatus; // <--- Changed from string to the Enum type

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsEnum(['CREDIT', 'DEBIT'])
  type?: 'CREDIT' | 'DEBIT';

  @IsOptional()
  @IsNumberString()
  skip?: number;

  @IsOptional()
  @IsNumberString()
  take?: number;
}
