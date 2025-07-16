import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateOrUpdateDataPriceDto {
  @IsString()
  network_id: string;

  @IsString()
  network_name: string;

  @IsString()
  plan_size: string;

  @IsOptional()
  @IsString()
  plan_volume?: string;

  @IsString()
  plan_name_id: string;

  @IsOptional()
  @IsString()
  plan_name_id2?: string;

  @IsNumber()
  Affilliate_price: number;

  @IsNumber()
  TopUser_price: number;

  @IsNumber()
  api_price: number;

  @IsOptional()
  @IsString()
  plan_type?: string;

  @IsOptional()
  @IsString()
  validity?: string;

  @IsNumber()
  commission: number;
}
