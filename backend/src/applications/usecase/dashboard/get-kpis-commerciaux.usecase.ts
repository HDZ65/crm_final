import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ContratEntity } from '../../../infrastructure/db/entities/contrat.entity';
import { FactureEntity } from '../../../infrastructure/db/entities/facture.entity';
import { ClientBaseEntity } from '../../../infrastructure/db/entities/client-base.entity';
import { UtilisateurEntity } from '../../../infrastructure/db/entities/utilisateur.entity';
import {
  KpisCommerciauxResponseDto,
  VariationKpiDto,
  ClassementCommercialDto,
} from '../../dto/dashboard/kpis-commerciaux.dto';
import { DashboardFiltersDto } from '../../dto/dashboard/dashboard-filters.dto';

@Injectable()
export class GetKpisCommerciauxUseCase {
  constructor(
    @InjectRepository(ContratEntity)
    private readonly contratRepository: Repository<ContratEntity>,
    @InjectRepository(FactureEntity)
    private readonly factureRepository: Repository<FactureEntity>,
    @InjectRepository(ClientBaseEntity)
    private readonly clientRepository: Repository<ClientBaseEntity>,
    @InjectRepository(UtilisateurEntity)
    private readonly utilisateurRepository: Repository<UtilisateurEntity>,
  ) {}

  async execute(filters: DashboardFiltersDto): Promise<KpisCommerciauxResponseDto> {
    const { dateDebut, dateFin, organisationId, societeId } = this.resolveDates(filters);

    // Calcul du mois précédent pour les variations
    const datePrecedenteDebut = new Date(dateDebut);
    datePrecedenteDebut.setMonth(datePrecedenteDebut.getMonth() - 1);
    const datePrecedenteFin = new Date(dateFin);
    datePrecedenteFin.setMonth(datePrecedenteFin.getMonth() - 1);

    // 1. Nouveaux clients
    const nouveauxClientsMois = await this.countNouveauxClients(dateDebut, dateFin, organisationId);
    const nouveauxClientsPrecedent = await this.countNouveauxClients(datePrecedenteDebut, datePrecedenteFin, organisationId);

    // 2. Taux de conversion
    const tauxConversion = await this.calculateTauxConversion(dateDebut, dateFin, organisationId, societeId);
    const tauxConversionPrecedent = await this.calculateTauxConversion(datePrecedenteDebut, datePrecedenteFin, organisationId, societeId);

    // 3. Panier moyen
    const panierMoyen = await this.calculatePanierMoyen(dateDebut, dateFin, organisationId);
    const panierMoyenPrecedent = await this.calculatePanierMoyen(datePrecedenteDebut, datePrecedenteFin, organisationId);

    // 4. CA prévisionnel 3 mois
    const caPrevisionnel3Mois = await this.calculateCAPrevisionnel(organisationId, societeId);

    // 5. Classements commerciaux
    const classementParVentes = await this.getClassementParVentes(dateDebut, dateFin, organisationId, societeId);
    const classementParCA = await this.getClassementParCA(dateDebut, dateFin, organisationId, societeId);
    const classementParConversion = await this.getClassementParConversion(dateDebut, dateFin, organisationId, societeId);

    return {
      nouveauxClientsMois,
      nouveauxClientsVariation: this.calculateVariation(nouveauxClientsMois, nouveauxClientsPrecedent),
      tauxConversion,
      tauxConversionVariation: this.calculateVariation(tauxConversion, tauxConversionPrecedent),
      panierMoyen,
      panierMoyenVariation: this.calculateVariation(panierMoyen, panierMoyenPrecedent),
      caPrevisionnel3Mois,
      classementParVentes,
      classementParCA,
      classementParConversion,
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

  private async countNouveauxClients(
    dateDebut: Date,
    dateFin: Date,
    organisationId?: string,
  ): Promise<number> {
    const queryBuilder = this.clientRepository.createQueryBuilder('client');

    queryBuilder.where('client.createdAt BETWEEN :dateDebut AND :dateFin', {
      dateDebut: dateDebut.toISOString(),
      dateFin: dateFin.toISOString(),
    });

    if (organisationId) {
      queryBuilder.andWhere('client.organisationId = :organisationId', { organisationId });
    }

    return queryBuilder.getCount();
  }

  private async calculateTauxConversion(
    dateDebut: Date,
    dateFin: Date,
    organisationId?: string,
    societeId?: string,
  ): Promise<number> {
    // Nombre de contrats signés dans la période
    const contratsSignesQuery = this.contratRepository.createQueryBuilder('contrat');
    contratsSignesQuery.where('contrat.dateSignature BETWEEN :dateDebut AND :dateFin', {
      dateDebut: dateDebut.toISOString().split('T')[0],
      dateFin: dateFin.toISOString().split('T')[0],
    });

    if (organisationId) {
      contratsSignesQuery.andWhere('contrat.organisationId = :organisationId', { organisationId });
    }
    if (societeId) {
      contratsSignesQuery.andWhere('contrat.societeId = :societeId', { societeId });
    }

    const contratsSigned = await contratsSignesQuery.getCount();

    // Nombre total de clients (prospects + convertis) créés avant la fin de période
    const totalClientsQuery = this.clientRepository.createQueryBuilder('client');
    totalClientsQuery.where('client.createdAt <= :dateFin', {
      dateFin: dateFin.toISOString(),
    });

    if (organisationId) {
      totalClientsQuery.andWhere('client.organisationId = :organisationId', { organisationId });
    }

    const totalClients = await totalClientsQuery.getCount();

    if (totalClients === 0) return 0;
    return parseFloat(((contratsSigned / totalClients) * 100).toFixed(1));
  }

  private async calculatePanierMoyen(
    dateDebut: Date,
    dateFin: Date,
    organisationId?: string,
  ): Promise<number> {
    const queryBuilder = this.factureRepository.createQueryBuilder('facture');

    queryBuilder.select('AVG(facture.montantTTC)', 'moyenne');
    queryBuilder.where('facture.dateEmission BETWEEN :dateDebut AND :dateFin', {
      dateDebut: dateDebut.toISOString().split('T')[0],
      dateFin: dateFin.toISOString().split('T')[0],
    });

    if (organisationId) {
      queryBuilder.andWhere('facture.organisationId = :organisationId', { organisationId });
    }

    const result = await queryBuilder.getRawOne();
    return Math.round(parseFloat(result?.moyenne || '0'));
  }

  private async calculateCAPrevisionnel(
    organisationId?: string,
    societeId?: string,
  ): Promise<number> {
    const now = new Date();
    const dans3Mois = new Date(now.getFullYear(), now.getMonth() + 3, 0);

    // CA prévisionnel basé sur les contrats actifs avec leurs lignes
    const queryBuilder = this.contratRepository.createQueryBuilder('contrat');
    queryBuilder.leftJoin('contrat.lignesContrat', 'ligne');
    queryBuilder.select('SUM(ligne.quantite * ligne.prixUnitaire * 3)', 'total');

    // Contrats actifs (en cours)
    queryBuilder.where('contrat.dateDebut <= :now', { now: now.toISOString().split('T')[0] });
    queryBuilder.andWhere('(contrat.dateFin >= :now OR contrat.dateFin IS NULL)', { now: now.toISOString().split('T')[0] });

    if (organisationId) {
      queryBuilder.andWhere('contrat.organisationId = :organisationId', { organisationId });
    }
    if (societeId) {
      queryBuilder.andWhere('contrat.societeId = :societeId', { societeId });
    }

    const result = await queryBuilder.getRawOne();
    return Math.round(parseFloat(result?.total || '0'));
  }

  private async getClassementParVentes(
    dateDebut: Date,
    dateFin: Date,
    organisationId?: string,
    societeId?: string,
  ): Promise<ClassementCommercialDto[]> {
    const queryBuilder = this.contratRepository.createQueryBuilder('contrat');
    queryBuilder.leftJoin('contrat.commercial', 'commercial');
    queryBuilder.select('contrat.commercialId', 'commercialid');
    queryBuilder.addSelect("CONCAT(commercial.prenom, ' ', commercial.nom)", 'nomcomplet');
    queryBuilder.addSelect('COUNT(contrat.id)', 'valeur');
    queryBuilder.where('contrat.dateSignature BETWEEN :dateDebut AND :dateFin', {
      dateDebut: dateDebut.toISOString().split('T')[0],
      dateFin: dateFin.toISOString().split('T')[0],
    });

    if (organisationId) {
      queryBuilder.andWhere('contrat.organisationId = :organisationId', { organisationId });
    }
    if (societeId) {
      queryBuilder.andWhere('contrat.societeId = :societeId', { societeId });
    }

    queryBuilder.groupBy('contrat.commercialId');
    queryBuilder.addGroupBy('commercial.prenom');
    queryBuilder.addGroupBy('commercial.nom');
    queryBuilder.orderBy('valeur', 'DESC');
    queryBuilder.limit(10);

    const results = await queryBuilder.getRawMany();

    return results.map((r, index) => ({
      commercialId: r.commercialid,
      nomComplet: r.nomcomplet || 'N/A',
      valeur: parseInt(r.valeur, 10),
      rang: index + 1,
    }));
  }

  private async getClassementParCA(
    dateDebut: Date,
    dateFin: Date,
    organisationId?: string,
    societeId?: string,
  ): Promise<ClassementCommercialDto[]> {
    const queryBuilder = this.factureRepository.createQueryBuilder('facture');
    queryBuilder.leftJoin('facture.contrat', 'contrat');
    queryBuilder.leftJoin('contrat.commercial', 'commercial');
    queryBuilder.select('contrat.commercialId', 'commercialid');
    queryBuilder.addSelect("CONCAT(commercial.prenom, ' ', commercial.nom)", 'nomcomplet');
    queryBuilder.addSelect('SUM(facture.montantTTC)', 'valeur');
    queryBuilder.where('facture.dateEmission BETWEEN :dateDebut AND :dateFin', {
      dateDebut: dateDebut.toISOString().split('T')[0],
      dateFin: dateFin.toISOString().split('T')[0],
    });
    queryBuilder.andWhere('contrat.commercialId IS NOT NULL');

    if (organisationId) {
      queryBuilder.andWhere('facture.organisationId = :organisationId', { organisationId });
    }

    queryBuilder.groupBy('contrat.commercialId');
    queryBuilder.addGroupBy('commercial.prenom');
    queryBuilder.addGroupBy('commercial.nom');
    queryBuilder.orderBy('valeur', 'DESC');
    queryBuilder.limit(10);

    const results = await queryBuilder.getRawMany();

    return results.map((r, index) => ({
      commercialId: r.commercialid,
      nomComplet: r.nomcomplet || 'N/A',
      valeur: Math.round(parseFloat(r.valeur || '0')),
      rang: index + 1,
    }));
  }

  private async getClassementParConversion(
    dateDebut: Date,
    dateFin: Date,
    organisationId?: string,
    societeId?: string,
  ): Promise<ClassementCommercialDto[]> {
    // Pour chaque commercial : nombre de contrats signés / nombre de clients assignés
    const queryBuilder = this.contratRepository.createQueryBuilder('contrat');
    queryBuilder.leftJoin('contrat.commercial', 'commercial');
    queryBuilder.select('contrat.commercialId', 'commercialid');
    queryBuilder.addSelect("CONCAT(commercial.prenom, ' ', commercial.nom)", 'nomcomplet');
    queryBuilder.addSelect('COUNT(DISTINCT contrat.clientBaseId)', 'clients_convertis');
    queryBuilder.where('contrat.dateSignature BETWEEN :dateDebut AND :dateFin', {
      dateDebut: dateDebut.toISOString().split('T')[0],
      dateFin: dateFin.toISOString().split('T')[0],
    });

    if (organisationId) {
      queryBuilder.andWhere('contrat.organisationId = :organisationId', { organisationId });
    }
    if (societeId) {
      queryBuilder.andWhere('contrat.societeId = :societeId', { societeId });
    }

    queryBuilder.groupBy('contrat.commercialId');
    queryBuilder.addGroupBy('commercial.prenom');
    queryBuilder.addGroupBy('commercial.nom');
    queryBuilder.orderBy('clients_convertis', 'DESC');
    queryBuilder.limit(10);

    const results = await queryBuilder.getRawMany();

    // Calculer le taux de conversion pour chaque commercial
    const classement: ClassementCommercialDto[] = [];

    for (const r of results) {
      // Nombre total de clients dans la période (approximation basée sur les contrats)
      const totalContrats = await this.contratRepository.count({
        where: { commercialId: r.commercialid },
      });

      const tauxConversion = totalContrats > 0
        ? parseFloat(((parseInt(r.clients_convertis, 10) / totalContrats) * 100).toFixed(1))
        : 0;

      classement.push({
        commercialId: r.commercialid,
        nomComplet: r.nomcomplet || 'N/A',
        valeur: tauxConversion,
        rang: 0,
      });
    }

    // Trier par taux de conversion et assigner les rangs
    classement.sort((a, b) => b.valeur - a.valeur);
    classement.forEach((c, index) => {
      c.rang = index + 1;
    });

    return classement;
  }

  private calculateVariation(current: number, previous: number): VariationKpiDto {
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
