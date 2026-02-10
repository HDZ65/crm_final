import { FulfillmentBatchEntity, FulfillmentBatchStatus } from '../entities';

export interface IFulfillmentBatchRepository {
  create(params: {
    organisationId: string;
    societeId: string;
    batchDate: Date;
    status?: FulfillmentBatchStatus;
  }): Promise<FulfillmentBatchEntity>;

  findById(id: string): Promise<FulfillmentBatchEntity | null>;

  findByOrganisationId(
    organisationId: string,
    status?: FulfillmentBatchStatus,
    limit?: number,
    offset?: number,
  ): Promise<{ batches: FulfillmentBatchEntity[]; total: number }>;

  findOpenBySocieteId(societeId: string): Promise<FulfillmentBatchEntity | null>;

  update(
    id: string,
    params: {
      status?: FulfillmentBatchStatus;
      lineCount?: number;
      lockedAt?: Date;
      dispatchedAt?: Date;
      completedAt?: Date;
    },
  ): Promise<FulfillmentBatchEntity>;

  delete(id: string): Promise<void>;
}
