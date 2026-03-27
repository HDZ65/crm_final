import { Inject, Injectable, Logger } from '@nestjs/common';
import type { TelecomCarrierPort } from '../ports/telecom-carrier.port';
import {
  PROVISIONING_TRANSATEL_PORT,
  PROVISIONING_NETWORTH_PORT,
  PROVISIONING_STELOGY_PORT,
  PROVISIONING_SUSPENSION_PORT,
  PROVISIONING_TERMINATION_PORT,
  type ProvisioningTransatelPort,
  type ProvisioningSuspensionPort,
} from './provisioning-saga.service';
import type { ProvisioningTerminationPort } from '../ports/provisioning-termination.port';

/**
 * Strategy service that selects the appropriate telecom carrier implementation.
 *
 * Resolves carrier from:
 * 1. Explicit `carrier` parameter
 * 2. `TELECOM_DEFAULT_CARRIER` environment variable
 * 3. Defaults to 'transatel'
 *
 * Supported carriers: transatel, networth, stelogy
 */
@Injectable()
export class CarrierSelectorService {
  private readonly logger = new Logger(CarrierSelectorService.name);
  private readonly transatelAdapter: TelecomCarrierPort;

  constructor(
    @Inject(PROVISIONING_TRANSATEL_PORT)
    transatelPort: ProvisioningTransatelPort,
    @Inject(PROVISIONING_SUSPENSION_PORT)
    suspensionPort: ProvisioningSuspensionPort,
    @Inject(PROVISIONING_TERMINATION_PORT)
    private readonly terminationPort: ProvisioningTerminationPort,
    @Inject(PROVISIONING_NETWORTH_PORT)
    private readonly networthCarrier: TelecomCarrierPort,
    @Inject(PROVISIONING_STELOGY_PORT)
    private readonly stelogyCarrier: TelecomCarrierPort,
  ) {
    this.transatelAdapter = {
      activateLine: (
        contratId: string,
        clientId: string,
        _msisdn: string,
        _iccid: string,
        correlationId: string,
      ) =>
        transatelPort.activateLine({ contratId, clientId, correlationId }),
      suspendLine: (
        contratId: string,
        clientId: string,
        reason: string,
        correlationId: string,
      ) =>
        suspensionPort.suspendLine({
          contratId,
          clientId,
          reason,
          correlationId,
        }),
      terminateLine: (
        contratId: string,
        clientId: string,
        reason: string,
        effectiveDate: string,
        correlationId: string,
      ) =>
        terminationPort.terminateLine(
          contratId,
          clientId,
          reason,
          effectiveDate,
          correlationId,
        ),
    };
  }

  selectCarrier(carrier?: string): TelecomCarrierPort {
    const resolved =
      carrier || process.env.TELECOM_DEFAULT_CARRIER || 'transatel';

    this.logger.debug(`Selecting carrier: ${resolved}`);

    switch (resolved.toLowerCase()) {
      case 'networth':
        return this.networthCarrier;
      case 'stelogy':
        return this.stelogyCarrier;
      case 'transatel':
      default:
        return this.transatelAdapter;
    }
  }
}
