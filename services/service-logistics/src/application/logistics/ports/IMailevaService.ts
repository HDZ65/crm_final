export const MAILEVA_SERVICE = Symbol('MAILEVA_SERVICE');

export interface LogisticsAddress {
  line1: string;
  line2?: string | null;
  postalCode: string;
  city: string;
  country: string;
}

export interface LabelRequest {
  contractId?: string | null;
  serviceLevel: string;
  format: string;
  weightGr: number;
  sender: LogisticsAddress;
  recipient: LogisticsAddress;
}

export interface LabelResponse {
  trackingNumber: string;
  labelUrl: string;
  estimatedDeliveryDate?: string | null;
}

export interface TrackingResponse {
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

export interface AddressValidationResponse {
  isValid: boolean;
  normalizedAddress?: LogisticsAddress;
}

export interface PricingResponse {
  serviceLevel: string;
  totalPrice: number;
  currency: string;
  breakdown: Array<{ label: string; amount: number }>;
  estimatedDeliveryDays: number;
}

export interface IMailevaService {
  generateLabel(args: LabelRequest): Promise<LabelResponse>;

  trackShipment(trackingNumber: string): Promise<TrackingResponse>;

  validateAddress(address: LogisticsAddress): AddressValidationResponse;

  simulatePricing(args: {
    serviceLevel: string;
    format: string;
    weightGr: number;
    originCountry: string;
    destinationCountry: string;
  }): PricingResponse;
}
