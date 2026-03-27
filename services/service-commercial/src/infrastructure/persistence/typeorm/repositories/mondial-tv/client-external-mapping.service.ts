import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ClientExternalMappingEntity, SourceSystem } from '../../../../../domain/mondial-tv/entities/client-external-mapping.entity';
import { IClientExternalMappingRepository } from '../../../../../domain/mondial-tv/repositories/IClientExternalMappingRepository';

@Injectable()
export class ClientExternalMappingService implements IClientExternalMappingRepository {
  private readonly logger = new Logger(ClientExternalMappingService.name);

  constructor(
    @InjectRepository(ClientExternalMappingEntity)
    private readonly repository: Repository<ClientExternalMappingEntity>,
  ) {}

  async findById(id: string): Promise<ClientExternalMappingEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByImsUserId(organisationId: string, imsUserId: string): Promise<ClientExternalMappingEntity | null> {
    return this.repository.findOne({
      where: { organisationId, imsUserId },
    });
  }

  async findByClientId(organisationId: string, clientId: string): Promise<ClientExternalMappingEntity[]> {
    return this.repository.find({
      where: { organisationId, clientId },
    });
  }

  async findByStoreCustomerId(organisationId: string, storeCustomerId: string): Promise<ClientExternalMappingEntity | null> {
    return this.repository.findOne({
      where: { organisationId, storeCustomerId },
    });
  }

  async findBySourceSystem(organisationId: string, sourceSystem: SourceSystem): Promise<ClientExternalMappingEntity[]> {
    return this.repository.find({
      where: { organisationId, sourceSystem },
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
    organisationId?: string;
    clientId?: string;
    sourceSystem?: SourceSystem;
    sourceChannel?: string;
  }): Promise<ClientExternalMappingEntity[]> {
    const where: FindOptionsWhere<ClientExternalMappingEntity> = {};
    if (filters?.organisationId) where.organisationId = filters.organisationId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.sourceSystem) where.sourceSystem = filters.sourceSystem;
    if (filters?.sourceChannel) where.sourceChannel = filters.sourceChannel;

    return this.repository.find({ where });
  }
}
