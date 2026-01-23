"use server";

import { reglesRelance, historiqueRelance, relanceEngine } from "@/lib/grpc";
import type {
  RegleRelance,
  HistoriqueRelance,
  ListReglesRelanceResponse,
  ListHistoriquesRelanceResponse,
  ExecuteRelancesResponse,
} from "@proto/relance/relance";
import { RelanceDeclencheur, RelanceActionType, Priorite } from "@proto/relance/relance";
import type {
  RegleRelanceDto,
  CreateRegleRelanceDto,
  UpdateRegleRelanceDto,
  HistoriqueRelanceDto,
  RelanceDeclencheur as RelanceDeclencheurType,
  RelanceActionType as RelanceActionTypeType,
} from "@/types/regle-relance";

export interface RelanceActionResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Map gRPC Priorite to string
 */
function mapPrioriteToString(priorite: Priorite): "HAUTE" | "MOYENNE" | "BASSE" {
  switch (priorite) {
    case Priorite.HAUTE:
      return "HAUTE";
    case Priorite.MOYENNE:
      return "MOYENNE";
    case Priorite.BASSE:
      return "BASSE";
    default:
      return "MOYENNE";
  }
}

/**
 * Map string to gRPC Priorite
 */
function mapStringToPriorite(str: string): Priorite {
  switch (str) {
    case "HAUTE":
      return Priorite.HAUTE;
    case "MOYENNE":
      return Priorite.MOYENNE;
    case "BASSE":
      return Priorite.BASSE;
    default:
      return Priorite.MOYENNE;
  }
}

/**
 * Map gRPC RelanceDeclencheur to string
 */
function mapDeclencheurToString(declencheur: RelanceDeclencheur): RelanceDeclencheurType {
  switch (declencheur) {
    case RelanceDeclencheur.IMPAYE:
      return "IMPAYE";
    case RelanceDeclencheur.CONTRAT_BIENTOT_EXPIRE:
      return "CONTRAT_BIENTOT_EXPIRE";
    case RelanceDeclencheur.CONTRAT_EXPIRE:
      return "CONTRAT_EXPIRE";
    case RelanceDeclencheur.NOUVEAU_CLIENT:
      return "NOUVEAU_CLIENT";
    case RelanceDeclencheur.INACTIVITE_CLIENT:
      return "INACTIVITE_CLIENT";
    default:
      return "IMPAYE";
  }
}

/**
 * Map string to gRPC RelanceDeclencheur
 */
function mapStringToDeclencheur(str: string): RelanceDeclencheur {
  switch (str) {
    case "IMPAYE":
      return RelanceDeclencheur.IMPAYE;
    case "CONTRAT_BIENTOT_EXPIRE":
      return RelanceDeclencheur.CONTRAT_BIENTOT_EXPIRE;
    case "CONTRAT_EXPIRE":
      return RelanceDeclencheur.CONTRAT_EXPIRE;
    case "NOUVEAU_CLIENT":
      return RelanceDeclencheur.NOUVEAU_CLIENT;
    case "INACTIVITE_CLIENT":
      return RelanceDeclencheur.INACTIVITE_CLIENT;
    default:
      return RelanceDeclencheur.IMPAYE;
  }
}

/**
 * Map gRPC RelanceActionType to string
 */
function mapActionTypeToString(actionType: RelanceActionType): RelanceActionTypeType {
  switch (actionType) {
    case RelanceActionType.CREER_TACHE:
      return "CREER_TACHE";
    case RelanceActionType.ENVOYER_EMAIL:
      return "ENVOYER_EMAIL";
    case RelanceActionType.NOTIFICATION:
      return "NOTIFICATION";
    case RelanceActionType.TACHE_ET_EMAIL:
      return "TACHE_ET_EMAIL";
    default:
      return "CREER_TACHE";
  }
}

/**
 * Map string to gRPC RelanceActionType
 */
function mapStringToActionType(str: string): RelanceActionType {
  switch (str) {
    case "CREER_TACHE":
      return RelanceActionType.CREER_TACHE;
    case "ENVOYER_EMAIL":
      return RelanceActionType.ENVOYER_EMAIL;
    case "NOTIFICATION":
      return RelanceActionType.NOTIFICATION;
    case "TACHE_ET_EMAIL":
      return RelanceActionType.TACHE_ET_EMAIL;
    default:
      return RelanceActionType.CREER_TACHE;
  }
}

/**
 * Map gRPC RegleRelance to frontend RegleRelanceDto
 */
function mapRegleToDto(regle: RegleRelance): RegleRelanceDto {
  return {
    id: regle.id,
    organisationId: regle.organisationId,
    nom: regle.nom,
    description: regle.description || undefined,
    declencheur: mapDeclencheurToString(regle.declencheur),
    delaiJours: regle.delaiJours,
    actionType: mapActionTypeToString(regle.actionType),
    prioriteTache: mapPrioriteToString(regle.prioriteTache),
    templateEmailId: regle.templateEmailId || undefined,
    templateTitreTache: regle.templateTitreTache || undefined,
    templateDescriptionTache: regle.templateDescriptionTache || undefined,
    assigneParDefaut: regle.assigneParDefaut || undefined,
    actif: regle.actif,
    ordre: regle.ordre,
    metadata: regle.metadata ? JSON.parse(regle.metadata) : undefined,
    createdAt: regle.createdAt,
    updatedAt: regle.updatedAt,
  };
}

/**
 * Map gRPC HistoriqueRelance to frontend HistoriqueRelanceDto
 */
function mapHistoriqueToDto(historique: HistoriqueRelance): HistoriqueRelanceDto {
  const resultatMap: Record<string, "SUCCES" | "ECHEC" | "IGNORE"> = {
    SUCCES: "SUCCES",
    ECHEC: "ECHEC",
    IGNORE: "IGNORE",
  };

  return {
    id: historique.id,
    organisationId: historique.organisationId,
    regleRelanceId: historique.regleRelanceId,
    clientId: historique.clientId || undefined,
    contratId: historique.contratId || undefined,
    factureId: historique.factureId || undefined,
    tacheCreeeId: historique.tacheCreeeId || undefined,
    dateExecution: historique.dateExecution,
    resultat: resultatMap[String(historique.resultat)] || "IGNORE",
    messageErreur: historique.messageErreur || undefined,
    metadata: historique.metadata ? JSON.parse(historique.metadata) : undefined,
    createdAt: historique.createdAt,
    updatedAt: historique.updatedAt,
  };
}

/**
 * List règles de relance
 */
export async function listReglesRelance(
  organisationId: string
): Promise<RelanceActionResult<RegleRelanceDto[]>> {
  try {
    const data = await reglesRelance.list({ organisationId });
    return {
      data: data.regles.map(mapRegleToDto),
      error: null,
    };
  } catch (err) {
    console.error("[listReglesRelance] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des règles",
    };
  }
}

/**
 * Get règle de relance by ID
 */
export async function getRegleRelance(
  id: string
): Promise<RelanceActionResult<RegleRelanceDto>> {
  try {
    const data = await reglesRelance.get({ id });
    return { data: mapRegleToDto(data), error: null };
  } catch (err) {
    console.error("[getRegleRelance] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la règle",
    };
  }
}

/**
 * Create règle de relance
 */
export async function createRegleRelance(
  dto: CreateRegleRelanceDto
): Promise<RelanceActionResult<RegleRelanceDto>> {
  try {
    const data = await reglesRelance.create({
      organisationId: dto.organisationId,
      nom: dto.nom,
      description: dto.description || "",
      declencheur: mapStringToDeclencheur(dto.declencheur),
      delaiJours: dto.delaiJours,
      actionType: mapStringToActionType(dto.actionType),
      prioriteTache: mapStringToPriorite(dto.prioriteTache || "MOYENNE"),
      templateEmailId: dto.templateEmailId || "",
      templateTitreTache: dto.templateTitreTache || "",
      templateDescriptionTache: dto.templateDescriptionTache || "",
      assigneParDefaut: dto.assigneParDefaut || "",
      ordre: dto.ordre || 0,
    });
    return { data: mapRegleToDto(data), error: null };
  } catch (err) {
    console.error("[createRegleRelance] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de la règle",
    };
  }
}

/**
 * Update règle de relance
 */
export async function updateRegleRelance(
  id: string,
  dto: UpdateRegleRelanceDto
): Promise<RelanceActionResult<RegleRelanceDto>> {
  try {
    const data = await reglesRelance.update({
      id,
      nom: dto.nom,
      description: dto.description,
      declencheur: dto.declencheur ? mapStringToDeclencheur(dto.declencheur) : undefined,
      delaiJours: dto.delaiJours,
      actionType: dto.actionType ? mapStringToActionType(dto.actionType) : undefined,
      prioriteTache: dto.prioriteTache ? mapStringToPriorite(dto.prioriteTache) : undefined,
      templateEmailId: dto.templateEmailId,
      templateTitreTache: dto.templateTitreTache,
      templateDescriptionTache: dto.templateDescriptionTache,
      assigneParDefaut: dto.assigneParDefaut,
      actif: dto.actif,
      ordre: dto.ordre,
    });
    return { data: mapRegleToDto(data), error: null };
  } catch (err) {
    console.error("[updateRegleRelance] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de la règle",
    };
  }
}

/**
 * Delete règle de relance
 */
export async function deleteRegleRelance(
  id: string
): Promise<RelanceActionResult<{ success: boolean }>> {
  try {
    await reglesRelance.delete({ id });
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteRegleRelance] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de la règle",
    };
  }
}

/**
 * Activer règle de relance
 */
export async function activerRegleRelance(
  id: string
): Promise<RelanceActionResult<RegleRelanceDto>> {
  try {
    const data = await reglesRelance.activate({ id });
    return { data: mapRegleToDto(data), error: null };
  } catch (err) {
    console.error("[activerRegleRelance] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'activation de la règle",
    };
  }
}

/**
 * Désactiver règle de relance
 */
export async function desactiverRegleRelance(
  id: string
): Promise<RelanceActionResult<RegleRelanceDto>> {
  try {
    const data = await reglesRelance.deactivate({ id });
    return { data: mapRegleToDto(data), error: null };
  } catch (err) {
    console.error("[desactiverRegleRelance] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la désactivation de la règle",
    };
  }
}

/**
 * List historique des relances
 */
export async function listHistoriqueRelances(
  organisationId: string,
  options?: { limit?: number }
): Promise<RelanceActionResult<HistoriqueRelanceDto[]>> {
  try {
    const data = await historiqueRelance.list({
      organisationId,
      pagination: options?.limit
        ? { page: 1, limit: options.limit, sortBy: "dateExecution", sortOrder: "desc" }
        : undefined,
    });
    return {
      data: data.historiques.map(mapHistoriqueToDto),
      error: null,
    };
  } catch (err) {
    console.error("[listHistoriqueRelances] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de l'historique",
    };
  }
}

/**
 * Execute relances manuellement
 */
export async function executerRelances(
  organisationId: string
): Promise<RelanceActionResult<{ success: boolean; message: string; relancesExecutees: number; relancesEchouees: number }>> {
  try {
    const data = await relanceEngine.execute({ organisationId });
    return {
      data: {
        success: data.success,
        message: data.message,
        relancesExecutees: data.relancesExecutees,
        relancesEchouees: data.relancesEchouees,
      },
      error: null,
    };
  } catch (err) {
    console.error("[executerRelances] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'exécution des relances",
    };
  }
}
