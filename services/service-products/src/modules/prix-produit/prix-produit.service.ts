import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PrixProduitEntity } from './entities/prix-produit.entity';

interface CreatePrixProduitInput {
  grilleTarifaireId: string;
  produitId: string;
  prixUnitaire: number;
  remisePourcent?: number;
  prixMinimum?: number;
  prixMaximum?: number;
}

interface UpdatePrixProduitInput {
  id: string;
  prixUnitaire?: number;
  remisePourcent?: number;
  prixMinimum?: number;
  prixMaximum?: number;
  actif?: boolean;
}

interface ListPrixProduitsInput {
  grilleTarifaireId: string;
  produitId?: string;
  actif?: boolean;
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  };
}

@Injectable()
export class PrixProduitService {
  private readonly logger = new Logger(PrixProduitService.name);

  constructor(
    @InjectRepository(PrixProduitEntity)
    private readonly prixProduitRepository: Repository<PrixProduitEntity>,
  ) {}

  async create(input: CreatePrixProduitInput): Promise<PrixProduitEntity> {
    this.logger.log(
      `Creating prix produit for grid ${input.grilleTarifaireId}, product ${input.produitId}`,
    );

    const existing = await this.prixProduitRepository.findOne({
      where: {
        grilleTarifaireId: input.grilleTarifaireId,
        produitId: input.produitId,
      },
    });

    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Price already exists for this product in this grid`,
      });
    }

    const prixProduit = this.prixProduitRepository.create({
      grilleTarifaireId: input.grilleTarifaireId,
      produitId: input.produitId,
      prixUnitaire: input.prixUnitaire,
      remisePourcent: input.remisePourcent ?? 0,
      prixMinimum: input.prixMinimum ?? null,
      prixMaximum: input.prixMaximum ?? null,
      actif: true,
    });

    return this.prixProduitRepository.save(prixProduit);
  }

  async update(input: UpdatePrixProduitInput): Promise<PrixProduitEntity> {
    const prixProduit = await this.prixProduitRepository.findOne({
      where: { id: input.id },
    });

    if (!prixProduit) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Prix produit ${input.id} not found`,
      });
    }

    if (input.prixUnitaire !== undefined) prixProduit.prixUnitaire = input.prixUnitaire;
    if (input.remisePourcent !== undefined) prixProduit.remisePourcent = input.remisePourcent;
    if (input.prixMinimum !== undefined) prixProduit.prixMinimum = input.prixMinimum;
    if (input.prixMaximum !== undefined) prixProduit.prixMaximum = input.prixMaximum;
    if (input.actif !== undefined) prixProduit.actif = input.actif;

    return this.prixProduitRepository.save(prixProduit);
  }

  async findById(id: string): Promise<PrixProduitEntity> {
    const prixProduit = await this.prixProduitRepository.findOne({
      where: { id },
      relations: ['produit', 'grilleTarifaire'],
    });

    if (!prixProduit) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Prix produit ${id} not found`,
      });
    }

    return prixProduit;
  }

  async findForProduit(grilleTarifaireId: string, produitId: string): Promise<PrixProduitEntity> {
    const prixProduit = await this.prixProduitRepository.findOne({
      where: { grilleTarifaireId, produitId },
      relations: ['produit', 'grilleTarifaire'],
    });

    if (!prixProduit) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `No price found for product ${produitId} in grid ${grilleTarifaireId}`,
      });
    }

    return prixProduit;
  }

  async findAll(input: ListPrixProduitsInput): Promise<{
    prixProduits: PrixProduitEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 50;
    const sortBy = input.pagination?.sortBy || 'createdAt';
    const sortOrder = (input.pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const queryBuilder = this.prixProduitRepository
      .createQueryBuilder('prix')
      .leftJoinAndSelect('prix.produit', 'produit')
      .where('prix.grilleTarifaireId = :grilleTarifaireId', {
        grilleTarifaireId: input.grilleTarifaireId,
      });

    if (input.produitId) {
      queryBuilder.andWhere('prix.produitId = :produitId', { produitId: input.produitId });
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

  async delete(id: string): Promise<boolean> {
    const result = await this.prixProduitRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async bulkCreate(
    grilleTarifaireId: string,
    items: Array<{
      produitId: string;
      prixUnitaire: number;
      remisePourcent?: number;
      prixMinimum?: number;
      prixMaximum?: number;
    }>,
  ): Promise<PrixProduitEntity[]> {
    this.logger.log(`Bulk creating ${items.length} prix produits for grid ${grilleTarifaireId}`);

    const entities = items.map((item) =>
      this.prixProduitRepository.create({
        grilleTarifaireId,
        produitId: item.produitId,
        prixUnitaire: item.prixUnitaire,
        remisePourcent: item.remisePourcent ?? 0,
        prixMinimum: item.prixMinimum ?? null,
        prixMaximum: item.prixMaximum ?? null,
        actif: true,
      }),
    );

    return this.prixProduitRepository.save(entities);
  }

  async findByGrille(grilleTarifaireId: string): Promise<PrixProduitEntity[]> {
    return this.prixProduitRepository.find({
      where: { grilleTarifaireId, actif: true },
      relations: ['produit'],
    });
  }
}
