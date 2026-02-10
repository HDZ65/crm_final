import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FulfillmentBatchRepositoryService } from '../persistence/typeorm/repositories/fulfillment/fulfillment-batch-repository.service';
import { FulfillmentBatchLineRepositoryService } from '../persistence/typeorm/repositories/fulfillment/fulfillment-batch-line-repository.service';
import { FulfillmentBatchStatus } from '../../domain/fulfillment/entities/fulfillment-batch.entity';

@Controller()
export class FulfillmentBatchController {
  private readonly logger = new Logger(FulfillmentBatchController.name);

  constructor(
    private readonly batchRepository: FulfillmentBatchRepositoryService,
    private readonly batchLineRepository: FulfillmentBatchLineRepositoryService,
  ) {}

  @GrpcMethod('FulfillmentBatchService', 'Create')
  async create(data: { organisation_id: string; label?: string; cutoff_date?: string }) {
    const batch = await this.batchRepository.create({
      organisationId: data.organisation_id,
      societeId: data.organisation_id, // Default to org until societe is resolved
      batchDate: data.cutoff_date ? new Date(data.cutoff_date) : new Date(),
    });
    return this.mapBatch(batch);
  }

  @GrpcMethod('FulfillmentBatchService', 'Get')
  async get(data: { id: string }) {
    const batch = await this.batchRepository.findById(data.id);
    if (!batch) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Batch ${data.id} not found` });
    }
    return this.mapBatch(batch);
  }

  @GrpcMethod('FulfillmentBatchService', 'List')
  async list(data: {
    organisation_id: string;
    status?: number;
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }) {
    const limit = data.pagination?.limit || 20;
    const offset = ((data.pagination?.page || 1) - 1) * limit;

    const statusFilter = data.status ? this.mapProtoStatus(data.status) : undefined;
    const result = await this.batchRepository.findByOrganisationId(
      data.organisation_id,
      statusFilter,
      limit,
      offset,
    );

    return {
      batches: result.batches.map((b) => this.mapBatch(b)),
      pagination: {
        total: result.total,
        page: data.pagination?.page || 1,
        limit,
        total_pages: Math.ceil(result.total / limit),
      },
    };
  }

  @GrpcMethod('FulfillmentBatchService', 'Lock')
  async lock(data: { id: string }) {
    const batch = await this.batchRepository.findById(data.id);
    if (!batch) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Batch ${data.id} not found` });
    }

    if (batch.status !== 'OPEN') {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Batch ${data.id} is not OPEN (current: ${batch.status})`,
      });
    }

    const lineCount = await this.batchLineRepository.countByBatchId(data.id);
    const updated = await this.batchRepository.update(data.id, {
      status: 'LOCKED' as any,
      lockedAt: new Date(),
      lineCount,
    });

    return this.mapBatch(updated);
  }

  @GrpcMethod('FulfillmentBatchService', 'Dispatch')
  async dispatch(data: { id: string; dispatch_date?: string }) {
    const batch = await this.batchRepository.findById(data.id);
    if (!batch) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Batch ${data.id} not found` });
    }

    if (batch.status !== 'LOCKED') {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Batch ${data.id} is not LOCKED (current: ${batch.status})`,
      });
    }

    const updated = await this.batchRepository.update(data.id, {
      status: 'DISPATCHED' as any,
      dispatchedAt: data.dispatch_date ? new Date(data.dispatch_date) : new Date(),
    });

    return this.mapBatch(updated);
  }

  @GrpcMethod('FulfillmentBatchService', 'Complete')
  async complete(data: { id: string }) {
    const batch = await this.batchRepository.findById(data.id);
    if (!batch) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Batch ${data.id} not found` });
    }

    if (batch.status !== 'DISPATCHED') {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Batch ${data.id} is not DISPATCHED (current: ${batch.status})`,
      });
    }

    const updated = await this.batchRepository.update(data.id, {
      status: 'COMPLETED' as any,
      completedAt: new Date(),
    });

    return this.mapBatch(updated);
  }

  @GrpcMethod('FulfillmentBatchService', 'Delete')
  async delete(data: { id: string }) {
    await this.batchRepository.delete(data.id);
    return { success: true };
  }

  @GrpcMethod('FulfillmentBatchService', 'AddLine')
  async addLine(data: {
    batch_id: string;
    subscription_id: string;
    client_id: string;
    product_id: string;
    product_name?: string;
    quantity?: number;
    snapshot?: {
      line1?: string;
      postal_code?: string;
      city?: string;
      country?: string;
      preferences?: Record<string, string>;
    };
  }) {
    const batch = await this.batchRepository.findById(data.batch_id);
    if (!batch) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Batch ${data.batch_id} not found`,
      });
    }

    const line = await this.batchLineRepository.create({
      organisationId: batch.organisationId,
      batchId: data.batch_id,
      subscriptionId: data.subscription_id,
      clientId: data.client_id,
      produitId: data.product_id,
      quantite: data.quantity || 1,
      addressSnapshotId: '', // Will be populated by domain service during lock
      preferenceSnapshotId: '', // Will be populated by domain service during lock
    });

    return {
      id: line.id,
      batch_id: line.batchId,
      subscription_id: line.subscriptionId,
      client_id: line.clientId,
      product_id: line.produitId,
      quantity: line.quantite,
      created_at: line.createdAt?.toISOString?.() || '',
      updated_at: line.updatedAt?.toISOString?.() || '',
    };
  }

  @GrpcMethod('FulfillmentBatchService', 'RemoveLine')
  async removeLine(data: { id: string }) {
    await this.batchLineRepository.delete(data.id);
    return { success: true };
  }

  private mapBatch(batch: any) {
    return {
      id: batch.id,
      organisation_id: batch.organisationId,
      status: this.mapStatusToProto(batch.status),
      cutoff_date: batch.batchDate?.toISOString?.() || '',
      total_lines: batch.lineCount || 0,
      total_items: batch.lineCount || 0,
      created_at: batch.createdAt?.toISOString?.() || '',
      updated_at: batch.updatedAt?.toISOString?.() || '',
    };
  }

  private mapStatusToProto(status: string): number {
    const mapping: Record<string, number> = {
      OPEN: 1,
      LOCKED: 2,
      DISPATCHED: 3,
      COMPLETED: 4,
      CANCELED: 5,
    };
    return mapping[status] || 0;
  }

   private mapProtoStatus(protoStatus: number): FulfillmentBatchStatus | undefined {
     const mapping: Record<number, FulfillmentBatchStatus> = {
       1: FulfillmentBatchStatus.OPEN,
       2: FulfillmentBatchStatus.LOCKED,
       3: FulfillmentBatchStatus.DISPATCHED,
       4: FulfillmentBatchStatus.COMPLETED,
     };
     return mapping[protoStatus];
   }
}
