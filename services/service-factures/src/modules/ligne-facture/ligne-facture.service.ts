import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { LigneFactureEntity } from './entities/ligne-facture.entity';
import type { CreateLigneFactureRequest } from '@proto/factures/factures';

export type CreateLigneInput = CreateLigneFactureRequest;

@Injectable()
export class LigneFactureService {
  private readonly logger = new Logger(LigneFactureService.name);

  constructor(
    @InjectRepository(LigneFactureEntity)
    private readonly repository: Repository<LigneFactureEntity>,
  ) {}

  async create(input: CreateLigneInput): Promise<LigneFactureEntity> {
    const tauxTVA = input.tauxTva ?? 20;
    const amounts = LigneFactureEntity.calculateAmounts(input.quantite, input.prixUnitaire, tauxTVA);

    const entity = this.repository.create({
      factureId: input.factureId,
      produitId: input.produitId,
      quantite: input.quantite,
      prixUnitaire: input.prixUnitaire,
      description: input.description || null,
      tauxTVA,
      montantHT: amounts.montantHT,
      montantTVA: amounts.montantTVA,
      montantTTC: amounts.montantTTC,
      ordreAffichage: input.ordreAffichage ?? 0,
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    produitId?: string;
    quantite?: number;
    prixUnitaire?: number;
    description?: string;
    tauxTVA?: number;
    ordreAffichage?: number;
  }): Promise<LigneFactureEntity> {
    const entity = await this.findById(input.id);

    if (input.produitId !== undefined) entity.produitId = input.produitId;
    if (input.description !== undefined) entity.description = input.description || null;
    if (input.ordreAffichage !== undefined) entity.ordreAffichage = input.ordreAffichage;

    const quantite = input.quantite ?? entity.quantite;
    const prixUnitaire = input.prixUnitaire ?? Number(entity.prixUnitaire);
    const tauxTVA = input.tauxTVA ?? Number(entity.tauxTVA);

    entity.quantite = quantite;
    entity.prixUnitaire = prixUnitaire;
    entity.tauxTVA = tauxTVA;

    const amounts = LigneFactureEntity.calculateAmounts(quantite, prixUnitaire, tauxTVA);
    entity.montantHT = amounts.montantHT;
    entity.montantTVA = amounts.montantTVA;
    entity.montantTTC = amounts.montantTTC;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<LigneFactureEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Ligne facture ${id} not found` });
    }
    return entity;
  }

  async findByFacture(factureId: string, pagination?: { page?: number; limit?: number }): Promise<{
    lignes: LigneFactureEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 100;
    const [lignes, total] = await this.repository.findAndCount({
      where: { factureId },
      order: { ordreAffichage: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { lignes, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async deleteByFacture(factureId: string): Promise<number> {
    const result = await this.repository.delete({ factureId });
    return result.affected ?? 0;
  }
}
