import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class AddressDto {
  @IsString()
  line1: string;

  @IsOptional()
  @IsString()
  line2?: string | null;

  @IsString()
  postalCode: string;

  @IsString()
  city: string;

  @IsString()
  country: string;
}

export class GenerateLabelRequestDto {
  @IsOptional()
  @IsString()
  contractId?: string | null;

  @IsString()
  serviceLevel: string;

  @IsString()
  format: string;

  @IsNumber()
  @Min(0)
  weightGr: number;

  sender: AddressDto;
  recipient: AddressDto;
}

export class LabelResponseDto {
  trackingNumber: string;
  labelUrl: string;
  estimatedDeliveryDate?: string | null;
}

export class TrackingResponseDto {
  trackingNumber: string;
  status: string;
  events: Array<{
    code: string;
    label: string;
    date: string;
    location?: string | null;
  }>;
  lastUpdatedAt: string;
}

export class AddressValidationResponseDto {
  isValid: boolean;
  normalizedAddress?: AddressDto;
}

export class PricingResponseDto {
  serviceLevel: string;
  totalPrice: number;
  currency: string;
  breakdown: Array<{ label: string; amount: number }>;
  estimatedDeliveryDays: number;
}
