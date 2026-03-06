import { Injectable, Logger } from '@nestjs/common';
import type { ProvisioningNetworthPort } from '../../../../domain/provisioning/ports';

/**
 * Mock implementation of the Networth carrier activation service.
 *
 * Returns deterministic IDs for testing. No real API calls.
 * Activate via: TELECOM_CARRIER=networth
 */
@Injectable()
export class NetworthActivationMockService implements ProvisioningNetworthPort {
  private readonly logger = new Logger(NetworthActivationMockService.name);

  async activateLine(
    contratId: string,
    clientId: string,
    msisdn: string,
    iccid: string,
    correlationId: string,
  ): Promise<{ activationId: string }> {
    this.logger.log(
      `[MOCK] activateLine contrat=${contratId} client=${clientId} msisdn=${msisdn} iccid=${iccid} correlation=${correlationId}`,
    );

    return { activationId: `networth-${contratId}` };
  }

  async suspendLine(
    contratId: string,
    clientId: string,
    reason: string,
    correlationId: string,
  ): Promise<{ suspensionId: string }> {
    this.logger.log(
      `[MOCK] suspendLine contrat=${contratId} client=${clientId} reason=${reason} correlation=${correlationId}`,
    );

    return { suspensionId: `networth-suspend-${contratId}` };
  }

  async terminateLine(
    contratId: string,
    clientId: string,
    reason: string,
    effectiveDate: string,
    correlationId: string,
  ): Promise<{ terminationId: string }> {
    this.logger.log(
      `[MOCK] terminateLine contrat=${contratId} client=${clientId} reason=${reason} effectiveDate=${effectiveDate} correlation=${correlationId}`,
    );

    return { terminationId: `networth-terminate-${contratId}` };
  }
}
