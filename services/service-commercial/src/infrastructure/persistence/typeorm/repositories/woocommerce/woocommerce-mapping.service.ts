import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WooCommerceMappingEntity,
  WooCommerceEntityType,
} from '../../../../../domain/woocommerce/entities/woocommerce-mapping.entity';
import { IWooCommerceMappingRepository } from '../../../../../domain/woocommerce/repositories/IWooCommerceMappingRepository';

@Injectable()
export class WooCommerceMappingService implements IWooCommerceMappingRepository {
  private readonly logger = new Logger(WooCommerceMappingService.name);

  constructor(
    @InjectRepository(WooCommerceMappingEntity)
    private readonly repository: Repository<WooCommerceMappingEntity>,
  ) {}

  async findById(id: string): Promise<WooCommerceMappingEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByWooId(
    organisationId: string,
    entityType: WooCommerceEntityType,
    wooId: string,
  ): Promise<WooCommerceMappingEntity | null> {
    return this.repository.findOne({
      where: { organisationId, entityType, wooId },
    });
  }

  async findByCrmEntityId(crmEntityId: string): Promise<WooCommerceMappingEntity[]> {
    return this.repository.find({ where: { crmEntityId } });
  }

  async findAll(filters?: {
    organisationId?: string;
    entityType?: WooCommerceEntityType;
  }): Promise<WooCommerceMappingEntity[]> {
    const where: Record<string, any> = {};
    if (filters?.organisationId) where.organisationId = filters.organisationId;
    if (filters?.entityType) where.entityType = filters.entityType;

    return this.repository.find({ where, order: { createdAt: 'DESC' } });
  }

  async save(entity: WooCommerceMappingEntity): Promise<WooCommerceMappingEntity> {
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
