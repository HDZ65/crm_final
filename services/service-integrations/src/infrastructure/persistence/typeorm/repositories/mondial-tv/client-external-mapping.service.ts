import { status } from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import {
  ClientExternalMappingEntity,
  SourceSystem,
} from '../../../../../domain/mondial-tv/entities/client-external-mapping.entity';
import { IClientExternalMappingRepository } from '../../../../../domain/mondial-tv/repositories/IClientExternalMappingRepository';

@Injectable()
export class ClientExternalMappingService implements IClientExternalMappingRepository {
  constructor(
    @InjectRepository(ClientExternalMappingEntity)
    private readonly repository: Repository<ClientExternalMappingEntity>,
  ) {}

  async findById(id: string): Promise<ClientExternalMappingEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByImsUserId(keycloakGroupId: string, imsUserId: string): Promise<ClientExternalMappingEntity | null> {
    return this.repository.findOne({
      where: { keycloakGroupId, imsUserId },
    });
  }

  async findByClientId(keycloakGroupId: string, clientId: string): Promise<ClientExternalMappingEntity[]> {
    return this.repository.find({
      where: { keycloakGroupId, clientId },
    });
  }

  async findByStoreCustomerId(
    keycloakGroupId: string,
    storeCustomerId: string,
  ): Promise<ClientExternalMappingEntity | null> {
    return this.repository.findOne({
      where: { keycloakGroupId, storeCustomerId },
    });
  }

  async findBySourceSystem(
    keycloakGroupId: string,
    sourceSystem: SourceSystem,
  ): Promise<ClientExternalMappingEntity[]> {
    return this.repository.find({
      where: { keycloakGroupId, sourceSystem },
    });
  }

  async save(entity: ClientExternalMappingEntity): Promise<ClientExternalMappingEntity> {
    try {
      return await this.repository.save(entity);
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `External mapping with ims_user_id ${entity.imsUserId} already exists for this organisation`,
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
    clientId?: string;
    sourceSystem?: SourceSystem;
    sourceChannel?: string;
  }): Promise<ClientExternalMappingEntity[]> {
    const where: FindOptionsWhere<ClientExternalMappingEntity> = {};
    if (filters?.keycloakGroupId) where.keycloakGroupId = filters.keycloakGroupId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.sourceSystem) where.sourceSystem = filters.sourceSystem;
    if (filters?.sourceChannel) where.sourceChannel = filters.sourceChannel;

    return this.repository.find({ where });
  }
}
