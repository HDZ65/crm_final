import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { AbonnementDepanssurEntity } from '../../../../../domain/depanssur/entities/abonnement-depanssur.entity';
import { HistoriqueStatutAbonnementEntity } from '../../../../../domain/depanssur/entities/historique-statut-abonnement.entity';
import type { IAbonnementRepository } from '../../../../../domain/depanssur/repositories/IAbonnementRepository';

@Injectable()
export class AbonnementService implements IAbonnementRepository {
  private readonly logger = new Logger(AbonnementService.name);

  constructor(
    @InjectRepository(AbonnementDepanssurEntity)
    private readonly repository: Repository<AbonnementDepanssurEntity>,
    @InjectRepository(HistoriqueStatutAbonnementEntity)
    private readonly historiqueRepository: Repository<HistoriqueStatutAbonnementEntity>,
  ) {}

  async create(input: any): Promise<AbonnementDepanssurEntity> {
    const entity = this.repository.create({
      organisationId: input.organisationId || input.organisation_id,
      clientId: input.clientId || input.client_id,
      planType: input.planType || input.plan_type,
      periodicite: input.periodicite,
      periodeAttente: input.periodeAttente ?? input.periode_attente ?? 0,
      franchise: input.franchise != null ? String(input.franchise) : null,
      plafondParIntervention: input.plafondParIntervention ?? input.plafond_par_intervention != null
        ? String(input.plafondParIntervention ?? input.plafond_par_intervention)
        : null,
      plafondAnnuel: input.plafondAnnuel ?? input.plafond_annuel != null
        ? String(input.plafondAnnuel ?? input.plafond_annuel)
        : null,
      nbInterventionsMax: input.nbInterventionsMax ?? input.nb_interventions_max ?? null,
      statut: 'ACTIF',
      dateSouscription: new Date(input.dateSouscription || input.date_souscription),
      dateEffet: new Date(input.dateEffet || input.date_effet),
      dateFin: input.dateFin || input.date_fin ? new Date(input.dateFin || input.date_fin) : null,
      prochaineEcheance: new Date(input.prochaineEcheance || input.prochaine_echeance),
      prixTtc: String(input.prixTtc ?? input.prix_ttc),
      tauxTva: String(input.tauxTva ?? input.taux_tva),
      montantHt: String(input.montantHt ?? input.montant_ht),
      codeRemise: input.codeRemise ?? input.code_remise ?? null,
      montantRemise: input.montantRemise ?? input.montant_remise != null
        ? String(input.montantRemise ?? input.montant_remise)
        : null,
    });

    return this.repository.save(entity);
  }

  async update(input: any): Promise<AbonnementDepanssurEntity> {
    const entity = await this.findById(input.id);
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Abonnement ${input.id} not found` });
    }

    const oldStatut = entity.statut;

    if (input.planType ?? input.plan_type) entity.planType = input.planType ?? input.plan_type;
    if (input.periodicite !== undefined) entity.periodicite = input.periodicite;
    if (input.periodeAttente ?? input.periode_attente !== undefined) entity.periodeAttente = input.periodeAttente ?? input.periode_attente;
    if (input.franchise !== undefined) entity.franchise = input.franchise != null ? String(input.franchise) : null;
    if (input.plafondParIntervention ?? input.plafond_par_intervention !== undefined) {
      entity.plafondParIntervention = (input.plafondParIntervention ?? input.plafond_par_intervention) != null
        ? String(input.plafondParIntervention ?? input.plafond_par_intervention) : null;
    }
    if (input.plafondAnnuel ?? input.plafond_annuel !== undefined) {
      entity.plafondAnnuel = (input.plafondAnnuel ?? input.plafond_annuel) != null
        ? String(input.plafondAnnuel ?? input.plafond_annuel) : null;
    }
    if (input.nbInterventionsMax ?? input.nb_interventions_max !== undefined) {
      entity.nbInterventionsMax = input.nbInterventionsMax ?? input.nb_interventions_max ?? null;
    }
    if (input.statut !== undefined) entity.statut = input.statut;
    if (input.motifResiliation ?? input.motif_resiliation !== undefined) {
      entity.motifResiliation = input.motifResiliation ?? input.motif_resiliation ?? null;
    }
    if (input.dateFin ?? input.date_fin !== undefined) {
      entity.dateFin = (input.dateFin ?? input.date_fin) ? new Date(input.dateFin ?? input.date_fin) : null;
    }
    if (input.prochaineEcheance ?? input.prochaine_echeance) {
      entity.prochaineEcheance = new Date(input.prochaineEcheance ?? input.prochaine_echeance);
    }
    if (input.prixTtc ?? input.prix_ttc !== undefined) entity.prixTtc = String(input.prixTtc ?? input.prix_ttc);
    if (input.tauxTva ?? input.taux_tva !== undefined) entity.tauxTva = String(input.tauxTva ?? input.taux_tva);
    if (input.montantHt ?? input.montant_ht !== undefined) entity.montantHt = String(input.montantHt ?? input.montant_ht);
    if (input.codeRemise ?? input.code_remise !== undefined) entity.codeRemise = input.codeRemise ?? input.code_remise ?? null;
    if (input.montantRemise ?? input.montant_remise !== undefined) {
      entity.montantRemise = (input.montantRemise ?? input.montant_remise) != null
        ? String(input.montantRemise ?? input.montant_remise) : null;
    }

    const saved = await this.repository.save(entity);

    // Track status change in history
    if (entity.statut !== oldStatut) {
      const historique = this.historiqueRepository.create({
        abonnementId: entity.id,
        ancienStatut: oldStatut,
        nouveauStatut: entity.statut,
        motif: input.motifResiliation ?? input.motif_resiliation ?? null,
      });
      await this.historiqueRepository.save(historique);
    }

    return saved;
  }

  async findById(id: string): Promise<AbonnementDepanssurEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['options', 'compteurs'],
    });
  }

  async findByClientId(organisationId: string, clientId: string): Promise<AbonnementDepanssurEntity | null> {
    return this.repository.findOne({
      where: { organisationId, clientId },
      relations: ['options', 'compteurs'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(
    organisationId: string,
    filters?: { clientId?: string; statut?: string; planType?: string; search?: string },
    pagination?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string },
  ): Promise<{
    abonnements: AbonnementDepanssurEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = (pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const qb = this.repository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.options', 'options')
      .leftJoinAndSelect('a.compteurs', 'compteurs')
      .where('a.organisationId = :orgId', { orgId: organisationId });

    if (filters?.clientId) {
      qb.andWhere('a.clientId = :clientId', { clientId: filters.clientId });
    }
    if (filters?.statut) {
      qb.andWhere('a.statut = :statut', { statut: filters.statut });
    }
    if (filters?.planType) {
      qb.andWhere('a.planType = :planType', { planType: filters.planType });
    }
    if (filters?.search) {
      qb.andWhere('(a.planType ILIKE :search OR a.codeRemise ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const [abonnements, total] = await qb
      .orderBy(`a.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { abonnements, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result.affected) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Abonnement ${id} not found` });
    }
  }

  async save(entity: AbonnementDepanssurEntity): Promise<AbonnementDepanssurEntity> {
    return this.repository.save(entity);
  }
}
