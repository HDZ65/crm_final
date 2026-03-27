import { status } from '@grpc/grpc-js';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CritereCQEntity } from '../../../../../domain/qualite/entities/critere-cq.entity';
import { TypeCritere } from '../../../../../domain/qualite/enums/statut-cq.enum';

@Injectable()
export class CritereCqService {
  private readonly logger = new Logger(CritereCqService.name);

  constructor(
    @InjectRepository(CritereCQEntity)
    private readonly repository: Repository<CritereCQEntity>,
  ) {}

  async findById(id: string): Promise<CritereCQEntity | null> {
    try {
      return await this.repository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(`Error finding critere cq by id: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to find critere cq',
      });
    }
  }

  async findByOrganisation(keycloakGroupId: string): Promise<CritereCQEntity[]> {
    try {
      return await this.repository.find({
        where: { keycloakGroupId },
        order: { ordre: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Error finding criteres cq by organisation: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to find criteres cq',
      });
    }
  }

  async findActifsByOrganisation(keycloakGroupId: string): Promise<CritereCQEntity[]> {
    try {
      return await this.repository.find({
        where: { keycloakGroupId, actif: true },
        order: { ordre: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Error finding actifs criteres cq: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to find actifs criteres cq',
      });
    }
  }

  async create(
    keycloakGroupId: string,
    code: string,
    nom: string,
    typeCritere: TypeCritere,
    obligatoire: boolean = true,
    ordre: number = 0,
    description?: string,
  ): Promise<CritereCQEntity> {
    try {
      const critere = this.repository.create({
        keycloakGroupId,
        code,
        nom,
        typeCritere,
        obligatoire,
        ordre,
        description: description ?? null,
        actif: true,
      });
      return await this.repository.save(critere);
    } catch (error) {
      this.logger.error(`Error creating critere cq: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to create critere cq',
      });
    }
  }

  async update(id: string, updates: Partial<CritereCQEntity>): Promise<CritereCQEntity> {
    try {
      await this.repository.update(id, updates);
      const updated = await this.findById(id);
      if (!updated) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Critere cq not found after update',
        });
      }
      return updated;
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error(`Error updating critere cq: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to update critere cq',
      });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      this.logger.error(`Error deleting critere cq: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to delete critere cq',
      });
    }
  }
}
