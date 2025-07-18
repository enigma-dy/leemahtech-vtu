import {
  IsBoolean,
  IsNumber,
  IsString,
  IsEmail,
  IsISO4217CurrencyCode,
  IsIP,
  IsUrl,
  Min,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class Amount {
  @IsISO4217CurrencyCode()
  currency: string;

  @IsNumber()
  @IsPositive()
  total: number;
}

export class UserInfo {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  userName?: string;

  @IsString()
  @IsOptional()
  userMobile?: string;

  @IsEmail()
  @IsOptional()
  userEmail?: string;
}

export class Product {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  reference?: string;
}

export class OpayPaymentRequest {
  @IsString()
  reference: string;

  @IsString()
  country: string;

  amount: Amount;

  @IsUrl()
  @IsOptional()
  callbackUrl?: string;

  @IsUrl()
  returnUrl: string;

  @IsUrl()
  @IsOptional()
  cancelUrl?: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsIP()
  @IsOptional()
  userClientIP?: string;

  @IsString()
  @IsOptional()
  sn?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  expireAt?: number;

  @IsString()
  @IsOptional()
  payMethod?: string;

  @IsOptional()
  userInfo?: UserInfo;

  product: Product;

  @IsBoolean()
  @IsOptional()
  evokeOpay?: boolean;

  @IsString()
  @IsOptional()
  customerVisitSource?: string;
}

export interface OpayStatusRequest {
  country: string;
  reference: string;
}
