/**
 * Server-side data fetching utilities
 * Use these functions in Server Components to pre-fetch data
 */

import { cookies } from "next/headers";
import { dashboard, commercialKpis, alertes } from "@/lib/grpc";
import type {
  KpisResponse,
  EvolutionCaResponse,
  StatsSocietesResponse,
  AlertesResponse,
  KpisCommerciauxResponse,
  RepartitionProduitsResponse,
} from "@proto/dashboard/dashboard";
import type { Notification } from "@proto/notifications/notifications";

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
 * Fetch alerts server-side
 */
export async function getServerAlertes(
  organisationId: string
): Promise<AlertesResponse | null> {
  try {
    return await alertes.getAlertes({
      filters: { organisationId },
    });
  } catch (error) {
    console.error("[getServerAlertes] Error:", error);
    return null;
  }
}

/**
 * Fetch commercial KPIs server-side
 */
export async function getServerKpisCommerciaux(
  organisationId: string
): Promise<KpisCommerciauxResponse | null> {
  try {
    return await commercialKpis.getKpisCommerciaux({
      filters: { organisationId },
    });
  } catch (error) {
    console.error("[getServerKpisCommerciaux] Error:", error);
    return null;
  }
}

/**
 * Fetch product distribution server-side
 */
export async function getServerRepartitionProduits(
  organisationId: string
): Promise<RepartitionProduitsResponse | null> {
  try {
    return await dashboard.getRepartitionProduits({
      filters: { organisationId },
    });
  } catch (error) {
    console.error("[getServerRepartitionProduits] Error:", error);
    return null;
  }
}

/**
 * Fetch all dashboard data in parallel (optimized for Server Components)
 */
export async function getServerDashboardData(organisationId: string) {
  const [kpis, evolutionCa, statsSocietes, alertes, repartitionProduits] =
    await Promise.all([
      getServerDashboardKpis(organisationId),
      getServerEvolutionCa(organisationId),
      getServerStatsSocietes(organisationId),
      getServerAlertes(organisationId),
      getServerRepartitionProduits(organisationId),
    ]);

  return {
    kpis,
    evolutionCa,
    statsSocietes,
    alertes,
    repartitionProduits,
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
      pagination: undefined,
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
    const result = await societes.listByOrganisation({ organisationId, pagination: undefined });
    return result.societes || [];
  } catch (error) {
    console.error("[getServerSocietes] Error:", error);
    return [];
  }
}

export function getServerStatutClients() {
  const { STATUTS_CLIENT } = require("@/constants/statuts-client");
  return [...STATUTS_CLIENT];
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
    const grpc = await import("@/lib/grpc");
    const [notifList, countResult] = await Promise.all([
      grpc.notifications.getByUser({ utilisateurId, limit: 50 }),
      grpc.notifications.getCount({ utilisateurId }),
    ]);

    const notifs: Notification[] = notifList.notifications || [];

    return {
      notifications: notifs,
      unreadCount: countResult.unread || 0,
      totalCount: countResult.total || 0,
    };
  } catch (error) {
    console.error("[getServerNotifications] Error:", error);
    return {
      notifications: [] as Notification[],
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
      pagination: undefined,
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
      pagination: undefined,
    });
    return result.produits || [];
  } catch (error) {
    console.error("[getServerProduits] Error:", error);
    return [];
  }
}
