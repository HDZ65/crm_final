import { status } from '@grpc/grpc-js';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegleCQEntity } from '../../../../../domain/qualite/entities/regle-cq.entity';
import { RegleCQCritereEntity } from '../../../../../domain/qualite/entities/regle-cq-critere.entity';

@Injectable()
export class RegleCqService {
  private readonly logger = new Logger(RegleCqService.name);

  constructor(
    @InjectRepository(RegleCQEntity)
    private readonly repository: Repository<RegleCQEntity>,
    @InjectRepository(RegleCQCritereEntity)
    private readonly regleCritereRepository: Repository<RegleCQCritereEntity>,
  ) {}

  async findById(id: string): Promise<RegleCQEntity | null> {
    try {
      return await this.repository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(`Error finding regle cq by id: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to find regle cq',
      });
    }
  }

  async findByOrganisation(keycloakGroupId: string): Promise<RegleCQEntity[]> {
    try {
      return await this.repository.find({
        where: { keycloakGroupId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error finding regles cq by organisation: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to find regles cq',
      });
    }
  }

  async findActifByOrganisationAndTypeProduit(
    keycloakGroupId: string,
    typeProduit: string,
  ): Promise<RegleCQEntity | null> {
    try {
      return await this.repository.findOne({
        where: { keycloakGroupId, typeProduit, actif: true },
      });
    } catch (error) {
      this.logger.error(`Error finding regle cq by organisation and type produit: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to find regle cq',
      });
    }
  }

  async create(
    keycloakGroupId: string,
    typeProduit: string,
    scoreMinimum: number = 80,
    autoValidation: boolean = false,
  ): Promise<RegleCQEntity> {
    try {
      const regle = this.repository.create({
        keycloakGroupId,
        typeProduit,
        scoreMinimum,
        autoValidation,
        actif: true,
      });
      return await this.repository.save(regle);
    } catch (error) {
      this.logger.error(`Error creating regle cq: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to create regle cq',
      });
    }
  }

  async update(id: string, updates: Partial<RegleCQEntity>): Promise<RegleCQEntity> {
    try {
      await this.repository.update(id, updates);
      const updated = await this.findById(id);
      if (!updated) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Regle cq not found after update',
        });
      }
      return updated;
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error(`Error updating regle cq: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to update regle cq',
      });
    }
  }

  async addCritere(regleId: string, critereId: string): Promise<RegleCQCritereEntity> {
    try {
      const regleCritere = this.regleCritereRepository.create({ regleId, critereId });
      return await this.regleCritereRepository.save(regleCritere);
    } catch (error) {
      this.logger.error(`Error adding critere to regle cq: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to add critere to regle cq',
      });
    }
  }

  async removeCritere(regleId: string, critereId: string): Promise<void> {
    try {
      await this.regleCritereRepository.delete({ regleId, critereId });
    } catch (error) {
      this.logger.error(`Error removing critere from regle cq: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to remove critere from regle cq',
      });
    }
  }
}
