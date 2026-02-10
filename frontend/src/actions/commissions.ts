"use server";

import { commissions, bordereaux, reprises, baremes, paliers } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  CommissionResponse,
  CommissionListResponse,
  BordereauResponse,
  BordereauListResponse,
  RepriseResponse,
  RepriseListResponse,
  ExportBordereauResponse,
  GenererBordereauResponse,
  CalculerCommissionResponse,
  ContestationResponse,
  GetContestationsResponse,
} from "@/lib/grpc";
import type {
  AuditLogListResponse,
  RecurrenceListResponse,
  ReportNegatifListResponse,
  PreselectionResponse,
  TotauxResponse,
  ValiderBordereauFinalResponse,
  GetLignesForValidationResponse,
} from "@proto/commission/commission";
import {
  StatutBordereau,
  StatutReprise,
  TypeReprise,
  typeRepriseFromJSON,
  statutBordereauFromJSON,
  statutRepriseFromJSON,
  statutContestationFromJSON,
} from "@proto/commission/commission";
import type { ActionResult } from "@/lib/types/common";

// ============================================
// COMMISSIONS
// ============================================

/**
 * Récupérer les commissions par organisation
 */
export async function getCommissionsByOrganisation(params: {
  organisationId: string;
  apporteurId?: string;
  periode?: string;
  statutId?: string;
}): Promise<ActionResult<CommissionListResponse>> {
  try {
    const data = await commissions.list({
      organisationId: params.organisationId,
      apporteurId: params.apporteurId,
      periode: params.periode,
      statutId: params.statutId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getCommissionsByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des commissions",
    };
  }
}

/**
 * Récupérer une commission par ID
 */
export async function getCommission(id: string): Promise<ActionResult<CommissionResponse>> {
  try {
    const data = await commissions.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getCommission] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la commission",
    };
  }
}

/**
 * Récupérer les statuts des commissions
 */
export async function getStatutsCommission(): Promise<
  ActionResult<{ statuts: Array<{ id: string; code: string; nom: string }> }>
> {
  try {
    const data = await commissions.getStatuts({});
    return { data, error: null };
  } catch (err) {
    console.error("[getStatutsCommission] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des statuts",
    };
  }
}

/**
 * Désélectionner une commission (changer le statut)
 */
export async function deselectionnerCommission(
  commissionId: string,
  statutId: string
): Promise<ActionResult<CommissionResponse>> {
  try {
    const data = await commissions.update({
      id: commissionId,
      statutId: statutId,
    });
    revalidatePath("/commissions");
    return { data, error: null };
  } catch (err) {
    console.error("[deselectionnerCommission] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la désélection",
    };
  }
}

// ============================================
// BORDEREAUX
// ============================================

/**
 * Récupérer les bordereaux par organisation
 */
export async function getBordereauxByOrganisation(params: {
  organisationId: string;
  apporteurId?: string;
  periode?: string;
  statut?: string;
}): Promise<ActionResult<BordereauListResponse>> {
  try {
    const data = await bordereaux.list({
      organisationId: params.organisationId,
      apporteurId: params.apporteurId,
      periode: params.periode,
      statut: params.statut ? statutBordereauFromJSON(params.statut) : undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getBordereauxByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des bordereaux",
    };
  }
}

/**
 * Générer un bordereau à partir des commissions d'un apporteur pour une période
 */
export async function genererBordereau(params: {
  organisationId: string;
  apporteurId: string;
  periode: string;
  creePar?: string;
}): Promise<ActionResult<GenererBordereauResponse>> {
  try {
    const data = await commissions.genererBordereau({
      organisationId: params.organisationId,
      apporteurId: params.apporteurId,
      periode: params.periode,
      creePar: params.creePar,
    });
    revalidatePath("/commissions");
    return { data, error: null };
  } catch (err) {
    console.error("[genererBordereau] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la génération du bordereau",
    };
  }
}

/**
 * Valider un bordereau
 */
export async function validerBordereau(
  bordereauId: string,
  validateurId: string
): Promise<ActionResult<BordereauResponse>> {
  try {
    const data = await bordereaux.validate({ id: bordereauId, validateurId });
    revalidatePath("/commissions");
    return { data, error: null };
  } catch (err) {
    console.error("[validerBordereau] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la validation du bordereau",
    };
  }
}

export async function preselectionnerLignes(
  bordereauId: string,
  organisationId: string
): Promise<ActionResult<PreselectionResponse>> {
  try {
    const data = await commissions.preselectionnerLignes({
      bordereauId,
      organisationId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[preselectionnerLignes] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la présélection des lignes",
    };
  }
}

export async function recalculerTotaux(
  bordereauId: string,
  ligneIds: string[]
): Promise<ActionResult<TotauxResponse>> {
  try {
    const data = await commissions.recalculerTotauxBordereau({
      bordereauId,
      ligneIdsSelectionnees: ligneIds,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[recalculerTotaux] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du recalcul des totaux",
    };
  }
}

export async function validerBordereauFinal(
  bordereauId: string,
  validateurId: string,
  ligneIds: string[]
): Promise<ActionResult<ValiderBordereauFinalResponse>> {
  try {
    const data = await commissions.validerBordereauFinal({
      bordereauId,
      validateurId,
      ligneIdsValidees: ligneIds,
    });
    revalidatePath("/commissions");
    revalidatePath("/commissions/validation");
    return { data, error: null };
  } catch (err) {
    console.error("[validerBordereauFinal] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la validation finale du bordereau",
    };
  }
}

export async function getLignesForValidation(
  bordereauId: string,
  organisationId: string
): Promise<ActionResult<GetLignesForValidationResponse>> {
  try {
    const data = await commissions.getLignesForValidation({
      bordereauId,
      organisationId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getLignesForValidation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des lignes à valider",
    };
  }
}

/**
 * Exporter un bordereau (PDF ou Excel)
 */
export async function exportBordereau(bordereauId: string): Promise<ActionResult<ExportBordereauResponse>> {
  try {
    const data = await bordereaux.export({ id: bordereauId });
    return { data, error: null };
  } catch (err) {
    console.error("[exportBordereau] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'export du bordereau",
    };
  }
}

// ============================================
// REPRISES
// ============================================

/**
 * Récupérer les reprises par organisation
 */
export async function getReprisesByOrganisation(params: {
  organisationId: string;
  apporteurId?: string;
  statut?: string;
}): Promise<ActionResult<RepriseListResponse>> {
  try {
    const data = await reprises.list({
      organisationId: params.organisationId,
      apporteurId: params.apporteurId,
      statut: params.statut ? statutRepriseFromJSON(params.statut) : undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getReprisesByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des reprises",
    };
  }
}

/**
 * Annuler une reprise
 */
export async function annulerReprise(repriseId: string): Promise<ActionResult<RepriseResponse>> {
  try {
    const data = await reprises.cancel({ id: repriseId });
    revalidatePath("/commissions");
    return { data, error: null };
  } catch (err) {
    console.error("[annulerReprise] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'annulation de la reprise",
    };
  }
}

/**
 * Déclencher une reprise
 */
export async function declencherReprise(params: {
  commissionId: string;
  typeReprise: string;
  dateEvenement: string;
  motif?: string;
}): Promise<ActionResult<RepriseResponse>> {
  try {
    const data = await commissions.declencherReprise({
      commissionId: params.commissionId,
      typeReprise: typeRepriseFromJSON(params.typeReprise),
      dateEvenement: params.dateEvenement,
      motif: params.motif,
    });
    revalidatePath("/commissions");
    return { data, error: null };
  } catch (err) {
    console.error("[declencherReprise] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du déclenchement de la reprise",
    };
  }
}

// ============================================
// CONTESTATIONS
// ============================================

export async function getContestationsByOrganisation(params: {
  organisationId: string;
  commissionId?: string;
  bordereauId?: string;
  apporteurId?: string;
  statut?: string;
}): Promise<ActionResult<GetContestationsResponse>> {
  try {
    const data = await commissions.getContestations({
      organisationId: params.organisationId,
      commissionId: params.commissionId,
      bordereauId: params.bordereauId,
      apporteurId: params.apporteurId,
      statut: params.statut ? statutContestationFromJSON(params.statut) : undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getContestationsByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des contestations",
    };
  }
}

export async function creerContestation(params: {
  organisationId: string;
  commissionId: string;
  bordereauId: string;
  apporteurId: string;
  motif: string;
}): Promise<ActionResult<ContestationResponse>> {
  try {
    const data = await commissions.creerContestation({
      organisationId: params.organisationId,
      commissionId: params.commissionId,
      bordereauId: params.bordereauId,
      apporteurId: params.apporteurId,
      motif: params.motif,
    });
    revalidatePath("/commissions");
    return { data, error: null };
  } catch (err) {
    console.error("[creerContestation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la creation de la contestation",
    };
  }
}

export async function resoudreContestation(params: {
  id: string;
  acceptee: boolean;
  commentaire: string;
  resoluPar: string;
}): Promise<ActionResult<ContestationResponse>> {
  try {
    const data = await commissions.resoudreContestation({
      id: params.id,
      acceptee: params.acceptee,
      commentaire: params.commentaire,
      resoluPar: params.resoluPar,
    });
    revalidatePath("/commissions");
    return { data, error: null };
  } catch (err) {
    console.error("[resoudreContestation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la resolution de la contestation",
    };
  }
}

// ============================================
// AUDIT LOGS
// ============================================

export async function getAuditLogs(params: {
  organisationId: string;
  scope?: number;
  action?: number;
  refId?: string;
  userId?: string;
  apporteurId?: string;
  contratId?: string;
  baremeId?: string;
  periode?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<AuditLogListResponse>> {
  try {
    const data = await commissions.getAuditLogs({
      organisationId: params.organisationId,
      scope: params.scope,
      action: params.action,
      refId: params.refId,
      userId: params.userId,
      apporteurId: params.apporteurId,
      contratId: params.contratId,
      baremeId: params.baremeId,
      periode: params.periode,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      limit: params.limit,
      offset: params.offset,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getAuditLogs] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des audits",
    };
  }
}

export async function getAuditLogsByCommission(params: {
  commissionId: string;
}): Promise<ActionResult<AuditLogListResponse>> {
  try {
    const data = await commissions.getAuditLogsByCommission({
      commissionId: params.commissionId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getAuditLogsByCommission] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des audits",
    };
  }
}

// ============================================
// RECURRENCES
// ============================================

export async function getRecurrencesByOrganisation(params: {
  organisationId: string;
  apporteurId?: string;
  periode?: string;
  statut?: number;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<RecurrenceListResponse>> {
  try {
    const data = await commissions.getRecurrences({
      organisationId: params.organisationId,
      apporteurId: params.apporteurId,
      periode: params.periode,
      statut: params.statut,
      limit: params.limit,
      offset: params.offset,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getRecurrencesByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des récurrences",
    };
  }
}

export async function getRecurrencesByContrat(params: {
  organisationId: string;
  contratId: string;
}): Promise<ActionResult<RecurrenceListResponse>> {
  try {
    const data = await commissions.getRecurrencesByContrat({
      organisationId: params.organisationId,
      contratId: params.contratId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getRecurrencesByContrat] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des récurrences",
    };
  }
}

// ============================================
// REPORTS NEGATIFS
// ============================================

export async function getReportsNegatifsByOrganisation(params: {
  organisationId: string;
  apporteurId?: string;
  statut?: number;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<ReportNegatifListResponse>> {
  try {
    const data = await commissions.getReportsNegatifs({
      organisationId: params.organisationId,
      apporteurId: params.apporteurId,
      statut: params.statut,
      limit: params.limit,
      offset: params.offset,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getReportsNegatifsByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des reports négatifs",
    };
  }
}

// ============================================
// CALCUL / SIMULATION
// ============================================

/**
 * Simuler le calcul d'une commission
 */
export async function calculerCommission(params: {
  organisationId: string;
  apporteurId: string;
  contratId: string;
  typeProduit: string;
  profilRemuneration: string;
  montantBase: number;
  periode: string;
  produitId?: string;
  societeId?: string;
  canalVente?: string;
}): Promise<ActionResult<CalculerCommissionResponse>> {
  try {
    const data = await commissions.calculer({
      organisationId: params.organisationId,
      apporteurId: params.apporteurId,
      contratId: params.contratId,
      typeProduit: params.typeProduit,
      profilRemuneration: params.profilRemuneration,
      montantBase: String(params.montantBase),
      periode: params.periode,
      produitId: params.produitId,
      societeId: params.societeId,
      canalVente: params.canalVente,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[calculerCommission] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du calcul de la commission",
    };
  }
}

// ============================================
// BARÈMES
// ============================================

/**
 * Récupérer les barèmes par organisation
 */
export async function getBaremesByOrganisation(params: {
  organisationId: string;
  typeProduit?: string;
  actifOnly?: boolean;
}): Promise<ActionResult<{ baremes: unknown[] }>> {
  try {
    const data = await baremes.list({
      organisationId: params.organisationId,
      typeProduit: params.typeProduit,
      actifOnly: params.actifOnly,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getBaremesByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des barèmes",
    };
  }
}

/**
 * Créer un barème via gRPC
 */
export async function createBareme(params: {
  organisationId: string;
  code: string;
  nom: string;
  description?: string;
  typeCalcul: string;
  baseCalcul: string;
  montantFixe?: string;
  tauxPourcentage?: string;
  recurrenceActive: boolean;
  tauxRecurrence?: string;
  dureeRecurrenceMois?: number;
  dureeReprisesMois: number;
  tauxReprise: string;
  typeProduit?: string;
  profilRemuneration?: string;
  societeId?: string;
  canalVente?: string;
  repartitionCommercial: string;
  repartitionManager: string;
  repartitionAgence: string;
  repartitionEntreprise: string;
  dateEffet: string;
  dateFin?: string;
}): Promise<ActionResult<unknown>> {
  try {
    const { typeCalculFromJSON, baseCalculFromJSON } = await import("@proto/commission/commission");

    const data = await baremes.create({
      organisationId: params.organisationId,
      code: params.code,
      nom: params.nom,
      description: params.description,
      typeCalcul: typeCalculFromJSON(params.typeCalcul),
      baseCalcul: baseCalculFromJSON(params.baseCalcul),
      montantFixe: params.montantFixe,
      tauxPourcentage: params.tauxPourcentage,
      recurrenceActive: params.recurrenceActive,
      tauxRecurrence: params.tauxRecurrence,
      dureeRecurrenceMois: params.dureeRecurrenceMois,
      dureeReprisesMois: params.dureeReprisesMois,
      tauxReprise: params.tauxReprise,
      typeProduit: params.typeProduit,
      profilRemuneration: params.profilRemuneration,
      societeId: params.societeId,
      canalVente: params.canalVente,
      repartitionCommercial: params.repartitionCommercial,
      repartitionManager: params.repartitionManager,
      repartitionAgence: params.repartitionAgence,
      repartitionEntreprise: params.repartitionEntreprise,
      dateEffet: params.dateEffet,
      dateFin: params.dateFin,
    });
    revalidatePath("/commissions");
    return { data, error: null };
  } catch (err) {
    console.error("[createBareme] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du barème",
    };
  }
}

/**
 * Mettre à jour un barème via gRPC
 */
export async function updateBareme(params: {
  id: string;
  nom?: string;
  description?: string;
  typeCalcul?: string;
  baseCalcul?: string;
  montantFixe?: string;
  tauxPourcentage?: string;
  recurrenceActive?: boolean;
  tauxRecurrence?: string;
  dureeRecurrenceMois?: number;
  dureeReprisesMois?: number;
  tauxReprise?: string;
  dateFin?: string;
  actif?: boolean;
}): Promise<ActionResult<unknown>> {
  try {
    const { typeCalculFromJSON, baseCalculFromJSON } = await import("@proto/commission/commission");

    const data = await baremes.update({
      id: params.id,
      nom: params.nom,
      description: params.description,
      typeCalcul: params.typeCalcul ? typeCalculFromJSON(params.typeCalcul) : undefined,
      baseCalcul: params.baseCalcul ? baseCalculFromJSON(params.baseCalcul) : undefined,
      montantFixe: params.montantFixe,
      tauxPourcentage: params.tauxPourcentage,
      recurrenceActive: params.recurrenceActive,
      tauxRecurrence: params.tauxRecurrence,
      dureeRecurrenceMois: params.dureeRecurrenceMois,
      dureeReprisesMois: params.dureeReprisesMois,
      tauxReprise: params.tauxReprise,
      dateFin: params.dateFin,
      actif: params.actif,
    });
    revalidatePath("/commissions");
    return { data, error: null };
  } catch (err) {
    console.error("[updateBareme] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du barème",
    };
  }
}

/**
 * Supprimer un barème via gRPC
 */
export async function deleteBareme(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await baremes.delete({ id });
    revalidatePath("/commissions");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteBareme] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du barème",
    };
  }
}

/**
 * Activer/désactiver un barème via gRPC
 */
export async function toggleBaremeActif(id: string, actif: boolean): Promise<ActionResult<unknown>> {
  try {
    const data = await baremes.update({
      id,
      actif,
    });
    revalidatePath("/commissions");
    return { data, error: null };
  } catch (err) {
    console.error("[toggleBaremeActif] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la modification du barème",
    };
  }
}

// ============================================
// PALIERS
// ============================================

/**
 * Récupérer les paliers d'un barème via gRPC
 */
export async function getPaliersByBareme(
  baremeId: string
): Promise<ActionResult<{ paliers: unknown[] }>> {
  try {
    const data = await paliers.listByBareme({ baremeId });
    return { data, error: null };
  } catch (err) {
    console.error("[getPaliersByBareme] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des paliers",
    };
  }
}

/**
 * Créer un palier via gRPC
 */
export async function createPalier(params: {
  organisationId: string;
  baremeId: string;
  code: string;
  nom: string;
  description?: string;
  typePalier: string;
  seuilMin: string;
  seuilMax?: string;
  montantPrime: string;
  tauxBonus?: string;
  cumulable: boolean;
  parPeriode: boolean;
  typeProduit?: string;
  ordre: number;
}): Promise<ActionResult<unknown>> {
  try {
    const { typePalierFromJSON } = await import("@proto/commission/commission");

    const data = await paliers.create({
      organisationId: params.organisationId,
      baremeId: params.baremeId,
      code: params.code,
      nom: params.nom,
      description: params.description,
      typePalier: typePalierFromJSON(params.typePalier),
      seuilMin: params.seuilMin,
      seuilMax: params.seuilMax,
      montantPrime: params.montantPrime,
      tauxBonus: params.tauxBonus,
      cumulable: params.cumulable,
      parPeriode: params.parPeriode,
      typeProduit: params.typeProduit,
      ordre: params.ordre,
    });
    revalidatePath("/commissions");
    return { data, error: null };
  } catch (err) {
    console.error("[createPalier] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du palier",
    };
  }
}

/**
 * Mettre à jour un palier via gRPC
 */
export async function updatePalier(params: {
  id: string;
  nom?: string;
  description?: string;
  seuilMin?: string;
  seuilMax?: string;
  montantPrime?: string;
  tauxBonus?: string;
  cumulable?: boolean;
  parPeriode?: boolean;
  ordre?: number;
  actif?: boolean;
}): Promise<ActionResult<unknown>> {
  try {
    const data = await paliers.update({
      id: params.id,
      nom: params.nom,
      description: params.description,
      seuilMin: params.seuilMin,
      seuilMax: params.seuilMax,
      montantPrime: params.montantPrime,
      tauxBonus: params.tauxBonus,
      cumulable: params.cumulable,
      parPeriode: params.parPeriode,
      ordre: params.ordre,
      actif: params.actif,
    });
    revalidatePath("/commissions");
    return { data, error: null };
  } catch (err) {
    console.error("[updatePalier] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du palier",
    };
  }
}

/**
 * Supprimer un palier via gRPC
 */
export async function deletePalier(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await paliers.delete({ id });
    revalidatePath("/commissions");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deletePalier] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du palier",
    };
  }
}
