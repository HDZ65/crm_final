/**
 * Types TypeScript pour les services Maileva
 */

export interface MailevaAddress {
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface MailevaLabelRequest {
  recipient: MailevaAddress;
  sender?: MailevaAddress;
  serviceLevel: 'URGENT' | 'FAST' | 'ECONOMIC' | 'urgent' | 'fast' | 'economic';
  format?: string;
  weightGr?: number;
}

export interface MailevaLabelResponse {
  trackingNumber: string;
  labelUrl: string;
  estimatedDeliveryDate: string;
}

export interface MailevaTrackingEvent {
  code: string;
  label: string;
  date: string;
  location?: string | null;
}

export interface MailevaTrackingResponse {
  trackingNumber: string;
  status: string;
  events: MailevaTrackingEvent[];
  lastUpdatedAt: string;
}

export interface MailevaPricingRequest {
  serviceLevel: string;
  format: string;
  weightGr: number;
  originCountry: string;
  destinationCountry: string;
}

export interface MailevaPricingResponse {
  serviceLevel: string;
  totalPrice: number;
  currency: string;
  breakdown: Array<{
    label: string;
    amount: number;
  }>;
  estimatedDeliveryDays: number;
}

export interface MailevaAddressValidationResponse {
  isValid: boolean;
  normalizedAddress: {
    line1: string;
    line2: string | null;
    postalCode: string;
    city: string;
    country: string;
  };
}
