import { Injectable, Inject } from '@nestjs/common';
import type { LogisticsProviderPort } from '../../../core/port/logistics-provider.port';
import { TrackingResponseDto } from '../../dto/logistics/tracking-response.dto';

@Injectable()
export class TrackShipmentUseCase {
  constructor(
    @Inject('LogisticsProviderPort')
    private readonly logisticsProvider: LogisticsProviderPort,
  ) {}

  async execute(trackingNumber: string): Promise<TrackingResponseDto> {
    const result = await this.logisticsProvider.trackShipment(trackingNumber);
    return new TrackingResponseDto(result);
  }
}
