import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { SmeProvider } from 'src/providers/dto/provider.dto';

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

  @IsNumber()
  selling_price: number;
  @IsString()
  plan_size: string;

  @IsOptional()
  @IsString()
  plan_type?: string;

  @IsOptional()
  @IsString()
  validity?: string;
}

export class DataDto {
  @IsString()
  id: string;

  @IsString()
  mobileNumber: string;
}

export class UpdataDataDto {
  @IsString()
  id: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  selling_price: number;
}
