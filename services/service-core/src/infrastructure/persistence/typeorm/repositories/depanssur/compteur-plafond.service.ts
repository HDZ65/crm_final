import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CompteurPlafondEntity } from '../../../../../domain/depanssur/entities/compteur-plafond.entity';
import type { ICompteurPlafondRepository } from '../../../../../domain/depanssur/repositories/ICompteurPlafondRepository';

@Injectable()
export class CompteurPlafondService implements ICompteurPlafondRepository {
  private readonly logger = new Logger(CompteurPlafondService.name);

  constructor(
    @InjectRepository(CompteurPlafondEntity)
    private readonly repository: Repository<CompteurPlafondEntity>,
  ) {}

  async findById(id: string): Promise<CompteurPlafondEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findCurrentByAbonnementId(abonnementId: string): Promise<CompteurPlafondEntity | null> {
    const now = new Date();
    return this.repository.findOne({
      where: {
        abonnementId,
        anneeGlissanteDebut: LessThanOrEqual(now),
        anneeGlissanteFin: MoreThanOrEqual(now),
      },
      order: { anneeGlissanteDebut: 'DESC' },
    });
  }

  async findByAbonnementId(abonnementId: string): Promise<CompteurPlafondEntity[]> {
    return this.repository.find({
      where: { abonnementId },
      order: { anneeGlissanteDebut: 'DESC' },
    });
  }

  async findAll(
    abonnementId: string,
    pagination?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string },
  ): Promise<{
    compteurs: CompteurPlafondEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const sortBy = pagination?.sortBy || 'anneeGlissanteDebut';
    const sortOrder = (pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const [compteurs, total] = await this.repository.findAndCount({
      where: { abonnementId },
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { compteurs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async update(input: any): Promise<CompteurPlafondEntity> {
    const entity = await this.findById(input.id);
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Compteur ${input.id} not found` });
    }

    if (input.nbInterventionsUtilisees ?? input.nb_interventions_utilisees !== undefined) {
      entity.nbInterventionsUtilisees = input.nbInterventionsUtilisees ?? input.nb_interventions_utilisees;
    }
    if (input.montantCumule ?? input.montant_cumule !== undefined) {
      entity.montantCumule = String(input.montantCumule ?? input.montant_cumule);
    }

    return this.repository.save(entity);
  }

  async resetCompteur(abonnementId: string, anneeGlissanteDebut: string, anneeGlissanteFin: string): Promise<CompteurPlafondEntity> {
    const entity = this.repository.create({
      abonnementId,
      anneeGlissanteDebut: new Date(anneeGlissanteDebut),
      anneeGlissanteFin: new Date(anneeGlissanteFin),
      nbInterventionsUtilisees: 0,
      montantCumule: '0',
    });
    return this.repository.save(entity);
  }

  async save(entity: CompteurPlafondEntity): Promise<CompteurPlafondEntity> {
    return this.repository.save(entity);
  }
}
