import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContratEntity } from '../../../infrastructure/db/entities/contrat.entity';
import { FactureEntity } from '../../../infrastructure/db/entities/facture.entity';
import { SocieteEntity } from '../../../infrastructure/db/entities/societe.entity';
import { ClientBaseEntity } from '../../../infrastructure/db/entities/client-base.entity';
import { StatutContratEntity } from '../../../infrastructure/db/entities/statut-contrat.entity';
import {
  StatsSocietesResponseDto,
  StatsSocieteDto,
} from '../../dto/dashboard/stats-societe.dto';
import { DashboardFiltersDto } from '../../dto/dashboard/dashboard-filters.dto';

@Injectable()
export class GetStatsSocietesUseCase {
  constructor(
    @InjectRepository(ContratEntity)
    private readonly contratRepository: Repository<ContratEntity>,
    @InjectRepository(FactureEntity)
    private readonly factureRepository: Repository<FactureEntity>,
    @InjectRepository(SocieteEntity)
    private readonly societeRepository: Repository<SocieteEntity>,
    @InjectRepository(ClientBaseEntity)
    private readonly clientRepository: Repository<ClientBaseEntity>,
    @InjectRepository(StatutContratEntity)
    private readonly statutContratRepository: Repository<StatutContratEntity>,
  ) {}

  async execute(
    filters: DashboardFiltersDto,
  ): Promise<StatsSocietesResponseDto> {
    const { dateDebut, dateFin, organisationId } = this.resolveDates(filters);

    // Récupérer toutes les sociétés
    const societesQuery = this.societeRepository.createQueryBuilder('societe');
    if (organisationId) {
      societesQuery.where('societe.organisationId = :organisationId', {
        organisationId,
      });
    }
    const societes = await societesQuery.getMany();

    // Calculer les stats pour chaque société
    const statsPromises = societes.map(async (societe) => {
      const stats = await this.calculateStatsForSociete(
        societe.id,
        dateDebut,
        dateFin,
        organisationId,
      );
      return {
        societeId: societe.id,
        nomSociete: societe.raisonSociale,
        ...stats,
      };
    });

    const societeStats = await Promise.all(statsPromises);

    // Trier par MRR décroissant
    societeStats.sort((a, b) => b.mrr - a.mrr);

    return {
      societes: societeStats,
      total: societeStats.length,
    };
  }

  private async calculateStatsForSociete(
    societeId: string,
    dateDebut: Date,
    dateFin: Date,
    organisationId?: string,
  ): Promise<Omit<StatsSocieteDto, 'societeId' | 'nomSociete'>> {
    // Dates du mois précédent pour calculer les variations
    const datePrecedenteDebut = new Date(dateDebut);
    datePrecedenteDebut.setMonth(datePrecedenteDebut.getMonth() - 1);
    const datePrecedenteFin = new Date(dateFin);
    datePrecedenteFin.setMonth(datePrecedenteFin.getMonth() - 1);

    // Contrats actifs
    const contratsActifs = await this.countContratsActifs(
      societeId,
      dateDebut,
      dateFin,
    );

    // MRR
    const mrr = await this.calculateMRR(societeId, dateDebut, dateFin);

    // ARR = MRR * 12
    const arr = mrr * 12;

    // Nouveaux clients
    const nouveauxClients = await this.countNouveauxClients(
      societeId,
      dateDebut,
      dateFin,
    );
    const nouveauxClientsPrecedent = await this.countNouveauxClients(
      societeId,
      datePrecedenteDebut,
      datePrecedenteFin,
    );
    const nouveauxClientsVariation =
      nouveauxClientsPrecedent > 0
        ? parseFloat(
            (
              ((nouveauxClients - nouveauxClientsPrecedent) /
                nouveauxClientsPrecedent) *
              100
            ).toFixed(0),
          )
        : nouveauxClients > 0
          ? 100
          : 0;

    // Taux de churn
    const tauxChurn = await this.calculateTauxChurn(
      societeId,
      dateDebut,
      dateFin,
    );

    // Taux d'impayés
    const tauxImpayes = await this.calculateTauxImpayes(
      societeId,
      dateDebut,
      dateFin,
    );

    return {
      contratsActifs,
      mrr,
      arr,
      nouveauxClients,
      nouveauxClientsVariation,
      tauxChurn,
      tauxImpayes,
    };
  }

  private async countContratsActifs(
    societeId: string,
    dateDebut: Date,
    dateFin: Date,
  ): Promise<number> {
    // Compter les contrats signés dans la période spécifiée
    return this.contratRepository
      .createQueryBuilder('contrat')
      .where('contrat.societeId = :societeId', { societeId })
      .andWhere('contrat.dateSignature >= :dateDebut', {
        dateDebut: dateDebut.toISOString().split('T')[0],
      })
      .andWhere('contrat.dateSignature <= :dateFin', {
        dateFin: dateFin.toISOString().split('T')[0],
      })
      .getCount();
  }

  private async calculateMRR(
    societeId: string,
    dateDebut: Date,
    dateFin: Date,
  ): Promise<number> {
    const result = await this.factureRepository
      .createQueryBuilder('facture')
      .select('SUM(facture.montantHT)', 'total')
      .innerJoin('facture.contrat', 'contrat')
      .where('contrat.societeId = :societeId', { societeId })
      .andWhere('facture.dateEmission BETWEEN :dateDebut AND :dateFin', {
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString(),
      })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  private async countNouveauxClients(
    societeId: string,
    dateDebut: Date,
    dateFin: Date,
  ): Promise<number> {
    // Compter les clients qui ont leur premier contrat dans la période
    const result = await this.contratRepository
      .createQueryBuilder('contrat')
      .select('COUNT(DISTINCT contrat.clientId)', 'count')
      .where('contrat.societeId = :societeId', { societeId })
      .andWhere('contrat.dateSignature BETWEEN :dateDebut AND :dateFin', {
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString(),
      })
      .getRawOne();

    return parseInt(result?.count || '0', 10);
  }

  private async calculateTauxChurn(
    societeId: string,
    dateDebut: Date,
    dateFin: Date,
  ): Promise<number> {
    const contratsResilies = await this.contratRepository
      .createQueryBuilder('contrat')
      .where('contrat.societeId = :societeId', { societeId })
      .andWhere('contrat.dateFin BETWEEN :dateDebut AND :dateFin', {
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString(),
      })
      .getCount();

    const totalContrats = await this.countContratsActifs(
      societeId,
      dateDebut,
      dateFin,
    );

    if (totalContrats === 0) return 0;
    return parseFloat(((contratsResilies / totalContrats) * 100).toFixed(1));
  }

  private async calculateTauxImpayes(
    societeId: string,
    dateDebut: Date,
    dateFin: Date,
  ): Promise<number> {
    // Total des factures
    const totalResult = await this.factureRepository
      .createQueryBuilder('facture')
      .select('SUM(facture.montantTTC)', 'total')
      .innerJoin('facture.contrat', 'contrat')
      .where('contrat.societeId = :societeId', { societeId })
      .andWhere('facture.dateEmission BETWEEN :dateDebut AND :dateFin', {
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString(),
      })
      .getRawOne();

    const totalFactures = parseFloat(totalResult?.total || '0');

    // Factures impayées
    const impayesResult = await this.factureRepository
      .createQueryBuilder('facture')
      .select('SUM(facture.montantTTC)', 'total')
      .innerJoin('facture.contrat', 'contrat')
      .where('contrat.societeId = :societeId', { societeId })
      .andWhere('facture.dateEmission BETWEEN :dateDebut AND :dateFin', {
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString(),
      })
      .andWhere(
        'facture.statutId IN (SELECT id FROM statutfactures WHERE LOWER(nom) LIKE :statutImpaye)',
        {
          statutImpaye: '%impay%',
        },
      )
      .getRawOne();

    const totalImpayes = parseFloat(impayesResult?.total || '0');

    if (totalFactures === 0) return 0;
    return parseFloat(((totalImpayes / totalFactures) * 100).toFixed(1));
  }

  private resolveDates(filters: DashboardFiltersDto): {
    dateDebut: Date;
    dateFin: Date;
    organisationId?: string;
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
      default:
        dateDebut = filters.dateDebut
          ? new Date(filters.dateDebut)
          : new Date(now.getFullYear(), now.getMonth(), 1);
        dateFin = filters.dateFin
          ? new Date(filters.dateFin)
          : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return {
      dateDebut,
      dateFin,
      organisationId: filters.organisationId,
    };
  }
}
