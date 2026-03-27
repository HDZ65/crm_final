import { status } from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { StoreConfigEntity, StoreType } from '../../../../../domain/mondial-tv/entities/store-config.entity';
import { IStoreConfigRepository } from '../../../../../domain/mondial-tv/repositories/IStoreConfigRepository';

@Injectable()
export class StoreConfigService implements IStoreConfigRepository {
  constructor(
    @InjectRepository(StoreConfigEntity)
    private readonly repository: Repository<StoreConfigEntity>,
  ) {}

  async findById(id: string): Promise<StoreConfigEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByOrganisationAndType(keycloakGroupId: string, storeType: StoreType): Promise<StoreConfigEntity | null> {
    return this.repository.findOne({
      where: { keycloakGroupId, storeType },
    });
  }

  async findByOrganisation(keycloakGroupId: string): Promise<StoreConfigEntity[]> {
    return this.repository.find({
      where: { keycloakGroupId },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByOrganisation(keycloakGroupId: string): Promise<StoreConfigEntity[]> {
    return this.repository.find({
      where: { keycloakGroupId, active: true },
      order: { createdAt: 'DESC' },
    });
  }

  async save(entity: StoreConfigEntity): Promise<StoreConfigEntity> {
    try {
      return await this.repository.save(entity);
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation on (organisation_id, store_type)
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `Store config for organisation ${entity.keycloakGroupId} and store type ${entity.storeType} already exists`,
        });
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findAll(filters?: {
    keycloakGroupId?: string;
    storeType?: StoreType;
    active?: boolean;
  }): Promise<StoreConfigEntity[]> {
    const where: FindOptionsWhere<StoreConfigEntity> = {};
    if (filters?.keycloakGroupId) where.keycloakGroupId = filters.keycloakGroupId;
    if (filters?.storeType) where.storeType = filters.storeType;
    if (filters?.active !== undefined) where.active = filters.active;

    return this.repository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }
}
