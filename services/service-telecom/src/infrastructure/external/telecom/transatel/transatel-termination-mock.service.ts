import { Injectable } from '@nestjs/common';
import type { ProvisioningTerminationPort } from '../../../../domain/provisioning/ports';

@Injectable()
export class TransatelTerminationMockService implements ProvisioningTerminationPort {
  async terminateLine(
    contratId: string,
    _clientId: string,
    _reason: string,
    _effectiveDate: string,
    _correlationId: string,
  ): Promise<{ terminationId: string }> {
    const forceFailure =
      String(process.env.TELECOM_TRANSATEL_TERMINATION_FORCE_FAILURE || 'false').toLowerCase() ===
      'true';

    if (forceFailure) {
      throw new Error(
        `Transatel termination failed for contract ${contratId}`,
      );
    }

    return {
      terminationId: `transatel-terminate-${contratId}`,
    };
  }
}
