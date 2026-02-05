import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { MailevaService } from '../../../../infrastructure/external/maileva';
import type {
  GenerateLabelRequest,
  LabelResponse,
  TrackShipmentRequest,
  TrackingResponse,
  ValidateAddressRequest,
  AddressValidationResponse,
  SimulatePricingRequest,
  PricingResponse,
} from '@crm/proto/logistics';

@Controller()
export class MailevaController {
  private readonly logger = new Logger(MailevaController.name);

  constructor(private readonly mailevaService: MailevaService) {}

  @GrpcMethod('LogisticsService', 'GenerateLabel')
  async generateLabel(data: GenerateLabelRequest): Promise<LabelResponse> {
    this.logger.log(`GenerateLabel for organisation: ${data.organisationId}`);

    const result = await this.mailevaService.generateLabel({
      contractId: data.contractId,
      serviceLevel: data.serviceLevel,
      format: data.format,
      weightGr: data.weightGr,
      sender: {
        line1: data.sender?.line1 || '',
        line2: data.sender?.line2,
        postalCode: data.sender?.postalCode || '',
        city: data.sender?.city || '',
        country: data.sender?.country || 'FR',
      },
      recipient: {
        line1: data.recipient?.line1 || '',
        line2: data.recipient?.line2,
        postalCode: data.recipient?.postalCode || '',
        city: data.recipient?.city || '',
        country: data.recipient?.country || 'FR',
      },
    });

    return {
      trackingNumber: result.trackingNumber,
      labelUrl: result.labelUrl,
      estimatedDeliveryDate: result.estimatedDeliveryDate ?? undefined,
    };
  }

  @GrpcMethod('LogisticsService', 'TrackShipment')
  async trackShipment(data: TrackShipmentRequest): Promise<TrackingResponse> {
    this.logger.log(`TrackShipment: ${data.trackingNumber}`);

    const result = await this.mailevaService.trackShipment(data.trackingNumber);

    return {
      trackingNumber: result.trackingNumber,
      status: result.status,
      events: result.events.map((e) => ({
        code: e.code,
        label: e.label,
        date: e.date,
        location: e.location ?? undefined,
      })),
      lastUpdatedAt: result.lastUpdatedAt,
    };
  }

  @GrpcMethod('LogisticsService', 'ValidateAddress')
  async validateAddress(data: ValidateAddressRequest): Promise<AddressValidationResponse> {
    this.logger.log(`ValidateAddress`);

    const result = this.mailevaService.validateAddress({
      line1: data.address?.line1 || '',
      line2: data.address?.line2,
      postalCode: data.address?.postalCode || '',
      city: data.address?.city || '',
      country: data.address?.country || 'FR',
    });

    return {
      isValid: result.isValid,
      normalizedAddress: result.normalizedAddress
        ? {
            line1: result.normalizedAddress.line1,
            line2: result.normalizedAddress.line2 ?? undefined,
            postalCode: result.normalizedAddress.postalCode,
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
      serviceLevel: data.serviceLevel,
      format: data.format,
      weightGr: data.weightGr,
      originCountry: data.originCountry,
      destinationCountry: data.destinationCountry,
    });

    return {
      serviceLevel: result.serviceLevel,
      totalPrice: result.totalPrice,
      currency: result.currency,
      breakdown: result.breakdown.map((b) => ({
        label: b.label,
        amount: b.amount,
      })),
      estimatedDeliveryDays: result.estimatedDeliveryDays,
    };
  }
}
