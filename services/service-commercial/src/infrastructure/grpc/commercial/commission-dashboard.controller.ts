import { Controller } from '@nestjs/common';
import { CommissionDashboardServiceControllerMethods } from '@proto/commission/dashboard';
import type {
  GetDashboardKpiRequest,
  GenererSnapshotKpiRequest,
  GetComparatifsRequest,
  ExportAnalytiqueRequest,
} from '@proto/commission';
import { ExportFormatAnalytique } from '@proto/commission';
import { SnapshotKpiService } from '../../../domain/commercial/services/snapshot-kpi.service';

function toMoneyString(value: number): string {
  return value.toFixed(2);
}

function toDashboardFilters(filters?: {
  organisation_id?: string;
  periode?: string;
  apporteur_id?: string;
  produit_id?: string;
  date_debut?: string;
  date_fin?: string;
}) {
  return {
    organisationId: filters?.organisation_id || '',
    periode: filters?.periode,
    apporteurId: filters?.apporteur_id,
    produitId: filters?.produit_id,
    dateDebut: filters?.date_debut,
    dateFin: filters?.date_fin,
  };
}

@Controller()
@CommissionDashboardServiceControllerMethods()
export class CommissionDashboardController {
  constructor(
    private readonly snapshotKpiService: SnapshotKpiService,
  ) {}

  // ============================================================================
  // DASHBOARD KPI
  // ============================================================================

  async getDashboardKpi(data: GetDashboardKpiRequest) {
    const filters = toDashboardFilters(data.filters);
    const result = await this.snapshotKpiService.getDashboardKpi(filters);
    return {
      kpi: {
        periode: result.periode,
        generated_at: result.generatedAt,
        source: result.source,
        total_brut: toMoneyString(result.totalBrut),
        total_net: toMoneyString(result.totalNet),
        total_reprises: toMoneyString(result.totalReprises),
        total_recurrence: toMoneyString(result.totalRecurrence),
        taux_reprise: toMoneyString(result.tauxReprise),
        volume: result.volume,
        delai_validation_moyen_jours: toMoneyString(result.delaiValidationMoyenJours),
        par_produit: result.parProduit.map((item) => ({
          produit_id: item.produitId,
          total_brut: toMoneyString(item.totalBrut),
          total_net: toMoneyString(item.totalNet),
          total_reprises: toMoneyString(item.totalReprises),
          volume: item.volume,
        })),
      },
    };
  }

  // ============================================================================
  // SNAPSHOT GENERATION
  // ============================================================================

  async genererSnapshotKpi(data: GenererSnapshotKpiRequest) {
    const filters = toDashboardFilters(data.filters);
    const payload = await this.snapshotKpiService.genererSnapshot(
      filters,
      'manual',
      data.generated_by || null,
    );
    return {
      success: true,
      kpi: {
        periode: filters.periode || new Date().toISOString().slice(0, 7),
        generated_at: new Date().toISOString(),
        source: 'manual',
        total_brut: toMoneyString(payload.totalBrut),
        total_net: toMoneyString(payload.totalNet),
        total_reprises: toMoneyString(payload.totalReprises),
        total_recurrence: toMoneyString(payload.totalRecurrence),
        taux_reprise: toMoneyString(payload.tauxReprise),
        volume: payload.volume,
        delai_validation_moyen_jours: toMoneyString(payload.delaiValidationMoyenJours),
        par_produit: payload.parProduit.map((item) => ({
          produit_id: item.produitId,
          total_brut: toMoneyString(item.totalBrut),
          total_net: toMoneyString(item.totalNet),
          total_reprises: toMoneyString(item.totalReprises),
          volume: item.volume,
        })),
      },
    };
  }

  // ============================================================================
  // COMPARATIFS
  // ============================================================================

  async getComparatifs(data: GetComparatifsRequest) {
    const filters = toDashboardFilters(data.filters);
    const comparatifs = await this.snapshotKpiService.getComparatifs(filters);

    const toProto = (input: typeof comparatifs.courant) => ({
      periode: input.periode,
      total_brut: toMoneyString(input.totalBrut),
      total_net: toMoneyString(input.totalNet),
      total_reprises: toMoneyString(input.totalReprises),
      total_recurrence: toMoneyString(input.totalRecurrence),
      taux_reprise: toMoneyString(input.tauxReprise),
      volume: input.volume,
      delai_validation_moyen_jours: toMoneyString(input.delaiValidationMoyenJours),
      variation_brut_pct: toMoneyString(input.variationBrutPct),
    });

    return {
      courant: toProto(comparatifs.courant),
      m1: toProto(comparatifs.m1),
      m3: toProto(comparatifs.m3),
      m12: toProto(comparatifs.m12),
    };
  }

  // ============================================================================
  // EXPORT ANALYTIQUE
  // ============================================================================

  async exportAnalytique(data: ExportAnalytiqueRequest) {
    const filters = toDashboardFilters(data.filters);
    const format = data.format === ExportFormatAnalytique.EXPORT_FORMAT_ANALYTIQUE_EXCEL
      ? 'excel'
      : 'csv';

    const result = await this.snapshotKpiService.exportAnalytique({
      ...filters,
      format,
      includeComparatifs: data.include_comparatifs || false,
    });

    return {
      file_name: result.fileName,
      mime_type: result.mimeType,
      content: result.content,
    };
  }
}
