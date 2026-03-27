import { FulfillmentBatchLineEntity, FulfillmentBatchLineStatus } from '../entities';

export interface IFulfillmentBatchLineRepository {
  create(params: {
    organisationId: string;
    batchId: string;
    subscriptionId: string;
    clientId: string;
    produitId: string;
    quantite: number;
    addressSnapshotId: string;
    preferenceSnapshotId: string;
    lineStatus?: FulfillmentBatchLineStatus;
  }): Promise<FulfillmentBatchLineEntity>;

  findById(id: string): Promise<FulfillmentBatchLineEntity | null>;

  findByBatchId(
    batchId: string,
    lineStatus?: FulfillmentBatchLineStatus,
    limit?: number,
    offset?: number,
  ): Promise<{ lines: FulfillmentBatchLineEntity[]; total: number }>;

  findByClientId(
    clientId: string,
    limit?: number,
    offset?: number,
  ): Promise<{ lines: FulfillmentBatchLineEntity[]; total: number }>;

  update(
    id: string,
    params: {
      lineStatus?: FulfillmentBatchLineStatus;
      expeditionId?: string;
      errorMessage?: string | null;
      addressSnapshotId?: string;
      preferenceSnapshotId?: string;
    },
  ): Promise<FulfillmentBatchLineEntity>;

  delete(id: string): Promise<void>;

  countByBatchId(batchId: string): Promise<number>;

  findAllByBatchId(batchId: string): Promise<FulfillmentBatchLineEntity[]>;

  deleteBySubscriptionIdFromOpenBatches(subscriptionId: string): Promise<number>;
}
