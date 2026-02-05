import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  RegleRelanceEntity,
  RelanceDeclencheur,
  RelanceActionType,
  Priorite,
} from './entities/regle-relance.entity';

interface CreateRegleRelanceInput {
  organisationId: string;
  nom: string;
  description?: string;
  declencheur: RelanceDeclencheur;
  delaiJours: number;
  actionType: RelanceActionType;
  prioriteTache?: Priorite;
  templateEmailId?: string;
  templateTitreTache?: string;
  templateDescriptionTache?: string;
  assigneParDefaut?: string;
  ordre?: number;
}

interface UpdateRegleRelanceInput {
  id: string;
  nom?: string;
  description?: string;
  declencheur?: RelanceDeclencheur;
  delaiJours?: number;
  actionType?: RelanceActionType;
  prioriteTache?: Priorite;
  templateEmailId?: string;
  templateTitreTache?: string;
  templateDescriptionTache?: string;
  assigneParDefaut?: string;
  actif?: boolean;
  ordre?: number;
}

interface ListReglesRelanceInput {
  organisationId: string;
  actif?: boolean;
  declencheur?: RelanceDeclencheur;
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  };
}

@Injectable()
export class RegleRelanceService {
  private readonly logger = new Logger(RegleRelanceService.name);

  constructor(
    @InjectRepository(RegleRelanceEntity)
    private readonly regleRepository: Repository<RegleRelanceEntity>,
  ) {}

  async create(input: CreateRegleRelanceInput): Promise<RegleRelanceEntity> {
    this.logger.log(`Creating regle relance: ${input.nom}`);

    const regle = this.regleRepository.create({
      organisationId: input.organisationId,
      nom: input.nom,
      description: input.description || null,
      declencheur: input.declencheur,
      delaiJours: input.delaiJours,
      actionType: input.actionType,
      prioriteTache: input.prioriteTache || Priorite.MOYENNE,
      templateEmailId: input.templateEmailId || null,
      templateTitreTache: input.templateTitreTache || null,
      templateDescriptionTache: input.templateDescriptionTache || null,
      assigneParDefaut: input.assigneParDefaut || null,
      ordre: input.ordre ?? 1,
      actif: true,
    });

    return this.regleRepository.save(regle);
  }

  async update(input: UpdateRegleRelanceInput): Promise<RegleRelanceEntity> {
    const regle = await this.regleRepository.findOne({
      where: { id: input.id },
    });

    if (!regle) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Regle relance ${input.id} not found`,
      });
    }

    if (input.nom !== undefined) regle.nom = input.nom;
    if (input.description !== undefined) regle.description = input.description || null;
    if (input.declencheur !== undefined) regle.declencheur = input.declencheur;
    if (input.delaiJours !== undefined) regle.delaiJours = input.delaiJours;
    if (input.actionType !== undefined) regle.actionType = input.actionType;
    if (input.prioriteTache !== undefined) regle.prioriteTache = input.prioriteTache;
    if (input.templateEmailId !== undefined) regle.templateEmailId = input.templateEmailId || null;
    if (input.templateTitreTache !== undefined)
      regle.templateTitreTache = input.templateTitreTache || null;
    if (input.templateDescriptionTache !== undefined)
      regle.templateDescriptionTache = input.templateDescriptionTache || null;
    if (input.assigneParDefaut !== undefined)
      regle.assigneParDefaut = input.assigneParDefaut || null;
    if (input.actif !== undefined) regle.actif = input.actif;
    if (input.ordre !== undefined) regle.ordre = input.ordre;

    return this.regleRepository.save(regle);
  }

  async findById(id: string): Promise<RegleRelanceEntity> {
    const regle = await this.regleRepository.findOne({
      where: { id },
    });

    if (!regle) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Regle relance ${id} not found`,
      });
    }

    return regle;
  }

  async findAll(input: ListReglesRelanceInput): Promise<{
    regles: RegleRelanceEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 20;
    const sortBy = input.pagination?.sortBy || 'ordre';
    const sortOrder = (input.pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'ASC';

    const queryBuilder = this.regleRepository
      .createQueryBuilder('regle')
      .where('regle.organisationId = :organisationId', {
        organisationId: input.organisationId,
      });

    if (input.actif !== undefined) {
      queryBuilder.andWhere('regle.actif = :actif', { actif: input.actif });
    }

    if (input.declencheur) {
      queryBuilder.andWhere('regle.declencheur = :declencheur', {
        declencheur: input.declencheur,
      });
    }

    const [regles, total] = await queryBuilder
      .orderBy(`regle.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      regles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findActives(organisationId: string): Promise<RegleRelanceEntity[]> {
    return this.regleRepository.find({
      where: { organisationId, actif: true },
      order: { ordre: 'ASC' },
    });
  }

  async findByDeclencheur(
    organisationId: string,
    declencheur: RelanceDeclencheur,
  ): Promise<RegleRelanceEntity[]> {
    return this.regleRepository.find({
      where: { organisationId, declencheur, actif: true },
      order: { ordre: 'ASC' },
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.regleRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async activate(id: string): Promise<RegleRelanceEntity> {
    const regle = await this.findById(id);
    regle.actif = true;
    return this.regleRepository.save(regle);
  }

  async deactivate(id: string): Promise<RegleRelanceEntity> {
    const regle = await this.findById(id);
    regle.actif = false;
    return this.regleRepository.save(regle);
  }
}
