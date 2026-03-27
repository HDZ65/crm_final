import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  AcknowledgeAlertRequest,
  AlertResponse,
  AlertStatsResponse,
  AlertTypeCount,
  GetAlertStatsRequest,
  ListAlertsRequest,
  ListAlertsResponse,
} from '@proto/payment';
import { AlertEntity, AlertSeverity, AlertScope } from '../../../../domain/payments/entities';
import { AlertService } from '../../../../infrastructure/persistence/typeorm/repositories/payments/alert.service';

/**
 * Alert gRPC Controller — Exposes alert management RPCs.
 *
 * Proto RPCs:
 *   - ListAlerts
 *   - AcknowledgeAlert
 *   - GetAlertStats
 *
 * CDC Section 5: Supervision & alertes
 */
@Controller()
export class AlertController {
  private readonly logger = new Logger(AlertController.name);

  constructor(private readonly alertService: AlertService) {}

  /**
   * List alerts with filtering.
   * Proto: ListAlertsRequest → ListAlertsResponse
   */
  @GrpcMethod('PaymentService', 'ListAlerts')
  async listAlerts(data: ListAlertsRequest): Promise<ListAlertsResponse> {
    const page = data.page && data.page > 0 ? data.page : 1;
    const pageSize = data.page_size && data.page_size > 0 ? data.page_size : 20;

    const result = await this.alertService.listAlerts({
      scope: this.toAlertScope(data.alert_type),
      severity: this.toAlertSeverity(data.severity),
      code: data.alert_type || undefined,
      acknowledged: data.acknowledged,
      fromDate: data.from_date || undefined,
      toDate: data.to_date || undefined,
      page,
      pageSize,
    });

    return {
      alerts: result.data.map((alert) => this.toAlertResponse(alert, data.societe_id)),
      total: result.total,
      page: result.page,
      page_size: result.pageSize,
    };
  }

  /**
   * Acknowledge an alert.
   * Proto: AcknowledgeAlertRequest → AlertResponse
   */
  @GrpcMethod('PaymentService', 'AcknowledgeAlert')
  async acknowledgeAlert(data: AcknowledgeAlertRequest): Promise<AlertResponse> {
    const alert = await this.alertService.acknowledgeAlert(
      data.id,
      data.acknowledged_by,
    );

    return this.toAlertResponse(alert, data.societe_id);
  }

  /**
   * Get alert statistics.
   * Proto: GetAlertStatsRequest → AlertStatsResponse
   */
  @GrpcMethod('PaymentService', 'GetAlertStats')
  async getAlertStats(data: GetAlertStatsRequest): Promise<AlertStatsResponse> {
    const stats = await this.alertService.getAlertStats(
      data.from_date,
      data.to_date,
    );

    return {
      total_alerts: stats.totalAlerts,
      unacknowledged: stats.unacknowledged,
      critical_count: stats.criticalCount,
      warning_count: stats.warningCount,
      info_count: stats.infoCount,
      by_type: stats.byType.map(
        (entry): AlertTypeCount => ({
          alert_type: entry.alertType,
          count: entry.count,
        }),
      ),
    };
  }

  // ── Mappers ───────────────────────────────────────────────────────

  private toAlertResponse(alert: AlertEntity, societeId: string): AlertResponse {
    return {
      id: alert.id,
      societe_id: societeId,
      alert_type: alert.code,
      severity: alert.severity,
      title: alert.code.replace(/_/g, ' '),
      message: alert.message,
      context: JSON.stringify({
        scope: alert.scope,
        scopeRef: alert.scopeRef,
        notifiedChannels: alert.notifiedChannels,
      }),
      acknowledged: alert.isAcknowledged(),
      acknowledged_by: alert.acknowledgedBy ?? undefined,
      acknowledged_at: alert.acknowledgedAt?.toISOString() ?? undefined,
      created_at: alert.createdAt.toISOString(),
    };
  }

  private toAlertSeverity(severity?: string): AlertSeverity | undefined {
    if (!severity) return undefined;

    const normalized = severity.trim().toUpperCase();
    if (normalized === 'CRITICAL') return AlertSeverity.CRITICAL;
    if (normalized === 'WARNING') return AlertSeverity.WARNING;
    if (normalized === 'INFO') return AlertSeverity.INFO;

    return undefined;
  }

  private toAlertScope(alertType?: string): AlertScope | undefined {
    // Alert type doesn't directly map to scope; scope filter is separate
    // Return undefined to not filter by scope based on alert_type
    return undefined;
  }
}
