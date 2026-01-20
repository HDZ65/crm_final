import { Injectable, Inject } from '@nestjs/common';
import type { LogisticsProviderPort } from '../../../core/port/logistics-provider.port';
import { SimulatePricingDto } from '../../dto/logistics/simulate-pricing.dto';

@Injectable()
export class SimulatePricingUseCase {
  constructor(
    @Inject('LogisticsProviderPort')
    private readonly logisticsProvider: LogisticsProviderPort,
  ) {}

  async execute(dto: SimulatePricingDto) {
    return await this.logisticsProvider.simulatePricing(dto);
  }
}
