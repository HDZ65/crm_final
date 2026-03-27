import { NatsService } from '@crm/shared-kernel';
import { status } from '@grpc/grpc-js';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ControleQualiteEntity } from '../../../../../domain/qualite/entities/controle-qualite.entity';
import { StatutCQEntity } from '../../../../../domain/qualite/entities/statut-cq.entity';
import { StatutCQ } from '../../../../../domain/qualite/enums/statut-cq.enum';

@Injectable()
export class ControleQualiteService {
  private readonly logger = new Logger(ControleQualiteService.name);

  constructor(
    @InjectRepository(ControleQualiteEntity)
    private readonly repository: Repository<ControleQualiteEntity>,
    @InjectRepository(StatutCQEntity)
    private readonly statutRepository: Repository<StatutCQEntity>,
    @Optional() private readonly natsService?: NatsService,
  ) {}

  async findById(id: string): Promise<ControleQualiteEntity | null> {
    try {
      return await this.repository.findOne({
        where: { id },
        relations: ['resultats'],
      });
    } catch (error) {
      this.logger.error(`Error finding controle qualite by id: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to find controle qualite',
      });
    }
  }

  async findByContratId(contratId: string): Promise<ControleQualiteEntity | null> {
    try {
      return await this.repository.findOne({
        where: { contratId },
        relations: ['resultats'],
        order: { dateSoumission: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error finding controle qualite by contrat id: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to find controle qualite by contrat',
      });
    }
  }

  async findByStatut(
    keycloakGroupId: string,
    statut: StatutCQ,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ControleQualiteEntity[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await this.repository.findAndCount({
        where: { keycloakGroupId, statut },
        relations: ['resultats'],
        order: { dateSoumission: 'DESC' },
        skip,
        take: limit,
      });
      return { data, total };
    } catch (error) {
      this.logger.error(`Error finding controle qualite by statut: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to find controle qualite by statut',
      });
    }
  }

  async create(
    keycloakGroupId: string,
    contratId: string,
    statut: StatutCQ = StatutCQ.EN_ATTENTE,
  ): Promise<ControleQualiteEntity> {
    try {
      const controle = this.repository.create({
        keycloakGroupId,
        contratId,
        statut,
        dateSoumission: new Date(),
      });
      return await this.repository.save(controle);
    } catch (error) {
      this.logger.error(`Error creating controle qualite: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to create controle qualite',
      });
    }
  }

  async update(id: string, updates: Partial<ControleQualiteEntity>): Promise<ControleQualiteEntity> {
    try {
      await this.repository.update(id, updates);
      const updated = await this.findById(id);
      if (!updated) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Controle qualite not found after update',
        });
      }
      return updated;
    } catch (error) {
      this.logger.error(`Error updating controle qualite: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to update controle qualite',
      });
    }
  }

  async getStatutByCode(code: string): Promise<StatutCQEntity | null> {
    try {
      return await this.statutRepository.findOne({ where: { code } });
    } catch (error) {
      this.logger.error(`Error finding statut cq by code: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to find statut cq',
      });
    }
  }

  async validerControle(id: string, validateurId: string, score: number): Promise<ControleQualiteEntity> {
    try {
      const controle = await this.findById(id);
      if (!controle) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Controle qualite ${id} not found`,
        });
      }

      controle.statut = StatutCQ.VALIDE;
      controle.validateurId = validateurId;
      controle.score = score;
      controle.dateValidation = new Date();
      const updated = await this.repository.save(controle);

      // Publish NATS event for CQ→Commission bridge
      if (this.natsService?.isConnected()) {
        await this.natsService.publish('contrat.cq.validated', {
          contrat_id: controle.contratId,
          organisation_id: controle.keycloakGroupId,
          validateur_id: validateurId,
          score,
          timestamp: new Date().toISOString(),
        });
        this.logger.log(`Published contrat.cq.validated for contrat ${controle.contratId}`);
      } else {
        this.logger.warn(
          `NATS not available — skipping contrat.cq.validated publish for contrat ${controle.contratId}`,
        );
      }

      return updated;
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error(`Error validating controle qualite: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to validate controle qualite',
      });
    }
  }

  async rejeterControle(id: string, motif: string): Promise<ControleQualiteEntity> {
    try {
      const controle = await this.findById(id);
      if (!controle) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Controle qualite ${id} not found`,
        });
      }

      controle.statut = StatutCQ.REJETE;
      controle.motifRejet = motif;
      controle.dateValidation = new Date();
      const updated = await this.repository.save(controle);

      // Publish NATS event for CQ→Commission bridge
      if (this.natsService?.isConnected()) {
        await this.natsService.publish('contrat.cq.rejected', {
          contrat_id: controle.contratId,
          organisation_id: controle.keycloakGroupId,
          motif,
          timestamp: new Date().toISOString(),
        });
        this.logger.log(`Published contrat.cq.rejected for contrat ${controle.contratId}`);
      } else {
        this.logger.warn(`NATS not available — skipping contrat.cq.rejected publish for contrat ${controle.contratId}`);
      }

      return updated;
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error(`Error rejecting controle qualite: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to reject controle qualite',
      });
    }
  }

  async getAllStatuts(): Promise<StatutCQEntity[]> {
    try {
      return await this.statutRepository.find({
        order: { ordreAffichage: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Error finding all statuts cq: ${error}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to find statuts cq',
      });
    }
  }
}
