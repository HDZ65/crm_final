import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ReturnLabelService } from '../../domain/logistics/services/return-label.service';
import { RetourExpeditionService } from '../persistence/typeorm/repositories/logistics/retour-expedition.service';
import { RetourExpeditionStatus } from '../../domain/logistics/entities/retour-expedition.entity';
import type {
  CreateReturnLabelRequest,
  ReturnLabelResponse,
  GetByIdRequest,
  UpdateReturnLabelStatusRequest,
} from '@proto/logistics';

@Controller()
export class ReturnLabelController {
  private readonly logger = new Logger(ReturnLabelController.name);

  constructor(
    private readonly returnLabelService: ReturnLabelService,
    private readonly retourExpeditionService: RetourExpeditionService,
  ) {}

  @GrpcMethod('LogisticsService', 'CreateReturnLabel')
  async createReturnLabel(data: CreateReturnLabelRequest): Promise<ReturnLabelResponse> {
    this.logger.log(`CreateReturnLabel for expedition: ${data.expedition_id}`);

    const retour = await this.returnLabelService.createReturnLabel(
      data.expedition_id,
      data.reason,
      data.client_id,
    );

    return this.toReturnLabelResponse(retour);
  }

  @GrpcMethod('LogisticsService', 'GetReturnLabel')
  async getReturnLabel(data: GetByIdRequest): Promise<ReturnLabelResponse> {
    this.logger.log(`GetReturnLabel: ${data.id}`);

    const retour = await this.retourExpeditionService.findById(data.id);
    if (!retour) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Return label not found',
      });
    }

    return this.toReturnLabelResponse(retour);
  }

  @GrpcMethod('LogisticsService', 'UpdateReturnLabelStatus')
  async updateReturnLabelStatus(data: UpdateReturnLabelStatusRequest): Promise<ReturnLabelResponse> {
    this.logger.log(`UpdateReturnLabelStatus: ${data.id} → ${data.status}`);

    // Validate status value
    const newStatus = data.status as RetourExpeditionStatus;
    if (!Object.values(RetourExpeditionStatus).includes(newStatus)) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: `Invalid status '${data.status}'. Allowed: ${Object.values(RetourExpeditionStatus).join(', ')}`,
      });
    }

    // Check current state and validate transition
    const current = await this.retourExpeditionService.findById(data.id);
    if (!current) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Return label not found',
      });
    }

    if (!ReturnLabelService.isValidTransition(current.status, newStatus)) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: `Invalid status transition: ${current.status} → ${newStatus}`,
      });
    }

    const updated = await this.retourExpeditionService.updateStatus(
      data.id,
      newStatus,
      {
        trackingNumber: data.tracking_number || undefined,
      },
    );

    return this.toReturnLabelResponse(updated);
  }

  private toReturnLabelResponse(entity: {
    id: string;
    expeditionId: string;
    reason: string;
    status: string;
    trackingNumber: string | null;
    labelUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ReturnLabelResponse {
    return {
      id: entity.id,
      expedition_id: entity.expeditionId,
      reason: entity.reason,
      status: entity.status,
      tracking_number: entity.trackingNumber ?? undefined,
      label_url: entity.labelUrl ?? undefined,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}
