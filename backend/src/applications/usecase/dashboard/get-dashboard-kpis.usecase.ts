import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ContratEntity } from '../../../infrastructure/db/entities/contrat.entity';
import { FactureEntity } from '../../../infrastructure/db/entities/facture.entity';
import { DashboardKpisDto, VariationDto } from '../../dto/dashboard/dashboard-kpis.dto';
import { DashboardFiltersDto } from '../../dto/dashboard/dashboard-filters.dto';

@Injectable()
export class GetDashboardKpisUseCase {
  constructor(
    @InjectRepository(ContratEntity)
    private readonly contratRepository: Repository<ContratEntity>,
    @InjectRepository(FactureEntity)
    private readonly factureRepository: Repository<FactureEntity>,
  ) {}

  async execute(filters: DashboardFiltersDto): Promise<DashboardKpisDto> {
    const { dateDebut, dateFin, organisationId, societeId } = this.resolveDates(filters);

    // Calcul du mois précédent pour les variations
    const datePrecedenteDebut = new Date(dateDebut);
    datePrecedenteDebut.setMonth(datePrecedenteDebut.getMonth() - 1);
    const datePrecedenteFin = new Date(dateFin);
    datePrecedenteFin.setMonth(datePrecedenteFin.getMonth() - 1);

    // Contrats actifs (période courante)
    const contratsActifs = await this.countContratsActifs(dateDebut, dateFin, organisationId, societeId);
    const contratsActifsPrecedent = await this.countContratsActifs(datePrecedenteDebut, datePrecedenteFin, organisationId, societeId);

    // MRR (Monthly Recurring Revenue)
    const mrr = await this.calculateMRR(dateDebut, dateFin, organisationId, societeId);
    const mrrPrecedent = await this.calculateMRR(datePrecedenteDebut, datePrecedenteFin, organisationId, societeId);

    // Taux de churn
    const tauxChurn = await this.calculateTauxChurn(dateDebut, dateFin, organisationId, societeId);
    const tauxChurnPrecedent = await this.calculateTauxChurn(datePrecedenteDebut, datePrecedenteFin, organisationId, societeId);

    // Taux d'impayés
    const tauxImpayes = await this.calculateTauxImpayes(dateDebut, dateFin, organisationId, societeId);
    const tauxImpayesPrecedent = await this.calculateTauxImpayes(datePrecedenteDebut, datePrecedenteFin, organisationId, societeId);

    return {
      contratsActifs,
      contratsActifsVariation: this.calculateVariation(contratsActifs, contratsActifsPrecedent),
      mrr,
      mrrVariation: this.calculateVariation(mrr, mrrPrecedent),
      tauxChurn,
      tauxChurnVariation: this.calculateVariation(tauxChurn, tauxChurnPrecedent),
      tauxImpayes,
      tauxImpayesVariation: this.calculateVariation(tauxImpayes, tauxImpayesPrecedent),
    };
  }

  private resolveDates(filters: DashboardFiltersDto): {
    dateDebut: Date;
    dateFin: Date;
    organisationId?: string;
    societeId?: string;
  } {
    const now = new Date();
    let dateDebut: Date;
    let dateFin: Date;

    switch (filters.periodeRapide) {
      case 'mois_courant':
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'mois_dernier':
        dateDebut = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        dateFin = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'trimestre_courant':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        dateDebut = new Date(now.getFullYear(), quarterStart, 1);
        dateFin = new Date(now.getFullYear(), quarterStart + 3, 0);
        break;
      case 'annee_courante':
        dateDebut = new Date(now.getFullYear(), 0, 1);
        dateFin = new Date(now.getFullYear(), 11, 31);
        break;
      case 'personnalisee':
      default:
        dateDebut = filters.dateDebut ? new Date(filters.dateDebut) : new Date(now.getFullYear(), now.getMonth(), 1);
        dateFin = filters.dateFin ? new Date(filters.dateFin) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return {
      dateDebut,
      dateFin,
      organisationId: filters.organisationId,
      societeId: filters.societeId,
    };
  }

  private async countContratsActifs(
    dateDebut: Date,
    dateFin: Date,
    organisationId?: string,
    societeId?: string,
  ): Promise<number> {
    const queryBuilder = this.contratRepository.createQueryBuilder('contrat');

    // Contrats actifs = date de début <= dateFin ET (date de fin >= dateDebut OU pas de date de fin)
    queryBuilder.where('contrat.dateDebut <= :dateFin', { dateFin: dateFin.toISOString() });
    queryBuilder.andWhere('(contrat.dateFin >= :dateDebut OR contrat.dateFin IS NULL)', { dateDebut: dateDebut.toISOString() });

    if (organisationId) {
      queryBuilder.andWhere('contrat.organisationId = :organisationId', { organisationId });
    }
    if (societeId) {
      queryBuilder.andWhere('contrat.societeId = :societeId', { societeId });
    }

    return queryBuilder.getCount();
  }

  private async calculateMRR(
    dateDebut: Date,
    dateFin: Date,
    organisationId?: string,
    societeId?: string,
  ): Promise<number> {
    const queryBuilder = this.factureRepository.createQueryBuilder('facture');

    queryBuilder.select('SUM(facture.montantHT)', 'total');
    queryBuilder.where('facture.dateEmission BETWEEN :dateDebut AND :dateFin', {
      dateDebut: dateDebut.toISOString(),
      dateFin: dateFin.toISOString(),
    });

    if (organisationId) {
      queryBuilder.andWhere('facture.organisationId = :organisationId', { organisationId });
    }

    const result = await queryBuilder.getRawOne();
    return parseFloat(result?.total || '0');
  }

  private async calculateTauxChurn(
    dateDebut: Date,
    dateFin: Date,
    organisationId?: string,
    societeId?: string,
  ): Promise<number> {
    // Contrats résiliés = contrats dont la date de fin est dans la période
    const queryBuilder = this.contratRepository.createQueryBuilder('contrat');

    queryBuilder.where('contrat.dateFin BETWEEN :dateDebut AND :dateFin', {
      dateDebut: dateDebut.toISOString(),
      dateFin: dateFin.toISOString(),
    });

    if (organisationId) {
      queryBuilder.andWhere('contrat.organisationId = :organisationId', { organisationId });
    }
    if (societeId) {
      queryBuilder.andWhere('contrat.societeId = :societeId', { societeId });
    }

    const contratsResilies = await queryBuilder.getCount();
    const totalContrats = await this.countContratsActifs(dateDebut, dateFin, organisationId, societeId);

    if (totalContrats === 0) return 0;
    return parseFloat(((contratsResilies / totalContrats) * 100).toFixed(1));
  }

  private async calculateTauxImpayes(
    dateDebut: Date,
    dateFin: Date,
    organisationId?: string,
    societeId?: string,
  ): Promise<number> {
    // Total des factures
    const totalQueryBuilder = this.factureRepository.createQueryBuilder('facture');
    totalQueryBuilder.select('SUM(facture.montantTTC)', 'total');
    totalQueryBuilder.where('facture.dateEmission BETWEEN :dateDebut AND :dateFin', {
      dateDebut: dateDebut.toISOString(),
      dateFin: dateFin.toISOString(),
    });
    if (organisationId) {
      totalQueryBuilder.andWhere('facture.organisationId = :organisationId', { organisationId });
    }
    const totalResult = await totalQueryBuilder.getRawOne();
    const totalFactures = parseFloat(totalResult?.total || '0');

    // Factures impayées (on suppose que le statut "impaye" existe)
    const impayesQueryBuilder = this.factureRepository.createQueryBuilder('facture');
    impayesQueryBuilder.select('SUM(facture.montantTTC)', 'total');
    impayesQueryBuilder.where('facture.dateEmission BETWEEN :dateDebut AND :dateFin', {
      dateDebut: dateDebut.toISOString(),
      dateFin: dateFin.toISOString(),
    });
    // Note: Adapter selon votre logique de statut impayé
    impayesQueryBuilder.andWhere('facture.statutId IN (SELECT id FROM statutfactures WHERE LOWER(nom) LIKE :statutImpaye)', {
      statutImpaye: '%impay%',
    });
    if (organisationId) {
      impayesQueryBuilder.andWhere('facture.organisationId = :organisationId', { organisationId });
    }
    const impayesResult = await impayesQueryBuilder.getRawOne();
    const totalImpayes = parseFloat(impayesResult?.total || '0');

    if (totalFactures === 0) return 0;
    return parseFloat(((totalImpayes / totalFactures) * 100).toFixed(1));
  }

  private calculateVariation(current: number, previous: number): VariationDto {
    if (previous === 0) {
      return {
        pourcentage: current > 0 ? 100 : 0,
        tendance: current > 0 ? 'hausse' : 'stable',
      };
    }

    const pourcentage = parseFloat((((current - previous) / previous) * 100).toFixed(1));

    return {
      pourcentage: Math.abs(pourcentage),
      tendance: pourcentage > 0 ? 'hausse' : pourcentage < 0 ? 'baisse' : 'stable',
    };
  }
}
