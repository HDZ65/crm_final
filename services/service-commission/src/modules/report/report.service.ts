import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportNegatifEntity, StatutReport } from './entities/report-negatif.entity';

@Injectable()
export class ReportNegatifService {
  private readonly logger = new Logger(ReportNegatifService.name);

  constructor(
    @InjectRepository(ReportNegatifEntity)
    private readonly reportRepository: Repository<ReportNegatifEntity>,
  ) {}

  async create(data: {
    organisationId: string;
    apporteurId: string;
    periodeOrigine: string;
    montantInitial: number;
    bordereauOrigineId?: string;
    motif?: string;
  }): Promise<ReportNegatifEntity> {
    const report = this.reportRepository.create({
      organisationId: data.organisationId,
      apporteurId: data.apporteurId,
      periodeOrigine: data.periodeOrigine,
      montantInitial: Math.abs(data.montantInitial),
      montantRestant: Math.abs(data.montantInitial),
      bordereauOrigineId: data.bordereauOrigineId || null,
      motif: data.motif || null,
      statutReport: StatutReport.EN_COURS,
    });
    const saved = await this.reportRepository.save(report);
    this.logger.log(`Created report negatif ${saved.id}: ${saved.montantInitial}EUR for apporteur ${data.apporteurId}`);
    return saved;
  }

  async findEnCours(organisationId: string, apporteurId: string): Promise<ReportNegatifEntity[]> {
    return this.reportRepository.find({
      where: {
        organisationId,
        apporteurId,
        statutReport: StatutReport.EN_COURS,
      },
      order: { periodeOrigine: 'ASC' },
    });
  }

  async getMontantTotalEnCours(organisationId: string, apporteurId: string): Promise<number> {
    const reports = await this.findEnCours(organisationId, apporteurId);
    return reports.reduce((sum, r) => sum + Number(r.montantRestant), 0);
  }

  async appliquerSurMontant(
    organisationId: string,
    apporteurId: string,
    montantDisponible: number,
    periodeApplication: string,
  ): Promise<{ montantApresReports: number; reportsAppliques: ReportNegatifEntity[] }> {
    const reportsEnCours = await this.findEnCours(organisationId, apporteurId);
    
    if (reportsEnCours.length === 0 || montantDisponible <= 0) {
      return { montantApresReports: montantDisponible, reportsAppliques: [] };
    }

    let montantRestant = montantDisponible;
    const reportsAppliques: ReportNegatifEntity[] = [];

    for (const report of reportsEnCours) {
      if (montantRestant <= 0) break;

      const montantADeduire = Math.min(montantRestant, Number(report.montantRestant));
      report.montantRestant = Number(report.montantRestant) - montantADeduire;
      report.dernierePeriodeApplication = periodeApplication;

      if (report.montantRestant <= 0) {
        report.statutReport = StatutReport.APURE;
        report.montantRestant = 0;
      }

      await this.reportRepository.save(report);
      montantRestant -= montantADeduire;
      reportsAppliques.push(report);

      this.logger.log(`Applied ${montantADeduire}EUR from report ${report.id}, remaining: ${report.montantRestant}EUR`);
    }

    return {
      montantApresReports: montantRestant,
      reportsAppliques,
    };
  }

  async annuler(id: string): Promise<ReportNegatifEntity> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new Error(`Report ${id} not found`);
    }
    report.statutReport = StatutReport.ANNULE;
    return this.reportRepository.save(report);
  }

  async findByOrganisation(
    organisationId: string,
    options?: {
      apporteurId?: string;
      statut?: StatutReport;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ reports: ReportNegatifEntity[]; total: number }> {
    const qb = this.reportRepository
      .createQueryBuilder('r')
      .where('r.organisation_id = :organisationId', { organisationId });

    if (options?.apporteurId) {
      qb.andWhere('r.apporteur_id = :apporteurId', { apporteurId: options.apporteurId });
    }
    if (options?.statut) {
      qb.andWhere('r.statut_report = :statut', { statut: options.statut });
    }

    qb.orderBy('r.created_at', 'DESC');

    const total = await qb.getCount();

    if (options?.limit) qb.take(options.limit);
    if (options?.offset) qb.skip(options.offset);

    const reports = await qb.getMany();
    return { reports, total };
  }
}
