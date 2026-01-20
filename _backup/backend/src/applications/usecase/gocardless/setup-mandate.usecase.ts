import { Injectable, Logger } from '@nestjs/common';
import { GoCardlessService } from '../../../infrastructure/services/gocardless.service';
import {
  SetupMandateDto,
  SetupMandateResponseDto,
} from '../../dto/gocardless/setup-mandate.dto';

@Injectable()
export class SetupMandateUseCase {
  private readonly logger = new Logger(SetupMandateUseCase.name);

  constructor(private readonly gocardlessService: GoCardlessService) {}

  async execute(dto: SetupMandateDto): Promise<SetupMandateResponseDto> {
    this.logger.log(`Setting up mandate for client: ${dto.clientId}`);

    // 1. Create billing request
    const billingRequest = await this.gocardlessService.createBillingRequest(
      dto.currency || 'EUR',
      dto.scheme || 'sepa_core',
      {
        ...dto.metadata,
        client_id: dto.clientId,
      },
    );

    // 2. Create billing request flow with redirect URLs
    const flow = await this.gocardlessService.createBillingRequestFlow(
      billingRequest.id,
      dto.redirectUri,
      dto.exitUri,
    );

    this.logger.log(
      `Mandate setup flow created: ${billingRequest.id} -> ${flow.authorisation_url}`,
    );

    return new SetupMandateResponseDto(
      billingRequest.id,
      flow.authorisation_url,
    );
  }
}
