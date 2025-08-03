import { IsString } from 'class-validator';

export class WalletDto {
  @IsString()
  amount: string;
}
