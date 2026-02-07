"use server";

import { payments } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  ListAlertsRequest,
  ListAlertsResponse,
  AcknowledgeAlertRequest,
  AlertResponse,
  GetAlertStatsRequest,
  AlertStatsResponse,
} from "@proto/payments/payment";
import type { ActionResult } from "@/lib/types/common";

// ==================== FINANCE ALERTS ====================

/**
 * List payment alerts via gRPC
 */
export async function listAlerts(
  request: ListAlertsRequest
): Promise<ActionResult<ListAlertsResponse>> {
  try {
    const data = await payments.listAlerts(request);
    return { data, error: null };
  } catch (err) {
    console.error("[listAlerts] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des alertes",
    };
  }
}

/**
 * Acknowledge an alert via gRPC
 */
export async function acknowledgeAlert(
  request: AcknowledgeAlertRequest
): Promise<ActionResult<AlertResponse>> {
  try {
    const data = await payments.acknowledgeAlert(request);
    revalidatePath("/payments/alerts");
    return { data, error: null };
  } catch (err) {
    console.error("[acknowledgeAlert] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'acquittement de l'alerte",
    };
  }
}

/**
 * Get alert statistics via gRPC
 */
export async function getAlertStats(
  request: GetAlertStatsRequest
): Promise<ActionResult<AlertStatsResponse>> {
  try {
    const data = await payments.getAlertStats(request);
    return { data, error: null };
  } catch (err) {
    console.error("[getAlertStats] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des statistiques d'alertes",
    };
  }
}
