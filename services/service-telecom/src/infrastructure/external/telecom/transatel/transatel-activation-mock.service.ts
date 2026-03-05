import { Injectable } from '@nestjs/common';
import type { ProvisioningTransatelPort } from '../../../../domain/provisioning/services';

@Injectable()
export class TransatelActivationMockService implements ProvisioningTransatelPort {
  async activateLine(input: {
    contratId: string;
    clientId: string;
    correlationId?: string;
  }): Promise<{ activationId: string }> {
    const forceFailure =
      String(process.env.TELECOM_TRANSATEL_FORCE_FAILURE || 'false').toLowerCase() ===
      'true';

    if (forceFailure) {
      throw new Error(
        `Transatel activation failed for contract ${input.contratId}`,
      );
    }

    return {
      activationId: `transatel-${input.contratId}`,
    };
  }
}
