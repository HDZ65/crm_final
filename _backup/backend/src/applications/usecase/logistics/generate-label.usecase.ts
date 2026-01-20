import { Injectable, Inject } from '@nestjs/common';
import type { LogisticsProviderPort } from '../../../core/port/logistics-provider.port';
import { CreateLabelDto } from '../../dto/logistics/create-label.dto';
import { LabelResponseDto } from '../../dto/logistics/label-response.dto';

@Injectable()
export class GenerateLabelUseCase {
  constructor(
    @Inject('LogisticsProviderPort')
    private readonly logisticsProvider: LogisticsProviderPort,
  ) {}

  async execute(dto: CreateLabelDto): Promise<LabelResponseDto> {
    const result = await this.logisticsProvider.generateLabel({
      contractId: dto.contractId ?? null,
      serviceLevel: dto.serviceLevel,
      format: dto.format,
      weightGr: dto.weightGr,
      sender: dto.sender,
      recipient: dto.recipient,
      payload: dto.payload,
    });
    return new LabelResponseDto(result);
  }
}
