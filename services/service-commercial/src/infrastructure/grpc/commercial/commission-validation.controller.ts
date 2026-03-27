import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CommissionValidationServiceControllerMethods } from '@proto/commission/validation';
import type {
  GetReportsNegatifsRequest,
  PreselectionRequest,
  RecalculerTotauxRequest,
  ValiderBordereauFinalRequest,
  GetLignesForValidationRequest,
} from '@proto/commission';
import { ReportNegatifService } from '../../persistence/typeorm/repositories/commercial/report-negatif.service';
import { BordereauService } from '../../persistence/typeorm/repositories/commercial/bordereau.service';
import { LigneBordereauService } from '../../persistence/typeorm/repositories/commercial/ligne-bordereau.service';
import { CommissionAuditLogService } from '../../persistence/typeorm/repositories/commercial/commission-audit-log.service';
import { SnapshotKpiService } from '../../../domain/commercial/services/snapshot-kpi.service';
import { StatutLigne, TypeLigne } from '../../../domain/commercial/entities/ligne-bordereau.entity';
import { StatutBordereau } from '../../../domain/commercial/entities/bordereau-commission.entity';

/** Convert proto limit/offset to pagination object expected by services */
function toPagination(data: { limit?: number; offset?: number }) {
  return {
    page: data.offset && data.limit ? Math.floor(data.offset / data.limit) + 1 : 1,
    limit: data.limit || 20,
  };
}

function toMoneyString(value: number): string {
  return value.toFixed(2);
}

@Controller()
@CommissionValidationServiceControllerMethods()
export class CommissionValidationController {
  constructor(
    private readonly reportNegatifService: ReportNegatifService,
    private readonly bordereauService: BordereauService,
    private readonly ligneBordereauService: LigneBordereauService,
    private readonly auditLogService: CommissionAuditLogService,
    private readonly snapshotKpiService: SnapshotKpiService,
  ) {}

  // ============================================================================
  // REPORTS NEGATIFS
  // ============================================================================

  async getReportsNegatifs(data: GetReportsNegatifsRequest) {
    const result = await this.reportNegatifService.findAll(
      {
        organisationId: data.organisation_id,
        apporteurId: data.apporteur_id,
        statutReport: data.statut as any,
      },
      toPagination(data),
    );
    return {
      reports: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  // ============================================================================
  // PRESELECTION & VALIDATION
  // ============================================================================

  async preselectionnerLignes(data: PreselectionRequest) {
    const bordereau = await this.bordereauService.findById(data.bordereau_id);
    if (bordereau.organisationId !== data.organisation_id) {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: 'Bordereau non accessible pour cette organisation',
      });
    }

    const lignes = await this.ligneBordereauService.findByBordereau(data.bordereau_id);
    const ligneIdsSelectionnees: string[] = [];

    for (const ligne of lignes) {
      const estEligible = ligne.statutLigne !== StatutLigne.REJETEE;
      if (!estEligible) {
        continue;
      }

      const updated = await this.ligneBordereauService.update(ligne.id, {
        selectionne: true,
        statutLigne: StatutLigne.SELECTIONNEE,
        motifDeselection: null,
      });
      ligneIdsSelectionnees.push(updated.id);
    }

    return {
      nombre_lignes_selectionnees: ligneIdsSelectionnees.length,
      nombre_lignes_total: lignes.length,
      ligne_ids_selectionnees: ligneIdsSelectionnees,
    };
  }

  async recalculerTotauxBordereau(data: RecalculerTotauxRequest) {
    const lignes = await this.ligneBordereauService.findByBordereau(data.bordereau_id);
    const selectedSet = new Set(data.ligne_ids_selectionnees || []);
    const selectedLignes = lignes.filter((ligne) => selectedSet.has(ligne.id));

    let totalBrut = 0;
    let totalReprises = 0;
    let totalAcomptes = 0;
    let totalNet = 0;

    for (const ligne of selectedLignes) {
      const brut = Number(ligne.montantBrut) || 0;
      const reprise = Number(ligne.montantReprise) || 0;
      const net = Number(ligne.montantNet) || 0;

      totalBrut += brut;
      totalReprises += reprise;
      totalNet += net;

      if (ligne.typeLigne === TypeLigne.ACOMPTE) {
        totalAcomptes += Math.abs(net);
      }
    }

    return {
      total_brut: toMoneyString(totalBrut),
      total_reprises: toMoneyString(totalReprises),
      total_acomptes: toMoneyString(totalAcomptes),
      total_net: toMoneyString(totalNet),
      nombre_lignes_selectionnees: selectedLignes.length,
    };
  }

  async validerBordereauFinal(data: ValiderBordereauFinalRequest) {
    const bordereau = await this.bordereauService.findById(data.bordereau_id);
    if (bordereau.statutBordereau !== StatutBordereau.BROUILLON) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Seuls les bordereaux en brouillon peuvent etre valides',
      });
    }

    const lignes = await this.ligneBordereauService.findByBordereau(data.bordereau_id);
    const selectedSet = new Set(data.ligne_ids_validees || []);
    const dateValidation = new Date();
    let validatedCount = 0;

    let totalBrut = 0;
    let totalReprises = 0;
    let totalAcomptes = 0;
    let totalNet = 0;

    for (const ligne of lignes) {
      if (selectedSet.has(ligne.id)) {
        validatedCount += 1;
        const brut = Number(ligne.montantBrut) || 0;
        const reprise = Number(ligne.montantReprise) || 0;
        const net = Number(ligne.montantNet) || 0;
        totalBrut += brut;
        totalReprises += reprise;
        totalNet += net;
        if (ligne.typeLigne === TypeLigne.ACOMPTE) {
          totalAcomptes += Math.abs(net);
        }

        await this.ligneBordereauService.update(ligne.id, {
          selectionne: true,
          statutLigne: StatutLigne.VALIDEE,
          validateurId: data.validateur_id,
          dateValidation,
          motifDeselection: null,
        });
      } else {
        await this.ligneBordereauService.update(ligne.id, {
          selectionne: false,
          statutLigne: StatutLigne.DESELECTIONNEE,
        });
      }
    }

    const updatedBordereau = await this.bordereauService.update(data.bordereau_id, {
      statutBordereau: StatutBordereau.VALIDE,
      validateurId: data.validateur_id,
      dateValidation,
      nombreLignes: validatedCount,
      totalBrut,
      totalReprises,
      totalAcomptes,
      totalNetAPayer: totalNet,
    });

    await this.auditLogService.create({
      organisationId: updatedBordereau.organisationId,
      scope: 'bordereau' as any,
      action: 'bordereau_validated' as any,
      refId: updatedBordereau.id,
      userId: data.validateur_id,
      beforeData: {
        statut: bordereau.statutBordereau,
      },
      afterData: {
        statut: updatedBordereau.statutBordereau,
        dateValidation: dateValidation.toISOString(),
        nombreLignes: validatedCount,
      },
      metadata: {
        ligneIdsValidees: Array.from(selectedSet),
      },
    });

    await this.snapshotKpiService.genererSnapshot(
      {
        organisationId: updatedBordereau.organisationId,
        periode: updatedBordereau.periode,
        apporteurId: updatedBordereau.apporteurId,
      },
      'auto',
      data.validateur_id,
    );

    return {
      success: true,
      bordereau: updatedBordereau,
      date_validation: dateValidation.toISOString(),
    };
  }

  // ============================================================================
  // LIGNES FOR VALIDATION
  // ============================================================================

  async getLignesForValidation(data: GetLignesForValidationRequest) {
    const lignes = await this.ligneBordereauService.findByBordereau(data.bordereau_id);
    const filtered = lignes.filter((ligne) => ligne.organisationId === data.organisation_id);

    const total = filtered.length;
    const offset = data.offset || 0;
    const limit = data.limit || total;
    const paginated = filtered.slice(offset, offset + limit);

    const selected = filtered.filter((ligne) => ligne.selectionne);
    let totalBrut = 0;
    let totalReprises = 0;
    let totalAcomptes = 0;
    let totalNet = 0;

    for (const ligne of selected) {
      const brut = Number(ligne.montantBrut) || 0;
      const reprise = Number(ligne.montantReprise) || 0;
      const net = Number(ligne.montantNet) || 0;
      totalBrut += brut;
      totalReprises += reprise;
      totalNet += net;

      if (ligne.typeLigne === TypeLigne.ACOMPTE) {
        totalAcomptes += Math.abs(net);
      }
    }

    return {
      lignes: paginated,
      total,
      totaux: {
        total_brut: toMoneyString(totalBrut),
        total_reprises: toMoneyString(totalReprises),
        total_acomptes: toMoneyString(totalAcomptes),
        total_net: toMoneyString(totalNet),
        nombre_lignes_selectionnees: selected.length,
      },
    };
  }
}
