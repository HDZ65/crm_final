import { Injectable, Logger } from '@nestjs/common';
import { FulfillmentBatchLineRepositoryService } from '../../../infrastructure/persistence/typeorm/repositories/fulfillment/fulfillment-batch-line-repository.service';
import { AddressSnapshotRepositoryService } from '../../../infrastructure/persistence/typeorm/repositories/fulfillment/address-snapshot-repository.service';
import { PreferenceSnapshotRepositoryService } from '../../../infrastructure/persistence/typeorm/repositories/fulfillment/preference-snapshot-repository.service';

@Injectable()
export class BatchSnapshotService {
  private readonly logger = new Logger(BatchSnapshotService.name);

  constructor(
    private readonly batchLineRepository: FulfillmentBatchLineRepositoryService,
    private readonly addressSnapshotRepository: AddressSnapshotRepositoryService,
    private readonly preferenceSnapshotRepository: PreferenceSnapshotRepositoryService,
  ) {}

  /**
   * Creates address and preference snapshots for all lines in a batch.
   * Called during the LOCK phase to freeze data for fulfillment.
   */
  async createSnapshotsForBatch(batchId: string): Promise<void> {
    const lines = await this.batchLineRepository.findAllByBatchId(batchId);

    if (lines.length === 0) {
      this.logger.warn(`No batch lines found for batch ${batchId}`);
      return;
    }

    let snapshotCount = 0;

    for (const line of lines) {
      try {
        // Create address snapshot
        // TODO: Fetch actual address from service-core via gRPC
        const addressSnapshot = await this.addressSnapshotRepository.create({
          organisationId: line.organisationId,
          clientId: line.clientId,
          rue: 'TODO: Fetch from service-core',
          codePostal: '',
          ville: '',
          pays: 'FR',
          capturedAt: new Date(),
        });

        // Create preference snapshot
        // TODO: Fetch actual preferences from service-commercial via gRPC
        const preferenceSnapshot = await this.preferenceSnapshotRepository.create({
          organisationId: line.organisationId,
          subscriptionId: line.subscriptionId,
          preferenceData: {},
          capturedAt: new Date(),
        });

        // Update batch line with snapshot IDs
        await this.batchLineRepository.update(line.id, {
          addressSnapshotId: addressSnapshot.id,
          preferenceSnapshotId: preferenceSnapshot.id,
        });

        snapshotCount++;
      } catch (error: any) {
        this.logger.error(
          `Failed to create snapshot for batch line ${line.id}: ${error.message}`,
          error.stack,
        );
        // Continue with other lines — don't fail the entire batch
      }
    }

    this.logger.log(
      `Created snapshots for ${snapshotCount}/${lines.length} batch lines in batch ${batchId}`,
    );
  }
}
