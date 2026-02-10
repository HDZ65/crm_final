import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import {
  AlertEntity,
  AlertScope,
  AlertSeverity,
} from '../../../../../domain/payments/entities';

// ── Alert Codes (CDC Section 5.2) ─────────────────────────────────────

export enum AlertCode {
  PROVIDER_ROUTING_NOT_FOUND = 'PROVIDER_ROUTING_NOT_FOUND',   // CRITICAL
  API_CREDENTIALS_INVALID = 'API_CREDENTIALS_INVALID',         // CRITICAL
  PAYMENT_NOT_SUBMITTED = 'PAYMENT_NOT_SUBMITTED',             // WARNING
  REJECT_SPIKES = 'REJECT_SPIKES',                             // WARNING (>20% rejection rate)
  BATCH_DAY_EMPTY = 'BATCH_DAY_EMPTY',                         // WARNING
  CUTOFF_MISSED = 'CUTOFF_MISSED',                             // WARNING
  HIGH_RISK_MISROUTED = 'HIGH_RISK_MISROUTED',                 // CRITICAL
  HIGH_RISK_SCORE = 'HIGH_RISK_SCORE',                         // WARNING
  FAILED_REMINDER = 'FAILED_REMINDER',                         // INFO
}

// ── Notification channels ─────────────────────────────────────────────

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SLACK = 'SLACK',
  UI = 'UI',
}

// ── Severity → channels mapping (CDC Section 5.3 / Annexe E.4) ───────

const SEVERITY_CHANNELS: Record<AlertSeverity, NotificationChannel[]> = {
  [AlertSeverity.CRITICAL]: [NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.UI],
  [AlertSeverity.WARNING]: [NotificationChannel.EMAIL, NotificationChannel.UI],
  [AlertSeverity.INFO]: [NotificationChannel.UI],
};

// ── DTOs ──────────────────────────────────────────────────────────────

export interface CreateAlertParams {
  scope: AlertScope;
  scopeRef?: string;
  severity: AlertSeverity;
  code: string;
  message: string;
}

export interface AlertFilters {
  scope?: AlertScope;
  severity?: AlertSeverity;
  code?: string;
  acknowledged?: boolean;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AlertPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AlertStats {
  totalAlerts: number;
  unacknowledged: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  byType: Array<{ alertType: string; count: number }>;
}

/**
 * AlertService — Multi-channel alert management for payment operations.
 *
 * CDC Section 5: Supervision & alertes
 * CDC Annexe E: Monitoring et alertes
 *
 * Channels by severity:
 *   CRITICAL → Email + Slack + UI
 *   WARNING  → Email + UI
 *   INFO     → UI only
 */
@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
  ) {}

  // ── Create alert ──────────────────────────────────────────────────

  /**
   * Create an alert and trigger notifications based on severity.
   * CDC Section 5.5: Alerts stored in `alerts` table with notified channels.
   */
  async createAlert(params: CreateAlertParams): Promise<AlertEntity> {
    const channels = SEVERITY_CHANNELS[params.severity] ?? [NotificationChannel.UI];

    const alert = this.alertRepository.create({
      scope: params.scope,
      scopeRef: params.scopeRef ?? null,
      severity: params.severity,
      code: params.code,
      message: params.message,
      notifiedChannels: channels,
    });

    const saved = await this.alertRepository.save(alert);
    this.logger.log(
      `Alert created: [${saved.severity}] ${saved.code} — ${saved.message} (id=${saved.id})`,
    );

    // Dispatch notifications per channel
    await this.dispatchNotifications(saved, channels);

    return saved;
  }

  // ── Acknowledge alert ─────────────────────────────────────────────

  /**
   * Acknowledge an alert (CDC Section 5.5: "accuser réception et clôturer").
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<AlertEntity> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    if (alert.isAcknowledged()) {
      this.logger.warn(`Alert ${alertId} already acknowledged by ${alert.acknowledgedBy}`);
      return alert;
    }

    alert.acknowledge(userId);
    const saved = await this.alertRepository.save(alert);
    this.logger.log(`Alert ${alertId} acknowledged by ${userId}`);

    return saved;
  }

  // ── List alerts ───────────────────────────────────────────────────

  /**
   * List alerts with filtering and pagination.
   * Proto: ListAlertsRequest → ListAlertsResponse
   */
  async listAlerts(filters: AlertFilters): Promise<AlertPaginatedResult<AlertEntity>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: FindOptionsWhere<AlertEntity> = {};

    if (filters.scope) {
      where.scope = filters.scope;
    }
    if (filters.severity) {
      where.severity = filters.severity;
    }
    if (filters.code) {
      where.code = filters.code;
    }
    if (filters.acknowledged !== undefined) {
      // acknowledged = true → acknowledgedBy IS NOT NULL
      // acknowledged = false → acknowledgedBy IS NULL
      // TypeORM doesn't support IsNull/IsNotNull in FindOptionsWhere directly for optional,
      // so we use query builder for this case
    }

    // Use query builder for the acknowledged filter
    const qb = this.alertRepository.createQueryBuilder('alert');

    if (filters.scope) {
      qb.andWhere('alert.scope = :scope', { scope: filters.scope });
    }
    if (filters.severity) {
      qb.andWhere('alert.severity = :severity', { severity: filters.severity });
    }
    if (filters.code) {
      qb.andWhere('alert.code = :code', { code: filters.code });
    }
    if (filters.acknowledged === true) {
      qb.andWhere('alert.acknowledged_by IS NOT NULL');
    } else if (filters.acknowledged === false) {
      qb.andWhere('alert.acknowledged_by IS NULL');
    }
    if (filters.fromDate && filters.toDate) {
      qb.andWhere('alert.created_at BETWEEN :from AND :to', {
        from: filters.fromDate,
        to: filters.toDate,
      });
    } else if (filters.fromDate) {
      qb.andWhere('alert.created_at >= :from', { from: filters.fromDate });
    } else if (filters.toDate) {
      qb.andWhere('alert.created_at <= :to', { to: filters.toDate });
    }

    qb.orderBy('alert.created_at', 'DESC');
    qb.skip(skip).take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, pageSize };
  }

  // ── Alert stats ───────────────────────────────────────────────────

  /**
   * Get alert statistics for a date range.
   * Proto: GetAlertStatsRequest → AlertStatsResponse
   */
  async getAlertStats(fromDate: string, toDate: string): Promise<AlertStats> {
    const qb = this.alertRepository.createQueryBuilder('alert');
    qb.where('alert.created_at BETWEEN :from AND :to', {
      from: fromDate,
      to: toDate,
    });

    const alerts = await qb.getMany();

    const unacknowledged = alerts.filter((a) => !a.isAcknowledged()).length;
    const criticalCount = alerts.filter((a) => a.severity === AlertSeverity.CRITICAL).length;
    const warningCount = alerts.filter((a) => a.severity === AlertSeverity.WARNING).length;
    const infoCount = alerts.filter((a) => a.severity === AlertSeverity.INFO).length;

    // Group by code
    const byTypeMap = new Map<string, number>();
    for (const alert of alerts) {
      byTypeMap.set(alert.code, (byTypeMap.get(alert.code) ?? 0) + 1);
    }
    const byType = Array.from(byTypeMap.entries()).map(([alertType, count]) => ({
      alertType,
      count,
    }));

    return {
      totalAlerts: alerts.length,
      unacknowledged,
      criticalCount,
      warningCount,
      infoCount,
      byType,
    };
  }

  // ── Resolve alert ─────────────────────────────────────────────────

  /**
   * Resolve an alert — soft delete via removal.
   * In production, consider adding a `resolved` status column.
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    await this.alertRepository.remove(alert);
    this.logger.log(`Alert ${alertId} resolved (deleted)`);
  }

  // ── Notification dispatch ─────────────────────────────────────────

  /**
   * Dispatch notifications to the appropriate channels.
   * CDC Section 5.3: Email, Slack/Teams, Interface CRM.
   *
   * - Email: logs the email content (actual SMTP config is external)
   * - Slack: logs the webhook payload (env var SLACK_WEBHOOK_URL)
   * - UI: logs the NATS event (alert.created)
   */
  private async dispatchNotifications(
    alert: AlertEntity,
    channels: NotificationChannel[],
  ): Promise<void> {
    for (const channel of channels) {
      try {
        switch (channel) {
          case NotificationChannel.EMAIL:
            await this.sendEmailNotification(alert);
            break;
          case NotificationChannel.SLACK:
            await this.sendSlackNotification(alert);
            break;
          case NotificationChannel.UI:
            await this.emitUIEvent(alert);
            break;
        }
      } catch (error) {
        this.logger.error(
          `Failed to send ${channel} notification for alert ${alert.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  /**
   * Email notification — prepare content and log it.
   * Actual SMTP delivery is handled by an external service.
   */
  private async sendEmailNotification(alert: AlertEntity): Promise<void> {
    const emailContent = {
      to: this.getEmailRecipients(alert.severity),
      subject: `[${alert.severity}] Alert: ${alert.code}`,
      body: [
        `Alert ID: ${alert.id}`,
        `Severity: ${alert.severity}`,
        `Scope: ${alert.scope}${alert.scopeRef ? ` (${alert.scopeRef})` : ''}`,
        `Code: ${alert.code}`,
        `Message: ${alert.message}`,
        `Created: ${alert.createdAt.toISOString()}`,
      ].join('\n'),
    };

    this.logger.log(
      `[EMAIL] Alert notification prepared: to=${emailContent.to.join(',')} subject="${emailContent.subject}"`,
    );
  }

  /**
   * Slack notification — prepare webhook payload and log it.
   * In production, POST to SLACK_WEBHOOK_URL env var.
   */
  private async sendSlackNotification(alert: AlertEntity): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    const payload = {
      text: `*[${alert.severity}]* Alert \`${alert.code}\``,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: [
              `*:rotating_light: ${alert.severity} Alert*`,
              `*Code:* \`${alert.code}\``,
              `*Scope:* ${alert.scope}${alert.scopeRef ? ` (${alert.scopeRef})` : ''}`,
              `*Message:* ${alert.message}`,
              `*Time:* ${alert.createdAt.toISOString()}`,
            ].join('\n'),
          },
        },
      ],
    };

    if (webhookUrl) {
      this.logger.log(
        `[SLACK] Webhook POST to ${webhookUrl} — alert ${alert.id} (${alert.code})`,
      );
      // In production: await fetch(webhookUrl, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
    } else {
      this.logger.warn(
        `[SLACK] SLACK_WEBHOOK_URL not configured — alert ${alert.id} payload: ${JSON.stringify(payload)}`,
      );
    }
  }

  /**
   * UI event — emit NATS event for real-time UI updates.
   * Event subject: alert.created
   */
  private async emitUIEvent(alert: AlertEntity): Promise<void> {
    const eventPayload = {
      alertId: alert.id,
      scope: alert.scope,
      scopeRef: alert.scopeRef,
      severity: alert.severity,
      code: alert.code,
      message: alert.message,
      createdAt: alert.createdAt.toISOString(),
    };

    this.logger.log(
      `[UI/NATS] Event 'alert.created' emitted for alert ${alert.id} — ${JSON.stringify(eventPayload)}`,
    );
    // In production: await this.natsService.publish('alert.created', eventPayload);
  }

  // ── Helpers ───────────────────────────────────────────────────────

  /**
   * Get email recipients based on severity.
   * CDC Section 5.3: IT, ADV, Finance depending on severity.
   */
  private getEmailRecipients(severity: AlertSeverity): string[] {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return ['it@company.com', 'finance@company.com', 'adv@company.com'];
      case AlertSeverity.WARNING:
        return ['adv@company.com', 'finance@company.com'];
      case AlertSeverity.INFO:
        return ['adv@company.com'];
      default:
        return ['it@company.com'];
    }
  }
}
