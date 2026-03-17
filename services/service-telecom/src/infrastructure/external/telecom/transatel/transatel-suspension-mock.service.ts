import { Injectable } from '@nestjs/common';
import type { ProvisioningSuspensionPort } from '../../../../domain/provisioning/services';

@Injectable()
export class TransatelSuspensionMockService implements ProvisioningSuspensionPort {
  async suspendLine(input: {
    contratId: string;
    clientId: string;
    reason: string;
    correlationId?: string;
  }): Promise<{ suspensionId: string }> {
    const forceFailure =
      String(process.env.TELECOM_TRANSATEL_FORCE_SUSPENSION_FAILURE || 'false').toLowerCase() ===
      'true';

    if (forceFailure) {
      throw new Error(
        `Transatel suspension failed for contract ${input.contratId}`,
      );
    }

    return {
      suspensionId: `transatel-suspend-${input.contratId}`,
    };
  }
}
