import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ReducBoxLifecycleService } from '../../../domain/reducbox/services/reducbox-lifecycle.service';
import { ReducBoxAccessRepositoryService } from '../../persistence/typeorm/repositories/reducbox';
import { ReducBoxAccessEntity } from '../../../domain/reducbox/entities/reducbox-access.entity';

@Controller()
export class ReducBoxController {
  private readonly logger = new Logger(ReducBoxController.name);

  constructor(
    private readonly lifecycleService: ReducBoxLifecycleService,
    private readonly accessRepository: ReducBoxAccessRepositoryService,
  ) {}

  @GrpcMethod('ReducBoxService', 'CreateAccess')
  async createAccess(data: { client_id: string; contrat_id: string }) {
    this.logger.log(`CreateAccess: client=${data.client_id}, contrat=${data.contrat_id}`);

    const access = await this.lifecycleService.createAccess(data.client_id, data.contrat_id);
    return { access: this.toProto(access) };
  }

  @GrpcMethod('ReducBoxService', 'SuspendAccess')
  async suspendAccess(data: { id: string }) {
    this.logger.log(`SuspendAccess: id=${data.id}`);

    try {
      const access = await this.lifecycleService.suspendAccess(data.id, 'Suspended via gRPC');
      return { access: this.toProto(access) };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('not found')) {
        throw new RpcException({ code: status.NOT_FOUND, message });
      }
      throw error;
    }
  }

  @GrpcMethod('ReducBoxService', 'RestoreAccess')
  async restoreAccess(data: { id: string }) {
    this.logger.log(`RestoreAccess: id=${data.id}`);

    try {
      const access = await this.lifecycleService.restoreAccess(data.id);
      return { access: this.toProto(access) };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('not found')) {
        throw new RpcException({ code: status.NOT_FOUND, message });
      }
      throw error;
    }
  }

  @GrpcMethod('ReducBoxService', 'GetAccessStatus')
  async getAccessStatus(data: { id: string }) {
    this.logger.log(`GetAccessStatus: id=${data.id}`);

    const access = await this.accessRepository.findById(data.id);
    if (!access) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `ReducBox access not found: ${data.id}`,
      });
    }

    return { access: this.toProto(access) };
  }

  @GrpcMethod('ReducBoxService', 'ListAccessByClient')
  async listAccessByClient(data: {
    client_id: string;
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }) {
    this.logger.log(`ListAccessByClient: client=${data.client_id}`);

    const accesses = await this.accessRepository.findByClientId(data.client_id);

    const page = data.pagination?.page || 1;
    const limit = data.pagination?.limit || 50;
    const start = (page - 1) * limit;
    const paged = accesses.slice(start, start + limit);

    return {
      accesses: paged.map((a) => this.toProto(a)),
      pagination: {
        total: accesses.length,
        page,
        limit,
        total_pages: Math.ceil(accesses.length / limit),
      },
    };
  }

  private toProto(entity: ReducBoxAccessEntity) {
    return {
      id: entity.id,
      client_id: entity.clientId,
      contrat_id: entity.contratId,
      status: this.mapStatus(entity.status),
      created_at: entity.createdAt?.toISOString() ?? '',
      suspended_at: entity.suspendedAt?.toISOString() ?? undefined,
      restored_at: entity.restoredAt?.toISOString() ?? undefined,
    };
  }

  private mapStatus(status: string): number {
    const map: Record<string, number> = {
      PENDING: 1,
      ACTIVE: 2,
      SUSPENDED: 3,
      CANCELLED: 4,
    };
    return map[status] ?? 0;
  }
}
