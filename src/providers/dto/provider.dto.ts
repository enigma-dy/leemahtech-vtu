import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export enum SmeProvider {
  datastation = 'datastation',
  husmodata = 'husmodata',
  direct = 'direct',
}

export class SetSmeProviderDto {
  @ApiProperty({
    enum: SmeProvider,
    example: SmeProvider.datastation,
    description: 'Active SME provider',
  })
  @IsEnum(SmeProvider, {
    message: 'Provider must be either datastation, husmodata, or direct',
  })
  provider: SmeProvider;
}

export class BuyAirtimeDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the mobile network provider',
  })
  @IsNumber()
  @IsPositive()
  network_id: number;

  @ApiProperty({
    example: 500,
    description: 'Amount of airtime to purchase',
  })
  @IsNumber()
  @Min(50)
  amount: number;

  @ApiProperty({
    example: '08012345678',
    description: 'Recipient phone number in local format',
  })
  @IsString()
  phone: string;
}

export class BillPaymentDto {
  @ApiProperty({
    example: 'ikeja-electric',
    description: 'Name of the electricity distribution company',
  })
  @IsString()
  disco_name: string;

  @ApiProperty({ example: 5000, description: 'Bill amount to be paid' })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({
    example: '1234567890',
    description: 'Meter number to be recharged',
  })
  @IsString()
  meter_number: string;

  @ApiProperty({
    example: 1,
    description: 'Type of meter: 1 = Prepaid, 2 = Postpaid',
  })
  @IsNumber()
  MeterType: number;
}

export class CableSubscriptionDto {
  @ApiProperty({ example: 101, description: 'Cable provider ID' })
  @IsNumber()
  cablename: number;

  @ApiProperty({ example: 501, description: 'Cable plan ID' })
  @IsNumber()
  cableplan: number;

  @ApiProperty({ example: '12345678901', description: 'Smart card number' })
  @IsString()
  smart_card_number: string;
}

export class RechargePinDto {
  @ApiProperty({ example: 1, description: 'Network provider ID' })
  @IsNumber()
  network: number;

  @ApiProperty({ example: 1000, description: 'Amount per pin' })
  @IsNumber()
  network_amount: number;

  @ApiProperty({ example: 5, description: 'Number of pins to generate' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    example: 'John Doe',
    description: 'Name to appear on the recharge card',
  })
  @IsString()
  name_on_card: string;
}

export class ExamPinDto {
  @ApiProperty({ example: 'WAEC', description: 'Exam name' })
  @IsString()
  exam_name: string;

  @ApiProperty({ example: 2, description: 'Number of exam pins to purchase' })
  @IsNumber()
  @IsPositive()
  quantity: number;
}
