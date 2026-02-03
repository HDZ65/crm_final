import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionRecurrenteEntity, StatutRecurrence } from './entities/commission-recurrente.entity';

export interface GenerateRecurrenceInput {
  organisationId: string;
  commissionInitialeId: string;
  contratId: string;
  echeanceId?: string;
  apporteurId: string;
  baremeId: string;
  baremeVersion: number;
  periode: string;
  numeroMois: number;
  montantBase: number;
  tauxRecurrence: number;
  dateEncaissement?: Date;
}

@Injectable()
export class RecurrenceService {
  private readonly logger = new Logger(RecurrenceService.name);

  constructor(
    @InjectRepository(CommissionRecurrenteEntity)
    private readonly recurrenceRepository: Repository<CommissionRecurrenteEntity>,
  ) {}

  async generate(input: GenerateRecurrenceInput): Promise<CommissionRecurrenteEntity> {
    const montantCalcule = this.calculerMontant(input.montantBase, input.tauxRecurrence);

    const recurrence = this.recurrenceRepository.create({
      organisationId: input.organisationId,
      commissionInitialeId: input.commissionInitialeId,
      contratId: input.contratId,
      echeanceId: input.echeanceId || null,
      apporteurId: input.apporteurId,
      baremeId: input.baremeId,
      baremeVersion: input.baremeVersion,
      periode: input.periode,
      numeroMois: input.numeroMois,
      montantBase: input.montantBase,
      tauxRecurrence: input.tauxRecurrence,
      montantCalcule,
      dateEncaissement: input.dateEncaissement || null,
      statutRecurrence: StatutRecurrence.ACTIVE,
    });

    const saved = await this.recurrenceRepository.save(recurrence);
    this.logger.log(`Generated recurrence ${saved.id}: ${montantCalcule}EUR for month ${input.numeroMois}`);
    return saved;
  }

  private calculerMontant(montantBase: number, tauxRecurrence: number): number {
    return Math.round(montantBase * (tauxRecurrence / 100) * 100) / 100;
  }

  async findByContrat(organisationId: string, contratId: string): Promise<CommissionRecurrenteEntity[]> {
    return this.recurrenceRepository.find({
      where: { organisationId, contratId },
      order: { periode: 'DESC', numeroMois: 'DESC' },
    });
  }

  async findByPeriode(
    organisationId: string,
    apporteurId: string,
    periode: string,
  ): Promise<CommissionRecurrenteEntity[]> {
    return this.recurrenceRepository.find({
      where: {
        organisationId,
        apporteurId,
        periode,
        statutRecurrence: StatutRecurrence.ACTIVE,
      },
      order: { createdAt: 'ASC' },
    });
  }

  async findNonIncluses(
    organisationId: string,
    apporteurId: string,
    periode: string,
  ): Promise<CommissionRecurrenteEntity[]> {
    return this.recurrenceRepository.find({
      where: {
        organisationId,
        apporteurId,
        periode,
        statutRecurrence: StatutRecurrence.ACTIVE,
        bordereauId: null as any,
      },
    });
  }

  async marquerIncluses(recurrenceIds: string[], bordereauId: string): Promise<void> {
    if (recurrenceIds.length === 0) return;
    await this.recurrenceRepository.update(recurrenceIds, { bordereauId });
    this.logger.log(`Marked ${recurrenceIds.length} recurrences as included in bordereau ${bordereauId}`);
  }

  async suspendre(contratId: string, motif?: string): Promise<number> {
    const result = await this.recurrenceRepository.update(
      { contratId, statutRecurrence: StatutRecurrence.ACTIVE, bordereauId: null as any },
      { statutRecurrence: StatutRecurrence.SUSPENDUE },
    );
    this.logger.log(`Suspended ${result.affected} recurrences for contrat ${contratId}`);
    return result.affected || 0;
  }

  async reprendre(contratId: string): Promise<number> {
    const result = await this.recurrenceRepository.update(
      { contratId, statutRecurrence: StatutRecurrence.SUSPENDUE },
      { statutRecurrence: StatutRecurrence.ACTIVE },
    );
    this.logger.log(`Resumed ${result.affected} recurrences for contrat ${contratId}`);
    return result.affected || 0;
  }

  async terminer(contratId: string): Promise<number> {
    const result = await this.recurrenceRepository.update(
      { contratId, statutRecurrence: StatutRecurrence.ACTIVE },
      { statutRecurrence: StatutRecurrence.TERMINEE },
    );
    this.logger.log(`Terminated ${result.affected} recurrences for contrat ${contratId}`);
    return result.affected || 0;
  }

  async getLastNumeroMois(organisationId: string, contratId: string): Promise<number> {
    const last = await this.recurrenceRepository.findOne({
      where: { organisationId, contratId },
      order: { numeroMois: 'DESC' },
    });
    return last?.numeroMois || 0;
  }

  async existsForPeriode(
    organisationId: string,
    contratId: string,
    echeanceId: string,
    periode: string,
  ): Promise<boolean> {
    const count = await this.recurrenceRepository.count({
      where: { organisationId, contratId, echeanceId, periode },
    });
    return count > 0;
  }

  async getTotalByApporteurPeriode(
    organisationId: string,
    apporteurId: string,
    periode: string,
  ): Promise<number> {
    const result = await this.recurrenceRepository
      .createQueryBuilder('r')
      .select('SUM(r.montant_calcule)', 'total')
      .where('r.organisation_id = :organisationId', { organisationId })
      .andWhere('r.apporteur_id = :apporteurId', { apporteurId })
      .andWhere('r.periode = :periode', { periode })
      .andWhere('r.statut_recurrence = :statut', { statut: StatutRecurrence.ACTIVE })
      .getRawOne();
    return Number(result?.total) || 0;
  }

  async findByOrganisation(
    organisationId: string,
    options?: {
      apporteurId?: string;
      periode?: string;
      statut?: StatutRecurrence;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ recurrences: CommissionRecurrenteEntity[]; total: number }> {
    const qb = this.recurrenceRepository
      .createQueryBuilder('r')
      .where('r.organisation_id = :organisationId', { organisationId });

    if (options?.apporteurId) {
      qb.andWhere('r.apporteur_id = :apporteurId', { apporteurId: options.apporteurId });
    }
    if (options?.periode) {
      qb.andWhere('r.periode = :periode', { periode: options.periode });
    }
    if (options?.statut) {
      qb.andWhere('r.statut_recurrence = :statut', { statut: options.statut });
    }

    qb.orderBy('r.created_at', 'DESC');

    const total = await qb.getCount();

    if (options?.limit) qb.take(options.limit);
    if (options?.offset) qb.skip(options.offset);

    const recurrences = await qb.getMany();
    return { recurrences, total };
  }
}
