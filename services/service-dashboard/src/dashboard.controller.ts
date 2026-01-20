import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import type {
  DashboardFilters,
  GetKpisRequest,
  KpisResponse,
  GetEvolutionCaRequest,
  EvolutionCaResponse,
  GetRepartitionProduitsRequest,
  RepartitionProduitsResponse,
  GetStatsSocietesRequest,
  StatsSocietesResponse,
  GetAlertesRequest,
  AlertesResponse,
  GetKpisCommerciauxRequest,
  KpisCommerciauxResponse,
} from '@proto/dashboard/dashboard';

import { KpisService, DashboardFilters as ServiceDashboardFilters } from './modules/kpis/kpis.service';
import { EvolutionCaService } from './modules/evolution-ca/evolution-ca.service';
import { RepartitionProduitsService } from './modules/repartition-produits/repartition-produits.service';
import { StatsSocietesService } from './modules/stats-societes/stats-societes.service';
import { AlertesService } from './modules/alertes/alertes.service';
import { KpisCommerciauxService } from './modules/kpis-commerciaux/kpis-commerciaux.service';

function mapFilters(proto: DashboardFilters): ServiceDashboardFilters {
  return {
    organisationId: proto.organisationId,
    societeId: proto.societeId,
    produitId: proto.produitId,
    canal: proto.canal,
    dateDebut: proto.dateDebut,
    dateFin: proto.dateFin,
    periodeRapide: proto.periodeRapide,
  };
}

@Controller()
export class DashboardController {
  constructor(
    private readonly kpisService: KpisService,
    private readonly evolutionCaService: EvolutionCaService,
    private readonly repartitionService: RepartitionProduitsService,
    private readonly statsService: StatsSocietesService,
    private readonly alertesService: AlertesService,
    private readonly kpisCommerciauxService: KpisCommerciauxService,
  ) {}

  // ===== MAIN KPIs =====

  @GrpcMethod('DashboardKpisService', 'GetKpis')
  async getKpis(data: GetKpisRequest): Promise<KpisResponse> {
    const result = await this.kpisService.getKpis(mapFilters(data.filters!));
    return {
      contratsActifs: result.contratsActifs,
      contratsActifsVariation: {
        pourcentage: result.contratsActifsVariation.pourcentage,
        tendance: result.contratsActifsVariation.tendance,
      },
      mrr: result.mrr,
      mrrVariation: {
        pourcentage: result.mrrVariation.pourcentage,
        tendance: result.mrrVariation.tendance,
      },
      tauxChurn: result.tauxChurn,
      tauxChurnVariation: {
        pourcentage: result.tauxChurnVariation.pourcentage,
        tendance: result.tauxChurnVariation.tendance,
      },
      tauxImpayes: result.tauxImpayes,
      tauxImpayesVariation: {
        pourcentage: result.tauxImpayesVariation.pourcentage,
        tendance: result.tauxImpayesVariation.tendance,
      },
    };
  }

  // ===== EVOLUTION CA =====

  @GrpcMethod('EvolutionCaService', 'GetEvolutionCa')
  async getEvolutionCa(data: GetEvolutionCaRequest): Promise<EvolutionCaResponse> {
    const result = await this.evolutionCaService.getEvolutionCa(mapFilters(data.filters!));
    return {
      periodeDebut: result.periodeDebut,
      periodeFin: result.periodeFin,
      donnees: result.donnees.map((d) => ({
        mois: d.mois,
        caRealise: d.caRealise,
        objectif: d.objectif,
      })),
    };
  }

  // ===== REPARTITION PRODUITS =====

  @GrpcMethod('RepartitionProduitsService', 'GetRepartitionProduits')
  async getRepartitionProduits(data: GetRepartitionProduitsRequest): Promise<RepartitionProduitsResponse> {
    const result = await this.repartitionService.getRepartitionProduits(mapFilters(data.filters!));
    return {
      caTotal: result.caTotal,
      produits: result.produits.map((p) => ({
        produitId: p.produitId,
        nomProduit: p.nomProduit,
        ca: p.ca,
        pourcentage: p.pourcentage,
        couleur: p.couleur,
      })),
    };
  }

  // ===== STATS SOCIETES =====

  @GrpcMethod('StatsSocietesService', 'GetStatsSocietes')
  async getStatsSocietes(data: GetStatsSocietesRequest): Promise<StatsSocietesResponse> {
    const result = await this.statsService.getStatsSocietes(mapFilters(data.filters!));
    return {
      societes: result.societes.map((s) => ({
        societeId: s.societeId,
        nomSociete: s.nomSociete,
        contratsActifs: s.contratsActifs,
        mrr: s.mrr,
        arr: s.arr,
        nouveauxClients: s.nouveauxClients,
        nouveauxClientsVariation: s.nouveauxClientsVariation,
        tauxChurn: s.tauxChurn,
        tauxImpayes: s.tauxImpayes,
      })),
      total: result.total,
    };
  }

  // ===== ALERTES =====

  @GrpcMethod('AlertesService', 'GetAlertes')
  async getAlertes(data: GetAlertesRequest): Promise<AlertesResponse> {
    const result = await this.alertesService.getAlertes(mapFilters(data.filters!));
    return {
      alertes: result.alertes.map((a) => ({
        id: a.id,
        titre: a.titre,
        description: a.description,
        niveau: a.niveau,
        type: a.type,
        valeurActuelle: a.valeurActuelle,
        seuil: a.seuil,
        dateDetection: a.dateDetection,
        entiteConcernee: a.entiteConcernee || '',
        entiteId: a.entiteId || '',
      })),
      total: result.total,
      nombreCritiques: result.nombreCritiques,
      nombreAvertissements: result.nombreAvertissements,
      nombreInfos: result.nombreInfos,
    };
  }

  // ===== KPIs COMMERCIAUX =====

  @GrpcMethod('KpisCommerciauxService', 'GetKpisCommerciaux')
  async getKpisCommerciaux(data: GetKpisCommerciauxRequest): Promise<KpisCommerciauxResponse> {
    const result = await this.kpisCommerciauxService.getKpisCommerciaux(mapFilters(data.filters!));
    return {
      nouveauxClientsMois: result.nouveauxClientsMois,
      nouveauxClientsVariation: {
        pourcentage: result.nouveauxClientsVariation.pourcentage,
        tendance: result.nouveauxClientsVariation.tendance,
      },
      tauxConversion: result.tauxConversion,
      tauxConversionVariation: {
        pourcentage: result.tauxConversionVariation.pourcentage,
        tendance: result.tauxConversionVariation.tendance,
      },
      panierMoyen: result.panierMoyen,
      panierMoyenVariation: {
        pourcentage: result.panierMoyenVariation.pourcentage,
        tendance: result.panierMoyenVariation.tendance,
      },
      caPrevisionnel3Mois: result.caPrevisionnel3Mois,
      classementParVentes: result.classementParVentes.map((c) => ({
        commercialId: c.commercialId,
        nomComplet: c.nomComplet,
        valeur: c.valeur,
        rang: c.rang,
      })),
      classementParCa: result.classementParCA.map((c) => ({
        commercialId: c.commercialId,
        nomComplet: c.nomComplet,
        valeur: c.valeur,
        rang: c.rang,
      })),
      classementParConversion: result.classementParConversion.map((c) => ({
        commercialId: c.commercialId,
        nomComplet: c.nomComplet,
        valeur: c.valeur,
        rang: c.rang,
      })),
    };
  }
}
