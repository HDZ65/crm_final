export interface LogisticsAddress {
  line1: string;
  line2?: string | null;
  postalCode: string;
  city: string;
  country: string;
}

export interface LogisticsLabelRequest {
  contractId?: string | null;
  serviceLevel: string;
  format: string;
  weightGr: number;
  sender: LogisticsAddress;
  recipient: LogisticsAddress;
  payload?: Record<string, unknown>;
}

export interface LogisticsLabelResponse {
  trackingNumber: string;
  labelUrl: string;
  estimatedDeliveryDate?: string | null;
}

export interface LogisticsTrackingResponse {
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

export interface LogisticsAddressValidationResponse {
  isValid: boolean;
  normalizedAddress?: Record<string, unknown>;
  suggestions?: Array<Record<string, unknown>>;
}

export interface LogisticsPricingSimulationResponse {
  serviceLevel: string;
  totalPrice: number;
  currency: string;
  breakdown?: Array<{ label: string; amount: number }>;
  estimatedDeliveryDays?: number;
}

export interface LogisticsProviderPort {
  generateLabel(args: LogisticsLabelRequest): Promise<LogisticsLabelResponse>;

  trackShipment(trackingNumber: string): Promise<LogisticsTrackingResponse>;

  validateAddress(
    address: LogisticsAddress,
  ): Promise<LogisticsAddressValidationResponse>;

  simulatePricing(args: {
    serviceLevel: string;
    format: string;
    weightGr: number;
    originCountry: string;
    destinationCountry: string;
  }): Promise<LogisticsPricingSimulationResponse>;
}
