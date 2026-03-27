import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { WooCommerceMappingService } from '../../persistence/typeorm/repositories/woocommerce/woocommerce-mapping.service';
import { WooCommerceMappingEntity, WooCommerceEntityType } from '../../../domain/woocommerce/entities/woocommerce-mapping.entity';

@Controller()
export class WooCommerceMappingController {
  private readonly logger = new Logger(WooCommerceMappingController.name);

  constructor(private readonly mappingService: WooCommerceMappingService) {}

  private toProto(entity: WooCommerceMappingEntity) {
    return {
      id: entity.id,
      organisation_id: entity.organisationId,
      entity_type: entity.entityType,
      woo_id: entity.wooId,
      crm_entity_id: entity.crmEntityId,
      config_id: entity.configId ?? '',
      last_synced_at: entity.lastSyncedAt?.toISOString() ?? '',
      created_at: entity.createdAt?.toISOString() ?? '',
      updated_at: entity.updatedAt?.toISOString() ?? '',
    };
  }

  @GrpcMethod('WooCommerceMappingService', 'List')
  async list(data: { organisation_id: string; entity_type?: string }) {
    const entityType = data.entity_type
      ? WooCommerceEntityType[data.entity_type as keyof typeof WooCommerceEntityType]
      : undefined;
    const mappings = await this.mappingService.findAll({
      organisationId: data.organisation_id,
      entityType,
    });
    return { mappings: mappings.map((m) => this.toProto(m)) };
  }
}
