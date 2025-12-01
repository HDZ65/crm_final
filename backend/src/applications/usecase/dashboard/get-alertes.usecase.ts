import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContratEntity } from '../../../infrastructure/db/entities/contrat.entity';
import { FactureEntity } from '../../../infrastructure/db/entities/facture.entity';
import { SocieteEntity } from '../../../infrastructure/db/entities/societe.entity';
import { AlertesResponseDto, AlerteDto, NiveauAlerte, TypeAlerte } from '../../dto/dashboard/alertes.dto';
import { DashboardFiltersDto } from '../../dto/dashboard/dashboard-filters.dto';
import { v4 as uuidv4 } from 'uuid';

// Seuils d'alerte configurables
const SEUILS = {
  tauxImpayes: {
    critique: 5, // > 5% = critique
    avertissement: 3, // > 3% = avertissement
  },
  tauxChurn: {
    critique: 10, // > 10% = critique
    avertissement: 7, // > 7% = avertissement
  },
  controlesQualite: {
    critique: 100, // > 100 en attente = critique
    avertissement: 50, // > 50 en attente = avertissement
  },
};

@Injectable()
export class GetAlertesUseCase {
  constructor(
    @InjectRepository(ContratEntity)
    private readonly contratRepository: Repository<ContratEntity>,
    @InjectRepository(FactureEntity)
    private readonly factureRepository: Repository<FactureEntity>,
    @InjectRepository(SocieteEntity)
    private readonly societeRepository: Repository<SocieteEntity>,
  ) {}

  async execute(filters: DashboardFiltersDto): Promise<AlertesResponseDto> {
    const { dateDebut, dateFin, organisationId } = this.resolveDates(filters);
    const alertes: AlerteDto[] = [];

    // Récupérer les sociétés
    const societesQuery = this.societeRepository.createQueryBuilder('societe');
    if (organisationId) {
      societesQuery.where('societe.organisationId = :organisationId', { organisationId });
    }
    const societes = await societesQuery.getMany();

    // Vérifier les alertes par société
    for (const societe of societes) {
      // Alerte taux d'impayés
      const tauxImpayes = await this.calculateTauxImpayes(societe.id, dateDebut, dateFin);
      if (tauxImpayes > SEUILS.tauxImpayes.critique) {
        alertes.push(this.createAlerte(
          `Taux d'impayés élevé - ${societe.raisonSociale}`,
          `Le taux d'impayés dépasse le seuil de ${SEUILS.tauxImpayes.critique}%`,
          'critique',
          'taux_impayes',
          tauxImpayes,
          SEUILS.tauxImpayes.critique,
          societe.raisonSociale,
          societe.id,
        ));
      } else if (tauxImpayes > SEUILS.tauxImpayes.avertissement) {
        alertes.push(this.createAlerte(
          `Taux d'impayés en hausse - ${societe.raisonSociale}`,
          `Le taux d'impayés approche le seuil d'alerte`,
          'avertissement',
          'taux_impayes',
          tauxImpayes,
          SEUILS.tauxImpayes.avertissement,
          societe.raisonSociale,
          societe.id,
        ));
      }

      // Alerte taux de churn
      const tauxChurn = await this.calculateTauxChurn(societe.id, dateDebut, dateFin);
      if (tauxChurn > SEUILS.tauxChurn.critique) {
        alertes.push(this.createAlerte(
          `Taux de résiliation critique - ${societe.raisonSociale}`,
          `Le taux de churn dépasse le seuil critique de ${SEUILS.tauxChurn.critique}%`,
          'critique',
          'taux_churn',
          tauxChurn,
          SEUILS.tauxChurn.critique,
          societe.raisonSociale,
          societe.id,
        ));
      } else if (tauxChurn > SEUILS.tauxChurn.avertissement) {
        alertes.push(this.createAlerte(
          `Taux de résiliation en hausse - ${societe.raisonSociale}`,
          `Le taux de churn approche le seuil d'alerte`,
          'avertissement',
          'taux_churn',
          tauxChurn,
          SEUILS.tauxChurn.avertissement,
          societe.raisonSociale,
          societe.id,
        ));
      }
    }

    // Alertes globales: contrôles qualité en attente
    const contratsEnAttente = await this.countContratsEnAttenteValidation(dateDebut, dateFin, organisationId);
    if (contratsEnAttente > SEUILS.controlesQualite.critique) {
      alertes.push(this.createAlerte(
        'Contrôles qualité en attente',
        `${contratsEnAttente} contrats en attente de validation CQ depuis > 5 jours`,
        'info',
        'controles_qualite',
        contratsEnAttente,
        SEUILS.controlesQualite.critique,
      ));
    } else if (contratsEnAttente > SEUILS.controlesQualite.avertissement) {
      alertes.push(this.createAlerte(
        'Contrôles qualité à traiter',
        `${contratsEnAttente} contrats en attente de validation`,
        'info',
        'controles_qualite',
        contratsEnAttente,
        SEUILS.controlesQualite.avertissement,
      ));
    }

    // Trier par niveau (critique > avertissement > info)
    const niveauPriority = { critique: 0, avertissement: 1, info: 2 };
    alertes.sort((a, b) => niveauPriority[a.niveau] - niveauPriority[b.niveau]);

    return {
      alertes,
      total: alertes.length,
      nombreCritiques: alertes.filter(a => a.niveau === 'critique').length,
      nombreAvertissements: alertes.filter(a => a.niveau === 'avertissement').length,
      nombreInfos: alertes.filter(a => a.niveau === 'info').length,
    };
  }

  private createAlerte(
    titre: string,
    description: string,
    niveau: NiveauAlerte,
    type: TypeAlerte,
    valeurActuelle: number,
    seuil: number,
    entiteConcernee?: string,
    entiteId?: string,
  ): AlerteDto {
    return {
      id: uuidv4(),
      titre,
      description,
      niveau,
      type,
      valeurActuelle,
      seuil,
      dateDetection: new Date().toISOString().split('T')[0],
      entiteConcernee,
      entiteId,
    };
  }

  private async calculateTauxImpayes(societeId: string, dateDebut: Date, dateFin: Date): Promise<number> {
    const totalResult = await this.factureRepository.createQueryBuilder('facture')
      .select('SUM(facture.montantTTC)', 'total')
      .innerJoin('facture.contrat', 'contrat')
      .where('contrat.societeId = :societeId', { societeId })
      .andWhere('facture.dateEmission BETWEEN :dateDebut AND :dateFin', {
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString(),
      })
      .getRawOne();

    const totalFactures = parseFloat(totalResult?.total || '0');

    const impayesResult = await this.factureRepository.createQueryBuilder('facture')
      .select('SUM(facture.montantTTC)', 'total')
      .innerJoin('facture.contrat', 'contrat')
      .where('contrat.societeId = :societeId', { societeId })
      .andWhere('facture.dateEmission BETWEEN :dateDebut AND :dateFin', {
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString(),
      })
      .andWhere('facture.statutId IN (SELECT id FROM statut_factures WHERE LOWER(nom) LIKE :statutImpaye)', {
        statutImpaye: '%impay%',
      })
      .getRawOne();

    const totalImpayes = parseFloat(impayesResult?.total || '0');

    if (totalFactures === 0) return 0;
    return parseFloat(((totalImpayes / totalFactures) * 100).toFixed(1));
  }

  private async calculateTauxChurn(societeId: string, dateDebut: Date, dateFin: Date): Promise<number> {
    const contratsResilies = await this.contratRepository.createQueryBuilder('contrat')
      .where('contrat.societeId = :societeId', { societeId })
      .andWhere('contrat.dateFin BETWEEN :dateDebut AND :dateFin', {
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString(),
      })
      .getCount();

    const totalContrats = await this.contratRepository.createQueryBuilder('contrat')
      .where('contrat.societeId = :societeId', { societeId })
      .andWhere('contrat.dateDebut <= :dateFin', { dateFin: dateFin.toISOString() })
      .andWhere('(contrat.dateFin >= :dateDebut OR contrat.dateFin IS NULL)', { dateDebut: dateDebut.toISOString() })
      .getCount();

    if (totalContrats === 0) return 0;
    return parseFloat(((contratsResilies / totalContrats) * 100).toFixed(1));
  }

  private async countContratsEnAttenteValidation(
    dateDebut: Date,
    dateFin: Date,
    organisationId?: string,
  ): Promise<number> {
    // Contrats créés il y a plus de 5 jours et toujours en attente
    const fivesDaysAgo = new Date();
    fivesDaysAgo.setDate(fivesDaysAgo.getDate() - 5);

    const queryBuilder = this.contratRepository.createQueryBuilder('contrat');
    queryBuilder.where('contrat.createdAt <= :fivesDaysAgo', { fivesDaysAgo: fivesDaysAgo.toISOString() });
    // Note: Adapter selon votre logique de statut "en attente de validation"
    queryBuilder.andWhere('contrat.statutId IN (SELECT id FROM statut_contrats WHERE LOWER(nom) LIKE :statutAttente)', {
      statutAttente: '%attente%',
    });

    if (organisationId) {
      queryBuilder.andWhere('contrat.organisationId = :organisationId', { organisationId });
    }

    return queryBuilder.getCount();
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
        dateDebut = filters.dateDebut ? new Date(filters.dateDebut) : new Date(now.getFullYear(), now.getMonth(), 1);
        dateFin = filters.dateFin ? new Date(filters.dateFin) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return {
      dateDebut,
      dateFin,
      organisationId: filters.organisationId,
    };
  }
}
