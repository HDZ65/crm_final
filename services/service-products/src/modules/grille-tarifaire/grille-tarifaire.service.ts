import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { GrilleTarifaireEntity } from './entities/grille-tarifaire.entity';

interface CreateGrilleTarifaireInput {
  organisationId: string;
  nom: string;
  description?: string;
  dateDebut?: Date;
  dateFin?: Date;
  estParDefaut?: boolean;
}

interface UpdateGrilleTarifaireInput {
  id: string;
  nom?: string;
  description?: string;
  dateDebut?: Date;
  dateFin?: Date;
  estParDefaut?: boolean;
  actif?: boolean;
}

interface ListGrillesTarifairesInput {
  organisationId: string;
  actif?: boolean;
  estParDefaut?: boolean;
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  };
}

@Injectable()
export class GrilleTarifaireService {
  private readonly logger = new Logger(GrilleTarifaireService.name);

  constructor(
    @InjectRepository(GrilleTarifaireEntity)
    private readonly grilleRepository: Repository<GrilleTarifaireEntity>,
  ) {}

  async create(input: CreateGrilleTarifaireInput): Promise<GrilleTarifaireEntity> {
    this.logger.log(`Creating grille tarifaire: ${input.nom}`);

    // If this is the default grid, unset other defaults
    if (input.estParDefaut) {
      await this.grilleRepository.update(
        { organisationId: input.organisationId, estParDefaut: true },
        { estParDefaut: false },
      );
    }

    const grille = this.grilleRepository.create({
      organisationId: input.organisationId,
      nom: input.nom,
      description: input.description || null,
      dateDebut: input.dateDebut || null,
      dateFin: input.dateFin || null,
      estParDefaut: input.estParDefaut ?? false,
      actif: true,
    });

    return this.grilleRepository.save(grille);
  }

  async update(input: UpdateGrilleTarifaireInput): Promise<GrilleTarifaireEntity> {
    const grille = await this.grilleRepository.findOne({
      where: { id: input.id },
    });

    if (!grille) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Grille tarifaire ${input.id} not found`,
      });
    }

    // If setting as default, unset other defaults
    if (input.estParDefaut === true && !grille.estParDefaut) {
      await this.grilleRepository.update(
        { organisationId: grille.organisationId, estParDefaut: true },
        { estParDefaut: false },
      );
    }

    if (input.nom !== undefined) grille.nom = input.nom;
    if (input.description !== undefined) grille.description = input.description || null;
    if (input.dateDebut !== undefined) grille.dateDebut = input.dateDebut;
    if (input.dateFin !== undefined) grille.dateFin = input.dateFin;
    if (input.estParDefaut !== undefined) grille.estParDefaut = input.estParDefaut;
    if (input.actif !== undefined) grille.actif = input.actif;

    return this.grilleRepository.save(grille);
  }

  async findById(id: string): Promise<GrilleTarifaireEntity> {
    const grille = await this.grilleRepository.findOne({
      where: { id },
      relations: ['prixProduits', 'prixProduits.produit'],
    });

    if (!grille) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Grille tarifaire ${id} not found`,
      });
    }

    return grille;
  }

  async findActive(organisationId: string, date: Date): Promise<GrilleTarifaireEntity> {
    // First try to find a grid valid for the given date
    let grille = await this.grilleRepository.findOne({
      where: {
        organisationId,
        actif: true,
        dateDebut: Or(LessThanOrEqual(date), IsNull()),
        dateFin: Or(MoreThanOrEqual(date), IsNull()),
      },
      relations: ['prixProduits', 'prixProduits.produit'],
      order: { estParDefaut: 'DESC', createdAt: 'DESC' },
    });

    // If no date-specific grid, fall back to default
    if (!grille) {
      grille = await this.grilleRepository.findOne({
        where: {
          organisationId,
          actif: true,
          estParDefaut: true,
        },
        relations: ['prixProduits', 'prixProduits.produit'],
      });
    }

    if (!grille) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `No active grille tarifaire found for organisation ${organisationId}`,
      });
    }

    return grille;
  }

  async findAll(input: ListGrillesTarifairesInput): Promise<{
    grilles: GrilleTarifaireEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 20;
    const sortBy = input.pagination?.sortBy || 'nom';
    const sortOrder = (input.pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'ASC';

    const queryBuilder = this.grilleRepository
      .createQueryBuilder('grille')
      .where('grille.organisationId = :organisationId', {
        organisationId: input.organisationId,
      });

    if (input.actif !== undefined) {
      queryBuilder.andWhere('grille.actif = :actif', { actif: input.actif });
    }

    if (input.estParDefaut !== undefined) {
      queryBuilder.andWhere('grille.estParDefaut = :estParDefaut', {
        estParDefaut: input.estParDefaut,
      });
    }

    const [grilles, total] = await queryBuilder
      .orderBy(`grille.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      grilles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async delete(id: string): Promise<boolean> {
    const grille = await this.grilleRepository.findOne({ where: { id } });
    if (grille?.estParDefaut) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Cannot delete the default pricing grid',
      });
    }
    const result = await this.grilleRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async setParDefaut(id: string): Promise<GrilleTarifaireEntity> {
    const grille = await this.findById(id);

    // Unset other defaults
    await this.grilleRepository.update(
      { organisationId: grille.organisationId, estParDefaut: true },
      { estParDefaut: false },
    );

    grille.estParDefaut = true;
    return this.grilleRepository.save(grille);
  }
}
