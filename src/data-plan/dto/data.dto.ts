import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { SmeProvider } from 'src/providers/dto/provider.dto';

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

// plan.entity.ts or plan.schema.ts
export class CreateUnifiedPlanDto {
  @IsEnum(SmeProvider)
  provider: SmeProvider;

  @IsString()
  data_plan_id: string;

  @IsNumber()
  network_id: number;

  @IsString()
  network_name: string;

  @IsNumber()
  plan_amount: number;

  @IsString()
  plan_size: string;

  @IsOptional()
  @IsString()
  plan_type?: string;

  @IsOptional()
  @IsString()
  validity?: string;
}
