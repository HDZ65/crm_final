import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import type {
  CreatePrixProduitRequest,
  UpdatePrixProduitRequest,
  ListPrixProduitsRequest,
  GetPrixProduitRequest,
  GetPrixForProduitRequest,
  DeletePrixProduitRequest,
  BulkCreatePrixProduitsRequest,
} from '@crm/proto/products';
import { PrixProduitEntity } from './entities/prix-produit.entity';

@Injectable()
export class PrixProduitService {
  private readonly logger = new Logger(PrixProduitService.name);

  constructor(
    @InjectRepository(PrixProduitEntity)
    private readonly prixProduitRepository: Repository<PrixProduitEntity>,
  ) {}

  async create(input: CreatePrixProduitRequest): Promise<PrixProduitEntity> {
    this.logger.log(
      `Creating prix produit for grid ${input.grille_tarifaire_id}, product ${input.produit_id}`,
    );

    const existing = await this.prixProduitRepository.findOne({
      where: {
        grilleTarifaireId: input.grille_tarifaire_id,
        produitId: input.produit_id,
      },
    });

    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Price already exists for this product in this grid`,
      });
    }

    const prixProduit = this.prixProduitRepository.create({
      grilleTarifaireId: input.grille_tarifaire_id,
      produitId: input.produit_id,
      prixUnitaire: input.prix_unitaire,
      remisePourcent: input.remise_pourcent ?? 0,
      prixMinimum: input.prix_minimum ?? null,
      prixMaximum: input.prix_maximum ?? null,
      actif: true,
    });

    return this.prixProduitRepository.save(prixProduit);
  }

  async update(input: UpdatePrixProduitRequest): Promise<PrixProduitEntity> {
    const prixProduit = await this.prixProduitRepository.findOne({
      where: { id: input.id },
    });

    if (!prixProduit) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Prix produit ${input.id} not found`,
      });
    }

    if (input.prix_unitaire !== undefined) prixProduit.prixUnitaire = input.prix_unitaire;
    if (input.remise_pourcent !== undefined) prixProduit.remisePourcent = input.remise_pourcent;
    if (input.prix_minimum !== undefined) prixProduit.prixMinimum = input.prix_minimum;
    if (input.prix_maximum !== undefined) prixProduit.prixMaximum = input.prix_maximum;
    if (input.actif !== undefined) prixProduit.actif = input.actif;

    return this.prixProduitRepository.save(prixProduit);
  }

  async findById(input: GetPrixProduitRequest): Promise<PrixProduitEntity> {
    const prixProduit = await this.prixProduitRepository.findOne({
      where: { id: input.id },
      relations: ['produit', 'grilleTarifaire'],
    });

    if (!prixProduit) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Prix produit ${input.id} not found`,
      });
    }

    return prixProduit;
  }

  async findForProduit(input: GetPrixForProduitRequest): Promise<PrixProduitEntity> {
    const prixProduit = await this.prixProduitRepository.findOne({
      where: { grilleTarifaireId: input.grille_tarifaire_id, produitId: input.produit_id },
      relations: ['produit', 'grilleTarifaire'],
    });

    if (!prixProduit) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `No price found for product ${input.produit_id} in grid ${input.grille_tarifaire_id}`,
      });
    }

    return prixProduit;
  }

  async findAll(input: ListPrixProduitsRequest): Promise<{
    prixProduits: PrixProduitEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 50;
    const sortBy = input.pagination?.sort_by || 'createdAt';
    const sortOrder = (input.pagination?.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const queryBuilder = this.prixProduitRepository
      .createQueryBuilder('prix')
      .leftJoinAndSelect('prix.produit', 'produit')
      .where('prix.grille_tarifaire_id = :grilleTarifaireId', {
        grilleTarifaireId: input.grille_tarifaire_id,
      });

    if (input.produit_id) {
      queryBuilder.andWhere('prix.produit_id = :produitId', { produitId: input.produit_id });
    }

    if (input.actif !== undefined) {
      queryBuilder.andWhere('prix.actif = :actif', { actif: input.actif });
    }

    const [prixProduits, total] = await queryBuilder
      .orderBy(`prix.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      prixProduits,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async delete(input: DeletePrixProduitRequest): Promise<boolean> {
    const result = await this.prixProduitRepository.delete(input.id);
    return (result.affected ?? 0) > 0;
  }

  async bulkCreate(input: BulkCreatePrixProduitsRequest): Promise<{
    created: PrixProduitEntity[];
    count: number;
  }> {
    this.logger.log(
      `Bulk creating ${input.items.length} prix produits for grid ${input.grille_tarifaire_id}`,
    );

    const entities = input.items.map((item) =>
      this.prixProduitRepository.create({
        grilleTarifaireId: input.grille_tarifaire_id,
        produitId: item.produit_id,
        prixUnitaire: item.prix_unitaire,
        remisePourcent: item.remise_pourcent ?? 0,
        prixMinimum: item.prix_minimum ?? null,
        prixMaximum: item.prix_maximum ?? null,
        actif: true,
      }),
    );

    const created = await this.prixProduitRepository.save(entities);
    return { created, count: created.length };
  }

  async findByGrille(input: ListPrixProduitsRequest): Promise<PrixProduitEntity[]> {
    return this.prixProduitRepository.find({
      where: { grilleTarifaireId: input.grille_tarifaire_id, actif: true },
      relations: ['produit'],
    });
  }
}
