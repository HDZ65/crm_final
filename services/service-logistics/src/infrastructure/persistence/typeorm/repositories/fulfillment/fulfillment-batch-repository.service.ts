import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FulfillmentBatchEntity,
  FulfillmentBatchStatus,
} from '../../../../../domain/fulfillment/entities';
import type { IFulfillmentBatchRepository } from '../../../../../domain/fulfillment/repositories';

@Injectable()
export class FulfillmentBatchRepositoryService implements IFulfillmentBatchRepository {
  private readonly logger = new Logger(FulfillmentBatchRepositoryService.name);

  constructor(
    @InjectRepository(FulfillmentBatchEntity)
    private readonly repository: Repository<FulfillmentBatchEntity>,
  ) {}

  async create(params: {
    organisationId: string;
    societeId: string;
    batchDate: Date;
    status?: FulfillmentBatchStatus;
  }): Promise<FulfillmentBatchEntity> {
    const entity = this.repository.create({
      organisationId: params.organisationId,
      societeId: params.societeId,
      batchDate: params.batchDate,
      status: params.status || FulfillmentBatchStatus.OPEN,
      lineCount: 0,
    });
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<FulfillmentBatchEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByOrganisationId(
    organisationId: string,
    status?: FulfillmentBatchStatus,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ batches: FulfillmentBatchEntity[]; total: number }> {
    const where: any = { organisationId };
    if (status) {
      where.status = status;
    }

    const [batches, total] = await this.repository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { batches, total };
  }

  async findOpenBySocieteId(societeId: string): Promise<FulfillmentBatchEntity | null> {
    return this.repository.findOne({
      where: { societeId, status: FulfillmentBatchStatus.OPEN },
    });
  }

  async update(
    id: string,
    params: {
      status?: FulfillmentBatchStatus;
      lineCount?: number;
      lockedAt?: Date;
      dispatchedAt?: Date;
      completedAt?: Date;
    },
  ): Promise<FulfillmentBatchEntity> {
    await this.repository.update(id, params);
    const updated = await this.repository.findOne({ where: { id } });
    if (!updated) {
      throw new Error(`Batch ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
