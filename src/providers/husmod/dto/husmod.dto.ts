import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDecimal,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPhoneNumber,
  IsString,
  Min,
} from 'class-validator';
import { Decimal } from 'generated/prisma/runtime/library';

export class HusmodDataDto {
  @IsNotEmpty()
  @IsString()
  network: string;

  @IsNotEmpty()
  // @IsPhoneNumber('NG')
  mobile_number: string;

  @IsNotEmpty()
  @IsString()
  plan: string;

  @IsNotEmpty()
  @IsString()
  planSize: string;

  @IsNotEmpty()
  @IsString()
  planVolume: string;

  @IsNotEmpty()
  @IsString()
  planName: string;

  @IsNotEmpty()
  @IsBoolean()
  Ported_number: boolean;
}

export class AirTime2CastDto {
  @IsString()
  network: string;

  @IsString()
  mobile_number: string;

  @IsString()
  amount: string;
}

export class ElectricityPaymentDto {
  @IsString()
  @IsNotEmpty()
  disco_name: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  meter_number: string;

  @IsNumber()
  @IsIn([1, 2], {
    message: 'MeterType must be either 1 (PREPAID) or 2 (POSTPAID)',
  })
  MeterType: number;
}

export class ExamPinPurchaseDto {
  @IsNotEmpty()
  @IsIn(['WAEC', 'NECO'], { message: 'exam_name must be either WAEC or NECO' })
  exam_name: string;

  @IsNotEmpty()
  @IsInt({ message: 'quantity must be an integer' })
  quantity: number;
}

export class CardPurchaseDto {
  @IsNotEmpty()
  @IsString()
  network: string;

  @IsNotEmpty()
  @IsInt({ message: 'network_amount must be an integer' })
  @Min(1, { message: 'network_amount must be at least 1' })
  network_amount: number;

  @IsNotEmpty()
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity: number;

  @IsNotEmpty()
  @IsString()
  name_on_card: string;
}

export class AirtimePurchaseDto {
  @IsNotEmpty()
  @IsInt({ message: 'network must be an integer (network ID)' })
  @Type(() => Number)
  network: number;

  @IsNotEmpty()
  @IsNumber({}, { message: 'amount must be a valid number' })
  @Type(() => Number)
  @Min(1, { message: 'amount must be at least 1' })
  amount: number;

  @IsNotEmpty()
  @IsPhoneNumber('NG', {
    message: 'mobile_number must be a valid Nigerian phone number',
  })
  mobile_number: string;

  @IsNotEmpty()
  @IsBoolean({ message: 'Ported_number must be true or false' })
  @Type(() => Boolean)
  Ported_number: boolean;

  @IsNotEmpty()
  @IsIn(['VTU', 'awuf4U', 'Share and Sell'], {
    message: 'airtime_type must be VTU, awuf4U or Share and Sell',
  })
  airtime_type: string;
}
