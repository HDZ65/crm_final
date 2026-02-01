import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import type {
  CreateGrilleTarifaireRequest,
  UpdateGrilleTarifaireRequest,
  ListGrillesTarifairesRequest,
  GetGrilleTarifaireRequest,
  GetGrilleTarifaireActiveRequest,
  DeleteGrilleTarifaireRequest,
  SetGrilleParDefautRequest,
} from '@crm/proto/products';
import { GrilleTarifaireEntity } from './entities/grille-tarifaire.entity';

@Injectable()
export class GrilleTarifaireService {
  private readonly logger = new Logger(GrilleTarifaireService.name);

  constructor(
    @InjectRepository(GrilleTarifaireEntity)
    private readonly grilleRepository: Repository<GrilleTarifaireEntity>,
  ) {}

  async create(input: CreateGrilleTarifaireRequest): Promise<GrilleTarifaireEntity> {
    this.logger.log(`Creating grille tarifaire: ${input.nom}`);

    const dateDebut = input.dateDebut ? new Date(input.dateDebut) : null;
    const dateFin = input.dateFin ? new Date(input.dateFin) : null;

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
      dateDebut,
      dateFin,
      estParDefaut: input.estParDefaut ?? false,
      actif: true,
    });

    return this.grilleRepository.save(grille);
  }

  async update(input: UpdateGrilleTarifaireRequest): Promise<GrilleTarifaireEntity> {
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
    if (input.dateDebut !== undefined) grille.dateDebut = input.dateDebut ? new Date(input.dateDebut) : null;
    if (input.dateFin !== undefined) grille.dateFin = input.dateFin ? new Date(input.dateFin) : null;
    if (input.estParDefaut !== undefined) grille.estParDefaut = input.estParDefaut;
    if (input.actif !== undefined) grille.actif = input.actif;

    return this.grilleRepository.save(grille);
  }

  async findById(input: GetGrilleTarifaireRequest): Promise<GrilleTarifaireEntity> {
    const grille = await this.grilleRepository.findOne({
      where: { id: input.id },
      relations: ['prixProduits', 'prixProduits.produit'],
    });

    if (!grille) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Grille tarifaire ${input.id} not found`,
      });
    }

    return grille;
  }

  async findActive(input: GetGrilleTarifaireActiveRequest): Promise<GrilleTarifaireEntity> {
    const date = input.date ? new Date(input.date) : new Date();
    // First try to find a grid valid for the given date
    let grille = await this.grilleRepository.findOne({
      where: {
        organisationId: input.organisationId,
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
          organisationId: input.organisationId,
          actif: true,
          estParDefaut: true,
        },
        relations: ['prixProduits', 'prixProduits.produit'],
      });
    }

    if (!grille) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `No active grille tarifaire found for organisation ${input.organisationId}`,
      });
    }

    return grille;
  }

  async findAll(input: ListGrillesTarifairesRequest): Promise<{
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

  async delete(input: DeleteGrilleTarifaireRequest): Promise<boolean> {
    const grille = await this.grilleRepository.findOne({ where: { id: input.id } });
    if (grille?.estParDefaut) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Cannot delete the default pricing grid',
      });
    }
    const result = await this.grilleRepository.delete(input.id);
    return (result.affected ?? 0) > 0;
  }

  async setParDefaut(input: SetGrilleParDefautRequest): Promise<GrilleTarifaireEntity> {
    const grille = await this.findById({ id: input.id });

    // Unset other defaults
    await this.grilleRepository.update(
      { organisationId: grille.organisationId, estParDefaut: true },
      { estParDefaut: false },
    );

    grille.estParDefaut = true;
    return this.grilleRepository.save(grille);
  }
}
