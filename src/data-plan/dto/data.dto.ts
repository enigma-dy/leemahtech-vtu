import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SmeProvider } from 'src/providers/dto/provider.dto';

export class CreateUnifiedPlanDto {
  @ApiProperty({ enum: SmeProvider })
  @IsEnum(SmeProvider)
  provider: SmeProvider;

  @ApiProperty()
  @IsString()
  data_plan_id: string;

  @ApiProperty()
  @IsNumber()
  network_id: number;

  @ApiProperty()
  @IsString()
  network_name: string;

  @ApiProperty()
  @IsNumber()
  plan_amount: number;

  @ApiProperty()
  @IsNumber()
  selling_price: number;

  @ApiProperty()
  @IsString()
  plan_size: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plan_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  validity?: string;
}

export class DataDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  mobileNumber: string;
}

export class UpdataDataDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Selling price, max 2 decimal places' })
  @IsNumber({ maxDecimalPlaces: 2 })
  selling_price: number;
}
