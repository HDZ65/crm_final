import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WooCommerceEntityType,
  WooCommerceMappingEntity,
} from '../../../../../domain/woocommerce/entities/woocommerce-mapping.entity';
import { IWooCommerceMappingRepository } from '../../../../../domain/woocommerce/repositories/IWooCommerceMappingRepository';

@Injectable()
export class WooCommerceMappingService implements IWooCommerceMappingRepository {
  constructor(
    @InjectRepository(WooCommerceMappingEntity)
    private readonly repository: Repository<WooCommerceMappingEntity>,
  ) {}

  async findById(id: string): Promise<WooCommerceMappingEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByWooId(
    keycloakGroupId: string,
    entityType: WooCommerceEntityType,
    wooId: string,
  ): Promise<WooCommerceMappingEntity | null> {
    return this.repository.findOne({
      where: { keycloakGroupId, entityType, wooId },
    });
  }

  async findByCrmEntityId(crmEntityId: string): Promise<WooCommerceMappingEntity[]> {
    return this.repository.find({ where: { crmEntityId } });
  }

  async findAll(filters?: {
    keycloakGroupId?: string;
    entityType?: WooCommerceEntityType;
  }): Promise<WooCommerceMappingEntity[]> {
    const where: Record<string, any> = {};
    if (filters?.keycloakGroupId) where.keycloakGroupId = filters.keycloakGroupId;
    if (filters?.entityType) where.entityType = filters.entityType;

    return this.repository.find({ where, order: { createdAt: 'DESC' } });
  }

  async save(entity: WooCommerceMappingEntity): Promise<WooCommerceMappingEntity> {
    return this.repository.save(entity);
  }

  async findByConfigId(configId: string, entityType: WooCommerceEntityType): Promise<WooCommerceMappingEntity[]> {
    return this.repository.find({
      where: { configId, entityType },
    });
  }

  async deleteByConfigId(configId: string, entityType: WooCommerceEntityType): Promise<void> {
    await this.repository.delete({ configId, entityType });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
