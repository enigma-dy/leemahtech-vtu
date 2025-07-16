import { IsBoolean, IsString } from 'class-validator';

export class DataStationDto {
  @IsString()
  network: string;

  @IsString()
  mobile_number: string;

  @IsString()
  plan: string;

  @IsBoolean()
  Ported_number: boolean;
}
