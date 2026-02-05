import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FactureEntity, LigneFactureEntity, StatutFactureEntity } from '../../../../../domain/factures/entities';

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

    const [factures, total] = await this.repository.findAndCount({
      where: { organisationId },
      relations: ['statut'],
      order: { dateEmission: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { factures, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
