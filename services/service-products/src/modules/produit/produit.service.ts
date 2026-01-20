import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ProduitEntity, TypeProduit, CategorieProduit } from './entities/produit.entity';

interface CreateProduitInput {
  organisationId: string;
  gammeId?: string;
  sku: string;
  nom: string;
  description?: string;
  categorie?: CategorieProduit;
  type?: TypeProduit;
  prix?: number;
  tauxTva?: number;
  devise?: string;
  imageUrl?: string;
  codeExterne?: string;
  metadata?: string;
}

interface UpdateProduitInput {
  id: string;
  gammeId?: string;
  sku?: string;
  nom?: string;
  description?: string;
  categorie?: CategorieProduit;
  type?: TypeProduit;
  prix?: number;
  tauxTva?: number;
  devise?: string;
  actif?: boolean;
  imageUrl?: string;
  codeExterne?: string;
  metadata?: string;
}

interface ListProduitsInput {
  organisationId: string;
  gammeId?: string;
  categorie?: CategorieProduit;
  type?: TypeProduit;
  actif?: boolean;
  promotionActive?: boolean;
  search?: string;
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  };
}

@Injectable()
export class ProduitService {
  private readonly logger = new Logger(ProduitService.name);

  constructor(
    @InjectRepository(ProduitEntity)
    private readonly produitRepository: Repository<ProduitEntity>,
  ) {}

  async create(input: CreateProduitInput): Promise<ProduitEntity> {
    this.logger.log(`Creating produit: ${input.nom} (SKU: ${input.sku})`);

    const existing = await this.produitRepository.findOne({
      where: { organisationId: input.organisationId, sku: input.sku },
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
      organisationId: input.organisationId,
      gammeId: input.gammeId || null,
      sku: input.sku,
      nom: input.nom,
      description: input.description || null,
      categorie: input.categorie || CategorieProduit.SERVICE,
      type: input.type || TypeProduit.INTERNE,
      prix: input.prix ?? 0,
      tauxTva: input.tauxTva ?? 20,
      devise: input.devise || 'EUR',
      imageUrl: input.imageUrl || null,
      codeExterne: input.codeExterne || null,
      metadata,
      actif: true,
    });

    return this.produitRepository.save(produit);
  }

  async update(input: UpdateProduitInput): Promise<ProduitEntity> {
    const produit = await this.produitRepository.findOne({
      where: { id: input.id },
    });

    if (!produit) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Produit ${input.id} not found`,
      });
    }

    if (input.gammeId !== undefined) produit.gammeId = input.gammeId || null;
    if (input.sku !== undefined) produit.sku = input.sku;
    if (input.nom !== undefined) produit.nom = input.nom;
    if (input.description !== undefined) produit.description = input.description || null;
    if (input.categorie !== undefined) produit.categorie = input.categorie;
    if (input.type !== undefined) produit.type = input.type;
    if (input.prix !== undefined) produit.prix = input.prix;
    if (input.tauxTva !== undefined) produit.tauxTva = input.tauxTva;
    if (input.devise !== undefined) produit.devise = input.devise;
    if (input.actif !== undefined) produit.actif = input.actif;
    if (input.imageUrl !== undefined) produit.imageUrl = input.imageUrl || null;
    if (input.codeExterne !== undefined) produit.codeExterne = input.codeExterne || null;
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

  async findAll(input: ListProduitsInput): Promise<{
    produits: ProduitEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 20;
    const sortBy = input.pagination?.sortBy || 'nom';
    const sortOrder = (input.pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'ASC';

    const queryBuilder = this.produitRepository
      .createQueryBuilder('produit')
      .leftJoinAndSelect('produit.gamme', 'gamme')
      .where('produit.organisationId = :organisationId', {
        organisationId: input.organisationId,
      });

    if (input.gammeId) {
      queryBuilder.andWhere('produit.gammeId = :gammeId', { gammeId: input.gammeId });
    }

    if (input.categorie) {
      queryBuilder.andWhere('produit.categorie = :categorie', { categorie: input.categorie });
    }

    if (input.type) {
      queryBuilder.andWhere('produit.type = :type', { type: input.type });
    }

    if (input.actif !== undefined) {
      queryBuilder.andWhere('produit.actif = :actif', { actif: input.actif });
    }

    if (input.promotionActive !== undefined) {
      queryBuilder.andWhere('produit.promotionActive = :promotionActive', {
        promotionActive: input.promotionActive,
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

  async setPromotion(
    produitId: string,
    prixPromotion: number,
    dateDebut: Date,
    dateFin: Date,
  ): Promise<ProduitEntity> {
    const produit = await this.findById(produitId);

    produit.promotionActive = true;
    produit.prixPromotion = prixPromotion;
    produit.dateDebutPromotion = dateDebut;
    produit.dateFinPromotion = dateFin;

    return this.produitRepository.save(produit);
  }

  async clearPromotion(produitId: string): Promise<ProduitEntity> {
    const produit = await this.findById(produitId);

    produit.promotionActive = false;
    produit.prixPromotion = null;
    produit.dateDebutPromotion = null;
    produit.dateFinPromotion = null;

    return this.produitRepository.save(produit);
  }

  async findByOrganisation(organisationId: string, actif?: boolean): Promise<ProduitEntity[]> {
    const where: { organisationId: string; actif?: boolean } = { organisationId };
    if (actif !== undefined) {
      where.actif = actif;
    }
    return this.produitRepository.find({
      where,
      relations: ['gamme'],
      order: { nom: 'ASC' },
    });
  }
}
