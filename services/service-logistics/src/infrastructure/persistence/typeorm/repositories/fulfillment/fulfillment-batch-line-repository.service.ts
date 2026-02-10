import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FulfillmentBatchLineEntity,
  FulfillmentBatchLineStatus,
} from '../../../../../domain/fulfillment/entities';
import type { IFulfillmentBatchLineRepository } from '../../../../../domain/fulfillment/repositories';

@Injectable()
export class FulfillmentBatchLineRepositoryService implements IFulfillmentBatchLineRepository {
  private readonly logger = new Logger(FulfillmentBatchLineRepositoryService.name);

  constructor(
    @InjectRepository(FulfillmentBatchLineEntity)
    private readonly repository: Repository<FulfillmentBatchLineEntity>,
  ) {}

  async create(params: {
    organisationId: string;
    batchId: string;
    subscriptionId: string;
    clientId: string;
    produitId: string;
    quantite: number;
    addressSnapshotId: string;
    preferenceSnapshotId: string;
    lineStatus?: FulfillmentBatchLineStatus;
  }): Promise<FulfillmentBatchLineEntity> {
    const entity = this.repository.create({
      organisationId: params.organisationId,
      batchId: params.batchId,
      subscriptionId: params.subscriptionId,
      clientId: params.clientId,
      produitId: params.produitId,
      quantite: params.quantite,
      addressSnapshotId: params.addressSnapshotId,
      preferenceSnapshotId: params.preferenceSnapshotId,
      lineStatus: params.lineStatus || FulfillmentBatchLineStatus.TO_PREPARE,
    });
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<FulfillmentBatchLineEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByBatchId(
    batchId: string,
    lineStatus?: FulfillmentBatchLineStatus,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ lines: FulfillmentBatchLineEntity[]; total: number }> {
    const where: any = { batchId };
    if (lineStatus) {
      where.lineStatus = lineStatus;
    }

    const [lines, total] = await this.repository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { lines, total };
  }

  async findByClientId(
    clientId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ lines: FulfillmentBatchLineEntity[]; total: number }> {
    const [lines, total] = await this.repository.findAndCount({
      where: { clientId },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { lines, total };
  }

  async update(
    id: string,
    params: {
      lineStatus?: FulfillmentBatchLineStatus;
      expeditionId?: string;
      errorMessage?: string | null;
      addressSnapshotId?: string;
      preferenceSnapshotId?: string;
    },
  ): Promise<FulfillmentBatchLineEntity> {
    await this.repository.update(id, params as any);
    const updated = await this.repository.findOne({ where: { id } });
    if (!updated) {
      throw new Error(`BatchLine ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async countByBatchId(batchId: string): Promise<number> {
    return this.repository.count({ where: { batchId } });
  }

  async findAllByBatchId(batchId: string): Promise<FulfillmentBatchLineEntity[]> {
    return this.repository.find({ where: { batchId } });
  }

  async deleteBySubscriptionIdFromOpenBatches(subscriptionId: string): Promise<number> {
    // Delete batch lines for a given subscription only from OPEN batches
    const result = await this.repository
      .createQueryBuilder('line')
      .delete()
      .where('line.subscription_id = :subscriptionId', { subscriptionId })
      .andWhere(
        'line.batch_id IN (SELECT id FROM fulfillment_batches WHERE status = :status)',
        { status: 'OPEN' },
      )
      .execute();
    return result.affected ?? 0;
  }
}
