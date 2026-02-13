import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { WooCommerceConfigService } from '../../persistence/typeorm/repositories/woocommerce/woocommerce-config.service';
import { WooCommerceConfigEntity } from '../../../domain/woocommerce/entities/woocommerce-config.entity';

@Controller()
export class WooCommerceConfigController {
  private readonly logger = new Logger(WooCommerceConfigController.name);

  constructor(private readonly configService: WooCommerceConfigService) {}

  // Helper: entity → proto response
  private toProto(entity: WooCommerceConfigEntity) {
    return {
      id: entity.id,
      organisation_id: entity.organisationId,
      store_url: entity.storeUrl,
      consumer_key: '', // hashed, don't expose
      consumer_secret: '', // hashed, don't expose
      webhook_secret: entity.webhookSecret,
      sync_products: false, // not in entity yet
      sync_orders: false,
      sync_customers: false,
      active: entity.active,
      last_sync_at: entity.lastSyncAt?.toISOString() ?? '',
      created_at: entity.createdAt?.toISOString() ?? '',
      updated_at: entity.updatedAt?.toISOString() ?? '',
    };
  }

  @GrpcMethod('WooCommerceConfigService', 'GetByOrganisation')
  async getByOrganisation(data: { organisation_id: string }) {
    const entity = await this.configService.findByOrganisationId(data.organisation_id);
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `WooCommerce config not found for organisation ${data.organisation_id}`,
      });
    }
    return this.toProto(entity);
  }

  @GrpcMethod('WooCommerceConfigService', 'Get')
  async get(data: { id: string }) {
    const entity = await this.configService.findById(data.id);
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `WooCommerce config not found: ${data.id}`,
      });
    }
    return this.toProto(entity);
  }

  @GrpcMethod('WooCommerceConfigService', 'Create')
  async create(data: {
    organisation_id: string;
    store_url: string;
    consumer_key: string;
    consumer_secret: string;
    webhook_secret: string;
    sync_products: boolean;
    sync_orders: boolean;
    sync_customers: boolean;
  }) {
    const entity = new WooCommerceConfigEntity();
    entity.organisationId = data.organisation_id;
    entity.storeUrl = data.store_url;
    entity.consumerKeyHash = data.consumer_key; // TODO: hash before storing
    entity.consumerSecretHash = data.consumer_secret; // TODO: hash before storing
    entity.webhookSecret = data.webhook_secret;
    entity.active = true;
    const saved = await this.configService.save(entity);
    return this.toProto(saved);
  }

  @GrpcMethod('WooCommerceConfigService', 'Update')
  async update(data: {
    id: string;
    store_url: string;
    consumer_key: string;
    consumer_secret: string;
    webhook_secret: string;
    sync_products: boolean;
    sync_orders: boolean;
    sync_customers: boolean;
    active: boolean;
  }) {
    const entity = await this.configService.findById(data.id);
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `WooCommerce config not found: ${data.id}`,
      });
    }
    if (data.store_url) entity.storeUrl = data.store_url;
    if (data.consumer_key) entity.consumerKeyHash = data.consumer_key; // TODO: hash
    if (data.consumer_secret) entity.consumerSecretHash = data.consumer_secret; // TODO: hash
    if (data.webhook_secret) entity.webhookSecret = data.webhook_secret;
    entity.active = data.active;
    const saved = await this.configService.save(entity);
    return this.toProto(saved);
  }

  @GrpcMethod('WooCommerceConfigService', 'Delete')
  async delete(data: { id: string }) {
    await this.configService.delete(data.id);
    return { success: true };
  }

  @GrpcMethod('WooCommerceConfigService', 'TestConnection')
  async testConnection(data: { organisation_id: string }) {
    const entity = await this.configService.findByOrganisationId(data.organisation_id);
    if (!entity) {
      return {
        success: false,
        message: 'Configuration not found',
        store_name: '',
        woocommerce_version: '',
      };
    }
    // TODO: Actually test the WooCommerce API connection
    return {
      success: true,
      message: 'Connection test not yet implemented',
      store_name: entity.storeUrl,
      woocommerce_version: '',
    };
  }
}
