import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { MailevaService } from '../external/maileva';
import type {
  GenerateLabelRequest,
  LabelResponse,
  TrackShipmentRequest,
  TrackingResponse,
  ValidateAddressRequest,
  AddressValidationResponse,
  SimulatePricingRequest,
  PricingResponse,
} from '@proto/logistics';

@Controller()
export class MailevaController {
  private readonly logger = new Logger(MailevaController.name);

  constructor(private readonly mailevaService: MailevaService) {}

  @GrpcMethod('LogisticsService', 'GenerateLabel')
  async generateLabel(data: GenerateLabelRequest): Promise<LabelResponse> {
    this.logger.log(`GenerateLabel for organisation: ${data.organisation_id}`);

    const result = await this.mailevaService.generateLabel({
      contractId: data.contract_id,
      serviceLevel: data.service_level,
      format: data.format,
      weightGr: data.weight_gr,
      sender: {
        line1: data.sender?.line1 || '',
        line2: data.sender?.line2,
        postalCode: data.sender?.postal_code || '',
        city: data.sender?.city || '',
        country: data.sender?.country || 'FR',
      },
      recipient: {
        line1: data.recipient?.line1 || '',
        line2: data.recipient?.line2,
        postalCode: data.recipient?.postal_code || '',
        city: data.recipient?.city || '',
        country: data.recipient?.country || 'FR',
      },
    });

    return {
      tracking_number: result.trackingNumber,
      label_url: result.labelUrl,
      estimated_delivery_date: result.estimatedDeliveryDate ?? undefined,
    };
  }

  @GrpcMethod('LogisticsService', 'TrackShipment')
  async trackShipment(data: TrackShipmentRequest): Promise<TrackingResponse> {
    this.logger.log(`TrackShipment: ${data.tracking_number}`);

    const result = await this.mailevaService.trackShipment(data.tracking_number);

    return {
      tracking_number: result.trackingNumber,
      status: result.status,
      events: result.events.map((e) => ({
        code: e.code,
        label: e.label,
        date: e.date,
        location: e.location ?? undefined,
      })),
      last_updated_at: result.lastUpdatedAt,
    };
  }

  @GrpcMethod('LogisticsService', 'ValidateAddress')
  async validateAddress(data: ValidateAddressRequest): Promise<AddressValidationResponse> {
    this.logger.log(`ValidateAddress`);

    const result = this.mailevaService.validateAddress({
      line1: data.address?.line1 || '',
      line2: data.address?.line2,
      postalCode: data.address?.postal_code || '',
      city: data.address?.city || '',
      country: data.address?.country || 'FR',
    });

    return {
      is_valid: result.isValid,
      normalized_address: result.normalizedAddress
        ? {
            line1: result.normalizedAddress.line1,
            line2: result.normalizedAddress.line2 ?? undefined,
            postal_code: result.normalizedAddress.postalCode,
            city: result.normalizedAddress.city,
            country: result.normalizedAddress.country,
          }
        : undefined,
      suggestions: [],
    };
  }

  @GrpcMethod('LogisticsService', 'SimulatePricing')
  async simulatePricing(data: SimulatePricingRequest): Promise<PricingResponse> {
    this.logger.log(`SimulatePricing`);

    const result = this.mailevaService.simulatePricing({
      serviceLevel: data.service_level,
      format: data.format,
      weightGr: data.weight_gr,
      originCountry: data.origin_country,
      destinationCountry: data.destination_country,
    });

    return {
      service_level: result.serviceLevel,
      total_price: result.totalPrice,
      currency: result.currency,
      breakdown: result.breakdown.map((b) => ({
        label: b.label,
        amount: b.amount,
      })),
      estimated_delivery_days: result.estimatedDeliveryDays,
    };
  }
}
