import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FactureEntity } from './entities/facture.entity';
import { LigneFactureEntity } from '../ligne-facture/entities/ligne-facture.entity';
import { StatutFactureService } from '../statut-facture/statut-facture.service';
import type {
  CreateFactureRequest,
  ListFacturesRequest,
  CreateLigneFactureItem,
  PaginationRequest,
} from '@proto/factures/factures';

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
  }>;
}

export interface ListFacturesInput {
  organisationId: string;
  clientBaseId?: string;
  contratId?: string;
  statutId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  pagination?: Partial<PaginationRequest>;
}

@Injectable()
export class FactureService {
  private readonly logger = new Logger(FactureService.name);

  constructor(
    @InjectRepository(FactureEntity)
    private readonly repository: Repository<FactureEntity>,
    @InjectRepository(LigneFactureEntity)
    private readonly ligneRepository: Repository<LigneFactureEntity>,
    private readonly statutService: StatutFactureService,
  ) {}

  async create(input: CreateFactureInput): Promise<FactureEntity> {
    this.logger.log(`Creating facture for org ${input.organisationId}`);

    // Create lignes with calculated amounts
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
      numero: null, // Will be generated on finalization
      dateEmission: input.dateEmission,
      montantHT: Math.round(montantHT * 100) / 100,
      montantTTC: Math.round(montantTTC * 100) / 100,
      statutId: input.statutId,
      emissionFactureId: input.emissionFactureId,
      clientBaseId: input.clientBaseId,
      contratId: input.contratId || null,
      clientPartenaireId: input.clientPartenaireId,
      adresseFacturationId: input.adresseFacturationId,
    });

    const saved = await this.repository.save(facture);

    // Save lignes
    if (lignesEntities.length > 0) {
      for (const ligne of lignesEntities) {
        ligne.factureId = saved.id;
      }
      await this.ligneRepository.save(lignesEntities as LigneFactureEntity[]);
    }

    return this.findById(saved.id);
  }

  async update(input: {
    id: string;
    dateEmission?: Date;
    statutId?: string;
    emissionFactureId?: string;
    adresseFacturationId?: string;
  }): Promise<FactureEntity> {
    const facture = await this.repository.findOne({ where: { id: input.id } });
    if (!facture) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Facture ${input.id} not found` });
    }

    if (input.dateEmission !== undefined) facture.dateEmission = input.dateEmission;
    if (input.statutId !== undefined) facture.statutId = input.statutId;
    if (input.emissionFactureId !== undefined) facture.emissionFactureId = input.emissionFactureId;
    if (input.adresseFacturationId !== undefined) facture.adresseFacturationId = input.adresseFacturationId;

    await this.repository.save(facture);
    return this.findById(input.id);
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

  async findByNumero(organisationId: string, numero: string): Promise<FactureEntity> {
    const facture = await this.repository.findOne({
      where: { organisationId, numero },
      relations: ['statut', 'lignes'],
    });
    if (!facture) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Facture ${numero} not found` });
    }
    return facture;
  }

  async findAll(input: ListFacturesInput): Promise<{
    factures: FactureEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 20;
    const sortBy = input.pagination?.sortBy || 'dateEmission';
    const sortOrder = (input.pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const qb = this.repository
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.statut', 'statut')
      .where('f.organisationId = :orgId', { orgId: input.organisationId });

    if (input.clientBaseId) qb.andWhere('f.clientBaseId = :clientId', { clientId: input.clientBaseId });
    if (input.contratId) qb.andWhere('f.contratId = :contratId', { contratId: input.contratId });
    if (input.statutId) qb.andWhere('f.statutId = :statutId', { statutId: input.statutId });
    if (input.dateFrom) qb.andWhere('f.dateEmission >= :dateFrom', { dateFrom: input.dateFrom });
    if (input.dateTo) qb.andWhere('f.dateEmission <= :dateTo', { dateTo: input.dateTo });

    const [factures, total] = await qb
      .orderBy(`f.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { factures, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async validate(id: string): Promise<{ valid: boolean; errors: string[]; facture: FactureEntity }> {
    const facture = await this.findById(id);
    const validation = facture.canBeValidated();
    return { ...validation, facture };
  }

  async finalize(id: string, numero: string): Promise<FactureEntity> {
    const facture = await this.findById(id);
    const validation = facture.canBeValidated();
    if (!validation.valid) {
      throw new RpcException({ code: status.FAILED_PRECONDITION, message: validation.errors.join(', ') });
    }

    // Get "EMISE" status
    const statutEmise = await this.statutService.findByCode('EMISE');
    facture.numero = numero;
    facture.statutId = statutEmise.id;

    await this.repository.save(facture);
    return this.findById(id);
  }

  async recalculateTotals(id: string): Promise<FactureEntity> {
    const facture = await this.findById(id);
    const totals = FactureEntity.calculateTotalsFromLines(facture.lignes || []);
    facture.montantHT = totals.montantHT;
    facture.montantTTC = totals.montantTTC;
    await this.repository.save(facture);
    return facture;
  }
}
