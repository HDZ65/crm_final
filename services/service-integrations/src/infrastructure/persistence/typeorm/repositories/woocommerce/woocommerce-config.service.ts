import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WooCommerceConfigEntity } from '../../../../../domain/woocommerce/entities/woocommerce-config.entity';
import { IWooCommerceConfigRepository } from '../../../../../domain/woocommerce/repositories/IWooCommerceConfigRepository';

@Injectable()
export class WooCommerceConfigService implements IWooCommerceConfigRepository {
  constructor(
    @InjectRepository(WooCommerceConfigEntity)
    private readonly repository: Repository<WooCommerceConfigEntity>,
  ) {}

  async findById(id: string): Promise<WooCommerceConfigEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByOrganisationId(keycloakGroupId: string): Promise<WooCommerceConfigEntity | null> {
    return this.repository.findOne({ where: { keycloakGroupId } });
  }

  async findByOrganisation(keycloakGroupId: string): Promise<WooCommerceConfigEntity | null> {
    return this.repository.findOne({ where: { keycloakGroupId, active: true } });
  }

  async findAllActive(): Promise<WooCommerceConfigEntity[]> {
    return this.repository.find({ where: { active: true } });
  }

  async findAllByOrganisation(keycloakGroupId: string): Promise<WooCommerceConfigEntity[]> {
    return this.repository.find({
      where: { keycloakGroupId },
      order: { createdAt: 'ASC' },
    });
  }

  async save(entity: WooCommerceConfigEntity): Promise<WooCommerceConfigEntity> {
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
