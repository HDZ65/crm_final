/**
 * Server-side data fetching utilities
 * Use these functions in Server Components to pre-fetch data
 */

import { cookies } from "next/headers";
import { dashboard, commercialKpis, alertes, contrats } from "@/lib/grpc";
import type {
  KpisResponse,
  EvolutionCaResponse,
  StatsSocietesResponse,
} from "@proto-frontend/dashboard/dashboard";
import { NotificationType as GrpcNotificationType } from "@proto-frontend/notifications/notifications";
import {
  NotificationType as AppNotificationType,
  type Notification as AppNotification,
} from "@/types/notification";

function mapGrpcNotificationType(
  type: GrpcNotificationType
): AppNotificationType {
  switch (type) {
    case GrpcNotificationType.NOTIFICATION_TYPE_CONTRAT_EXPIRE:
      return AppNotificationType.CONTRAT_EXPIRE;
    case GrpcNotificationType.NOTIFICATION_TYPE_CONTRAT_BIENTOT_EXPIRE:
      return AppNotificationType.CONTRAT_BIENTOT_EXPIRE;
    case GrpcNotificationType.NOTIFICATION_TYPE_IMPAYE:
      return AppNotificationType.IMPAYE;
    case GrpcNotificationType.NOTIFICATION_TYPE_NOUVEAU_CLIENT:
      return AppNotificationType.NOUVEAU_CLIENT;
    case GrpcNotificationType.NOTIFICATION_TYPE_NOUVEAU_CONTRAT:
      return AppNotificationType.NOUVEAU_CONTRAT;
    case GrpcNotificationType.NOTIFICATION_TYPE_TACHE_ASSIGNEE:
      return AppNotificationType.TACHE_ASSIGNEE;
    case GrpcNotificationType.NOTIFICATION_TYPE_RAPPEL:
      return AppNotificationType.RAPPEL;
    case GrpcNotificationType.NOTIFICATION_TYPE_ALERTE:
      return AppNotificationType.ALERTE;
    case GrpcNotificationType.NOTIFICATION_TYPE_SYSTEME:
      return AppNotificationType.SYSTEME;
    case GrpcNotificationType.NOTIFICATION_TYPE_INFO:
    case GrpcNotificationType.NOTIFICATION_TYPE_UNSPECIFIED:
    case GrpcNotificationType.UNRECOGNIZED:
    default:
      return AppNotificationType.INFO;
  }
}

/**
 * Get active organisation ID from cookie (server-side)
 */
export async function getActiveOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("active_organisation_id")?.value || null;
}

/**
 * Fetch dashboard KPIs server-side
 */
export async function getServerDashboardKpis(
  organisationId: string
): Promise<KpisResponse | null> {
  try {
    return await dashboard.getKpis({
      filters: { organisationId },
    });
  } catch (error) {
    console.error("[getServerDashboardKpis] Error:", error);
    return null;
  }
}

/**
 * Fetch CA evolution server-side
 */
export async function getServerEvolutionCa(
  organisationId: string
): Promise<EvolutionCaResponse | null> {
  try {
    return await dashboard.getEvolutionCa({
      filters: { organisationId },
    });
  } catch (error) {
    console.error("[getServerEvolutionCa] Error:", error);
    return null;
  }
}

/**
 * Fetch company stats server-side
 */
export async function getServerStatsSocietes(
  organisationId: string,
  dateDebut?: string,
  dateFin?: string
): Promise<StatsSocietesResponse | null> {
  try {
    // Default to last 30 days
    const now = new Date();
    const defaultDateFin = now.toISOString().split("T")[0];
    const defaultDateDebut = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    return await dashboard.getStatsSocietes({
      filters: {
        organisationId,
        dateDebut: dateDebut || defaultDateDebut,
        dateFin: dateFin || defaultDateFin,
      },
    });
  } catch (error) {
    console.error("[getServerStatsSocietes] Error:", error);
    return null;
  }
}

/**
 * Fetch all dashboard data in parallel (optimized for Server Components)
 */
export async function getServerDashboardData(organisationId: string) {
  const [kpis, evolutionCa, statsSocietes] = await Promise.all([
    getServerDashboardKpis(organisationId),
    getServerEvolutionCa(organisationId),
    getServerStatsSocietes(organisationId),
  ]);

  return {
    kpis,
    evolutionCa,
    statsSocietes,
  };
}

/**
 * Fetch clients list server-side
 */
export async function getServerClients(
  organisationId: string,
  options?: {
    statutId?: string;
    societeId?: string;
    type?: "particulier" | "entreprise";
  }
) {
  try {
    const { clients } = await import("@/lib/grpc");
    const result = await clients.list({
      organisationId,
      statutId: options?.statutId,
      societeId: options?.societeId,
    });
    return result.clients || [];
  } catch (error) {
    console.error("[getServerClients] Error:", error);
    return [];
  }
}

/**
 * Fetch societes (companies) list server-side
 */
export async function getServerSocietes(organisationId: string) {
  try {
    const { societes } = await import("@/lib/grpc");
    const result = await societes.listByOrganisation({ organisationId });
    return result.societes || [];
  } catch (error) {
    console.error("[getServerSocietes] Error:", error);
    return [];
  }
}

/**
 * Fetch client statuses server-side
 */
export async function getServerStatutClients() {
  try {
    const { statutClients } = await import("@/lib/grpc");
    const result = await statutClients.list({ search: "" });
    return result.statuts || [];
  } catch (error) {
    console.error("[getServerStatutClients] Error:", error);
    return [];
  }
}

/**
 * Fetch all reference data in parallel (for select dropdowns, etc.)
 */
export async function getServerReferenceData(organisationId: string) {
  const [societes, statutClients] = await Promise.all([
    getServerSocietes(organisationId),
    getServerStatutClients(),
  ]);

  return {
    societes,
    statutClients,
  };
}

/**
 * Fetch notifications server-side
 */
export async function getServerNotifications(utilisateurId: string) {
  try {
    const { notifications } = await import("@/lib/grpc");
    const [notifList, countResult] = await Promise.all([
      notifications.getByUser({ utilisateurId, limit: 50 }),
      notifications.getCount({ utilisateurId }),
    ]);

    const mappedNotifications: AppNotification[] = (
      notifList.notifications || []
    ).map((notification) => ({
      id: notification.id,
      type: mapGrpcNotificationType(notification.type),
      titre: notification.titre,
      message: notification.message,
      lu: notification.lu,
      utilisateurId: notification.utilisateurId,
      organisationId: notification.organisationId,
      metadata: notification.metadata,
      lienUrl: notification.lienUrl,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }));

    return {
      notifications: mappedNotifications,
      unreadCount: countResult.unread || 0,
      totalCount: countResult.total || 0,
    };
  } catch (error) {
    console.error("[getServerNotifications] Error:", error);
    return {
      notifications: [],
      unreadCount: 0,
      totalCount: 0,
    };
  }
}

/**
 * Fetch tasks for a user server-side
 */
export async function getServerTaches(
  utilisateurId: string,
  options?: {
    periode?: "jour" | "semaine" | "mois";
  }
) {
  try {
    const { taches } = await import("@/lib/grpc");
    const result = await taches.listByAssigne({
      assigneA: utilisateurId,
      periode: options?.periode || "semaine",
    });
    return result.taches || [];
  } catch (error) {
    console.error("[getServerTaches] Error:", error);
    return [];
  }
}

/**
 * Fetch products/catalogue server-side
 */
export async function getServerProduits(
  organisationId: string,
  options?: {
    gammeId?: string;
    actif?: boolean;
  }
) {
  try {
    const { produits } = await import("@/lib/grpc");
    const result = await produits.list({
      organisationId,
      gammeId: options?.gammeId,
      actif: options?.actif,
    });
    return result.produits || [];
  } catch (error) {
    console.error("[getServerProduits] Error:", error);
    return [];
  }
}
