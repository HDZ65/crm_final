import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FactureEntity } from '../../../infrastructure/db/entities/facture.entity';
import { EvolutionCaResponseDto, EvolutionCaMensuelleDto } from '../../dto/dashboard/evolution-ca.dto';
import { DashboardFiltersDto } from '../../dto/dashboard/dashboard-filters.dto';

@Injectable()
export class GetEvolutionCaUseCase {
  constructor(
    @InjectRepository(FactureEntity)
    private readonly factureRepository: Repository<FactureEntity>,
  ) {}

  async execute(filters: DashboardFiltersDto): Promise<EvolutionCaResponseDto> {
    const { dateDebut, dateFin, organisationId, societeId } = this.resolveDates(filters);

    const queryBuilder = this.factureRepository.createQueryBuilder('facture');

    // Agrégation par mois
    queryBuilder.select("TO_CHAR(facture.\"dateEmission\"::date, 'YYYY-MM')", 'mois');
    queryBuilder.addSelect('SUM(facture."montantHT")', 'carealise');
    queryBuilder.where('facture."dateEmission" BETWEEN :dateDebut AND :dateFin', {
      dateDebut: dateDebut.toISOString(),
      dateFin: dateFin.toISOString(),
    });

    if (organisationId) {
      queryBuilder.andWhere('facture."organisationId" = :organisationId', { organisationId });
    }

    queryBuilder.groupBy("TO_CHAR(facture.\"dateEmission\"::date, 'YYYY-MM')");
    queryBuilder.orderBy('mois', 'ASC');

    const results = await queryBuilder.getRawMany();

    // Générer tous les mois entre dateDebut et dateFin
    const donnees: EvolutionCaMensuelleDto[] = [];
    const currentDate = new Date(dateDebut);

    while (currentDate <= dateFin) {
      const moisKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const found = results.find(r => r.mois === moisKey);

      donnees.push({
        mois: moisKey,
        caRealise: parseFloat(found?.carealise || '0'),
        objectif: 0, // À définir selon votre logique métier
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return {
      periodeDebut: dateDebut.toISOString().split('T')[0],
      periodeFin: dateFin.toISOString().split('T')[0],
      donnees,
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

    // Par défaut: 12 mois glissants
    switch (filters.periodeRapide) {
      case 'mois_courant':
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
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
        dateDebut = filters.dateDebut ? new Date(filters.dateDebut) : new Date(now.getFullYear() - 1, now.getMonth(), 1);
        dateFin = filters.dateFin ? new Date(filters.dateFin) : now;
        break;
      default:
        // 12 mois glissants par défaut
        dateDebut = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return {
      dateDebut,
      dateFin,
      organisationId: filters.organisationId,
      societeId: filters.societeId,
    };
  }
}
