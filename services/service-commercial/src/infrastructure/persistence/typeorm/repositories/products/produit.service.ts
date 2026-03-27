import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ProduitEntity, TypeProduit, CategorieProduit, StatutCycleProduit } from '../../../../../domain/products/entities/produit.entity';

// Proto enum values
const ProtoCategorieProduit = {
  CATEGORIE_PRODUIT_UNSPECIFIED: 0,
  ASSURANCE: 1,
  PREVOYANCE: 2,
  EPARGNE: 3,
  SERVICE: 4,
  ACCESSOIRE: 5,
} as const;

const ProtoTypeProduit = {
  TYPE_PRODUIT_UNSPECIFIED: 0,
  INTERNE: 1,
  PARTENAIRE: 2,
} as const;

const ProtoStatutCycleProduit = {
  STATUT_CYCLE_PRODUIT_UNSPECIFIED: 0,
  STATUT_CYCLE_PRODUIT_BROUILLON: 1,
  STATUT_CYCLE_PRODUIT_TEST: 2,
  STATUT_CYCLE_PRODUIT_ACTIF: 3,
  STATUT_CYCLE_PRODUIT_GELE: 4,
  STATUT_CYCLE_PRODUIT_RETIRE: 5,
} as const;

type ProtoCategorieProduitType = (typeof ProtoCategorieProduit)[keyof typeof ProtoCategorieProduit];
type ProtoTypeProduitType = (typeof ProtoTypeProduit)[keyof typeof ProtoTypeProduit];
type ProtoStatutCycleProduitType = (typeof ProtoStatutCycleProduit)[keyof typeof ProtoStatutCycleProduit];

const categorieFromProto: Record<ProtoCategorieProduitType, CategorieProduit> = {
  [ProtoCategorieProduit.ASSURANCE]: CategorieProduit.ASSURANCE,
  [ProtoCategorieProduit.PREVOYANCE]: CategorieProduit.PREVOYANCE,
  [ProtoCategorieProduit.EPARGNE]: CategorieProduit.EPARGNE,
  [ProtoCategorieProduit.SERVICE]: CategorieProduit.SERVICE,
  [ProtoCategorieProduit.ACCESSOIRE]: CategorieProduit.ACCESSOIRE,
  [ProtoCategorieProduit.CATEGORIE_PRODUIT_UNSPECIFIED]: CategorieProduit.SERVICE,
};

const typeFromProto: Record<ProtoTypeProduitType, TypeProduit> = {
  [ProtoTypeProduit.INTERNE]: TypeProduit.INTERNE,
  [ProtoTypeProduit.PARTENAIRE]: TypeProduit.PARTENAIRE,
  [ProtoTypeProduit.TYPE_PRODUIT_UNSPECIFIED]: TypeProduit.INTERNE,
};

const statutCycleFromProto: Record<ProtoStatutCycleProduitType, StatutCycleProduit> = {
  [ProtoStatutCycleProduit.STATUT_CYCLE_PRODUIT_BROUILLON]: StatutCycleProduit.BROUILLON,
  [ProtoStatutCycleProduit.STATUT_CYCLE_PRODUIT_TEST]: StatutCycleProduit.TEST,
  [ProtoStatutCycleProduit.STATUT_CYCLE_PRODUIT_ACTIF]: StatutCycleProduit.ACTIF,
  [ProtoStatutCycleProduit.STATUT_CYCLE_PRODUIT_GELE]: StatutCycleProduit.GELE,
  [ProtoStatutCycleProduit.STATUT_CYCLE_PRODUIT_RETIRE]: StatutCycleProduit.RETIRE,
  [ProtoStatutCycleProduit.STATUT_CYCLE_PRODUIT_UNSPECIFIED]: StatutCycleProduit.ACTIF,
};

@Injectable()
export class ProduitService {
  private readonly logger = new Logger(ProduitService.name);

  constructor(
    @InjectRepository(ProduitEntity)
    private readonly produitRepository: Repository<ProduitEntity>,
  ) {}

  async create(input: {
    organisation_id: string;
    gamme_id?: string;
    sku: string;
    nom: string;
    description?: string;
    categorie: number;
    type: number;
    statut_cycle: number;
    prix?: number;
    taux_tva?: number;
    devise?: string;
    image_url?: string;
    code_externe?: string;
    metadata?: string;
  }): Promise<ProduitEntity> {
    this.logger.log(`Creating produit: ${input.nom} (SKU: ${input.sku})`);

    const existing = await this.produitRepository.findOne({
      where: { organisationId: input.organisation_id, sku: input.sku },
    });

    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Produit with SKU ${input.sku} already exists`,
      });
    }

    let metadata: Record<string, unknown> | null = null;
    if (input.metadata) {
      try {
        metadata = JSON.parse(input.metadata);
      } catch {
        metadata = null;
      }
    }

    const produit = this.produitRepository.create({
      organisationId: input.organisation_id,
      gammeId: input.gamme_id || null,
      sku: input.sku,
      nom: input.nom,
      description: input.description || null,
      categorie: categorieFromProto[input.categorie as ProtoCategorieProduitType],
      type: typeFromProto[input.type as ProtoTypeProduitType],
      statutCycle: statutCycleFromProto[input.statut_cycle as ProtoStatutCycleProduitType],
      prix: input.prix ?? 0,
      tauxTva: input.taux_tva ?? 20,
      devise: input.devise || 'EUR',
      imageUrl: input.image_url || null,
      codeExterne: input.code_externe || null,
      metadata,
      actif: true,
    });

    return this.produitRepository.save(produit);
  }

  async update(input: {
    id: string;
    gamme_id?: string;
    sku?: string;
    nom?: string;
    description?: string;
    categorie?: number;
    type?: number;
    statut_cycle?: number;
    prix?: number;
    taux_tva?: number;
    devise?: string;
    actif?: boolean;
    image_url?: string;
    code_externe?: string;
    metadata?: string;
  }): Promise<ProduitEntity> {
    const produit = await this.produitRepository.findOne({
      where: { id: input.id },
    });

    if (!produit) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Produit ${input.id} not found`,
      });
    }

    if (input.gamme_id !== undefined) produit.gammeId = input.gamme_id || null;
    if (input.sku !== undefined) produit.sku = input.sku;
    if (input.nom !== undefined) produit.nom = input.nom;
    if (input.description !== undefined) produit.description = input.description || null;
    if (input.categorie !== undefined) produit.categorie = categorieFromProto[input.categorie as ProtoCategorieProduitType];
    if (input.type !== undefined) produit.type = typeFromProto[input.type as ProtoTypeProduitType];
    if (input.statut_cycle !== undefined) produit.statutCycle = statutCycleFromProto[input.statut_cycle as ProtoStatutCycleProduitType];
    if (input.prix !== undefined) produit.prix = input.prix;
    if (input.taux_tva !== undefined) produit.tauxTva = input.taux_tva;
    if (input.devise !== undefined) produit.devise = input.devise;
    if (input.actif !== undefined) produit.actif = input.actif;
    if (input.image_url !== undefined) produit.imageUrl = input.image_url || null;
    if (input.code_externe !== undefined) produit.codeExterne = input.code_externe || null;
    if (input.metadata !== undefined) {
      try {
        produit.metadata = input.metadata ? JSON.parse(input.metadata) : null;
      } catch {
        produit.metadata = null;
      }
    }

    return this.produitRepository.save(produit);
  }

  async findById(id: string): Promise<ProduitEntity> {
    const produit = await this.produitRepository.findOne({
      where: { id },
      relations: ['gamme', 'prixProduits'],
    });

    if (!produit) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Produit ${id} not found`,
      });
    }

    return produit;
  }

  async findBySku(organisationId: string, sku: string): Promise<ProduitEntity> {
    const produit = await this.produitRepository.findOne({
      where: { organisationId, sku },
      relations: ['gamme'],
    });

    if (!produit) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Produit with SKU ${sku} not found`,
      });
    }

    return produit;
  }

  async findAll(input: {
    organisation_id: string;
    gamme_id?: string;
    categorie?: number;
    type?: number;
    actif?: boolean;
    promotion_active?: boolean;
    search?: string;
    pagination?: { page?: number; limit?: number; sort_by?: string; sort_order?: string };
  }): Promise<{
    produits: ProduitEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 20;
    const sortBy = input.pagination?.sort_by || 'nom';
    const sortOrder = (input.pagination?.sort_order?.toUpperCase() as 'ASC' | 'DESC') || 'ASC';

    const queryBuilder = this.produitRepository
      .createQueryBuilder('produit')
      .leftJoinAndSelect('produit.gamme', 'gamme')
      .where('produit.organisation_id = :organisationId', {
        organisationId: input.organisation_id,
      });

    if (input.gamme_id) {
      queryBuilder.andWhere('produit.gamme_id = :gammeId', { gammeId: input.gamme_id });
    }

    if (input.categorie !== undefined) {
      queryBuilder.andWhere('produit.categorie = :categorie', {
        categorie: categorieFromProto[input.categorie as ProtoCategorieProduitType],
      });
    }

    if (input.type !== undefined) {
      queryBuilder.andWhere('produit.type = :type', { type: typeFromProto[input.type as ProtoTypeProduitType] });
    }

    if (input.actif !== undefined) {
      queryBuilder.andWhere('produit.actif = :actif', { actif: input.actif });
    }

    if (input.promotion_active !== undefined) {
      queryBuilder.andWhere('produit.promotionActive = :promotionActive', {
        promotionActive: input.promotion_active,
      });
    }

    if (input.search) {
      queryBuilder.andWhere(
        '(produit.nom ILIKE :search OR produit.sku ILIKE :search OR produit.description ILIKE :search)',
        { search: `%${input.search}%` },
      );
    }

    const [produits, total] = await queryBuilder
      .orderBy(`produit.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      produits,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.produitRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
