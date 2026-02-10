import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpeditionEntity } from '../../../../../domain/logistics/entities';

@Injectable()
export class ExpeditionService {
  private readonly logger = new Logger(ExpeditionService.name);

  constructor(
    @InjectRepository(ExpeditionEntity)
    private readonly expeditionRepository: Repository<ExpeditionEntity>,
  ) {}

  async create(params: {
    organisationId: string;
    clientBaseId: string;
    transporteurCompteId: string;
    contratId?: string;
    trackingNumber: string;
    labelUrl: string;
    referenceCommande: string;
    produitId?: string;
    nomProduit?: string;
    poids?: number;
    adresseDestination?: string;
    villeDestination?: string;
    codePostalDestination?: string;
    dateExpedition?: Date;
    dateLivraisonEstimee?: Date;
  }): Promise<ExpeditionEntity> {
    const expedition = this.expeditionRepository.create({
      ...params,
      etat: 'created',
      dateCreation: new Date(),
      dateDernierStatut: new Date(),
    });

    return this.expeditionRepository.save(expedition);
  }

  async findById(id: string): Promise<ExpeditionEntity | null> {
    return this.expeditionRepository.findOne({ where: { id } });
  }

  async findByTrackingNumber(trackingNumber: string): Promise<ExpeditionEntity | null> {
    return this.expeditionRepository.findOne({ where: { trackingNumber } });
  }

  async findByClientId(
    clientBaseId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ expeditions: ExpeditionEntity[]; total: number }> {
    const [expeditions, total] = await this.expeditionRepository.findAndCount({
      where: { clientBaseId },
      order: { dateCreation: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { expeditions, total };
  }

  async findByOrganisationId(
    organisationId: string,
    etat?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ expeditions: ExpeditionEntity[]; total: number }> {
    const where: any = { organisationId };
    if (etat) {
      where.etat = etat;
    }

    const [expeditions, total] = await this.expeditionRepository.findAndCount({
      where,
      order: { dateCreation: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { expeditions, total };
  }

  async update(
    id: string,
    params: {
      etat?: string;
      lieuActuel?: string;
      dateLivraison?: Date;
    },
  ): Promise<ExpeditionEntity> {
    const expedition = await this.findById(id);
    if (!expedition) {
      throw new NotFoundException('Expedition not found');
    }

    if (params.etat) {
      expedition.etat = params.etat;
      expedition.dateDernierStatut = new Date();
    }
    if (params.lieuActuel !== undefined) {
      expedition.lieuActuel = params.lieuActuel;
    }
    if (params.dateLivraison) {
      expedition.dateLivraison = params.dateLivraison;
    }

    return this.expeditionRepository.save(expedition);
  }

  async delete(id: string): Promise<void> {
    const result = await this.expeditionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Expedition not found');
    }
  }

  async updateStatus(
    id: string,
    status: string,
    location?: string,
  ): Promise<ExpeditionEntity> {
    return this.update(id, {
      etat: status,
      lieuActuel: location,
    });
  }
}
