import { Injectable, Inject } from '@nestjs/common';
import type {
  LogisticsAddress,
  LogisticsProviderPort,
} from '../../../core/port/logistics-provider.port';
import { ValidateAddressDto } from '../../dto/logistics/validate-address.dto';

@Injectable()
export class ValidateAddressUseCase {
  constructor(
    @Inject('LogisticsProviderPort')
    private readonly logisticsProvider: LogisticsProviderPort,
  ) {}

  async execute(dto: ValidateAddressDto) {
    const { address, line1, line2, postalCode, city, country } = dto;
    const resolvedAddress: LogisticsAddress = address ?? {
      line1,
      line2,
      postalCode,
      city,
      country,
    };
    return await this.logisticsProvider.validateAddress(resolvedAddress);
  }
}
