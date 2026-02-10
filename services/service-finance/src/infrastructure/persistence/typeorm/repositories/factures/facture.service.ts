import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FactureEntity } from '../../../../../domain/factures/entities/facture.entity';
import { LigneFactureEntity } from '../../../../../domain/factures/entities/ligne-facture.entity';
import { StatutFactureEntity } from '../../../../../domain/factures/entities/statut-facture.entity';

export interface CreateFactureInput {
  organisationId: string;
  dateEmission: Date;
  statutId: string;
  emissionFactureId: string;
  clientBaseId: string;
  contratId?: string;
  clientPartenaireId: string;
  adresseFacturationId: string;
  lignes?: Array<{
    produitId: string;
    quantite: number;
    prixUnitaire: number;
    description?: string;
    tauxTVA?: number;
    metadata?: Record<string, unknown>;
  }>;
  typeDocument?: string;
  factureOrigineId?: string;
  motifAvoir?: string;
}

export interface CreateAvoirInput {
  organisationId: string;
  factureOrigineId: string;
  statutId: string;
  emissionFactureId: string;
  clientBaseId: string;
  clientPartenaireId: string;
  adresseFacturationId: string;
  motifAvoir: string;
  lignes: Array<{
    produitId: string;
    quantite: number;
    prixUnitaire: number;
    description?: string;
    tauxTVA?: number;
    metadata?: Record<string, unknown>;
  }>;
}

@Injectable()
export class FactureService {
  private readonly logger = new Logger(FactureService.name);

  constructor(
    @InjectRepository(FactureEntity)
    private readonly repository: Repository<FactureEntity>,
    @InjectRepository(LigneFactureEntity)
    private readonly ligneRepository: Repository<LigneFactureEntity>,
    @InjectRepository(StatutFactureEntity)
    private readonly statutRepository: Repository<StatutFactureEntity>,
  ) {}

  async create(input: CreateFactureInput): Promise<FactureEntity> {
    this.logger.log(`Creating facture for org ${input.organisationId}`);

    const lignesEntities: Partial<LigneFactureEntity>[] = [];
    let montantHT = 0;
    let montantTTC = 0;

    if (input.lignes && input.lignes.length > 0) {
      for (let i = 0; i < input.lignes.length; i++) {
        const ligne = input.lignes[i];
        const tauxTVA = ligne.tauxTVA ?? 20;
        const amounts = LigneFactureEntity.calculateAmounts(ligne.quantite, ligne.prixUnitaire, tauxTVA);
        montantHT += amounts.montantHT;
        montantTTC += amounts.montantTTC;
        lignesEntities.push({
          produitId: ligne.produitId,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          description: ligne.description || null,
          metadata: ligne.metadata ?? null,
          tauxTVA,
          montantHT: amounts.montantHT,
          montantTVA: amounts.montantTVA,
          montantTTC: amounts.montantTTC,
          ordreAffichage: i,
        });
      }
    }

    const facture = this.repository.create({
      organisationId: input.organisationId,
      numero: null,
      dateEmission: input.dateEmission,
      montantHT: Math.round(montantHT * 100) / 100,
      montantTTC: Math.round(montantTTC * 100) / 100,
      statutId: input.statutId,
      emissionFactureId: input.emissionFactureId,
      clientBaseId: input.clientBaseId,
      contratId: input.contratId || null,
      clientPartenaireId: input.clientPartenaireId,
      adresseFacturationId: input.adresseFacturationId,
      typeDocument: input.typeDocument || 'FACTURE',
      factureOrigineId: input.factureOrigineId || null,
      motifAvoir: input.motifAvoir || null,
    });

    const saved = await this.repository.save(facture);

    if (lignesEntities.length > 0) {
      for (const ligne of lignesEntities) {
        ligne.factureId = saved.id;
      }
      await this.ligneRepository.save(lignesEntities as LigneFactureEntity[]);
    }

    return this.findById(saved.id);
  }

  async findById(id: string): Promise<FactureEntity> {
    const facture = await this.repository.findOne({
      where: { id },
      relations: ['statut', 'lignes'],
    });
    if (!facture) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Facture ${id} not found` });
    }
    return facture;
  }

  async findByOrganisation(
    organisationId: string,
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    factures: FactureEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    if (!organisationId) {
      return { factures: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }

    const [factures, total] = await this.repository.findAndCount({
      where: { organisationId },
      relations: ['statut'],
      order: { dateEmission: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { factures, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async listStatutsFacture(
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    statuts: StatutFactureEntity[];
    pagination: { total: number; page: number; limit: number; total_pages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    const [statuts, total] = await this.statutRepository.findAndCount({
      order: { ordreAffichage: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { statuts, pagination: { total, page, limit, total_pages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async createAvoir(input: CreateAvoirInput): Promise<FactureEntity> {
    this.logger.log(`Creating avoir for facture ${input.factureOrigineId}`);

    const lignesEntities: Partial<LigneFactureEntity>[] = [];
    let montantHT = 0;
    let montantTTC = 0;

    // Process lines with negative amounts for avoir
    for (let i = 0; i < input.lignes.length; i++) {
      const ligne = input.lignes[i];
      const tauxTVA = ligne.tauxTVA ?? 20;
      const amounts = LigneFactureEntity.calculateAmounts(ligne.quantite, ligne.prixUnitaire, tauxTVA);
      // Negate amounts for avoir
      montantHT -= amounts.montantHT;
      montantTTC -= amounts.montantTTC;
      lignesEntities.push({
        produitId: ligne.produitId,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire,
        description: ligne.description || null,
        metadata: ligne.metadata ?? null,
        tauxTVA,
        montantHT: -amounts.montantHT,
        montantTVA: -amounts.montantTVA,
        montantTTC: -amounts.montantTTC,
        ordreAffichage: i,
      });
    }

    const avoir = this.repository.create({
      organisationId: input.organisationId,
      numero: null,
      dateEmission: new Date(),
      montantHT: Math.round(montantHT * 100) / 100,
      montantTTC: Math.round(montantTTC * 100) / 100,
      statutId: input.statutId,
      emissionFactureId: input.emissionFactureId,
      clientBaseId: input.clientBaseId,
      contratId: null,
      clientPartenaireId: input.clientPartenaireId,
      adresseFacturationId: input.adresseFacturationId,
      typeDocument: 'AVOIR',
      factureOrigineId: input.factureOrigineId,
      motifAvoir: input.motifAvoir,
    });

    const saved = await this.repository.save(avoir);

    if (lignesEntities.length > 0) {
      for (const ligne of lignesEntities) {
        ligne.factureId = saved.id;
      }
      await this.ligneRepository.save(lignesEntities as LigneFactureEntity[]);
    }

    return this.findById(saved.id);
  }

  async listAvoirsByFacture(
    factureOrigineId: string,
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    avoirs: FactureEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    const [avoirs, total] = await this.repository.findAndCount({
      where: { factureOrigineId, typeDocument: 'AVOIR' },
      relations: ['statut', 'lignes'],
      order: { dateEmission: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { avoirs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
