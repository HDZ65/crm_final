import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ArchiveSchedulerService } from '../../../../infrastructure/persistence/typeorm/repositories/payments/archive-scheduler.service';

/**
 * Archive gRPC Controller — Manual trigger for archive operations.
 * Allows administrators to trigger archival on-demand outside the daily cron.
 */
@Controller()
export class ArchiveController {
  private readonly logger = new Logger(ArchiveController.name);

  constructor(private readonly archiveSchedulerService: ArchiveSchedulerService) {}

  /**
   * Manually trigger payment archival.
   * Optionally scoped to a specific company.
   */
  @GrpcMethod('ArchiveService', 'ArchivePayments')
  async archivePayments(data: { company_id?: string }) {
    this.logger.log(`Manual archive triggered (company: ${data.company_id ?? 'all'})`);

    const result = await this.archiveSchedulerService.archivePayments(data.company_id);

    return {
      archived_count: result.archivedCount,
      errors: result.errors,
      success: result.errors.length === 0,
    };
  }

  /**
   * Manually trigger interaction archival.
   */
  @GrpcMethod('ArchiveService', 'ArchiveInteractions')
  async archiveInteractions(data: { company_id?: string }) {
    this.logger.log(`Manual interaction archive triggered (company: ${data.company_id ?? 'all'})`);

    const count = await this.archiveSchedulerService.archiveInteractions(data.company_id);

    return {
      archived_count: count,
      success: true,
    };
  }

  /**
   * Manually trigger portal session archival.
   */
  @GrpcMethod('ArchiveService', 'ArchivePortalSessions')
  async archivePortalSessions(data: { company_id?: string }) {
    this.logger.log(`Manual portal session archive triggered (company: ${data.company_id ?? 'all'})`);

    const count = await this.archiveSchedulerService.archivePortalSessions(data.company_id);

    return {
      archived_count: count,
      success: true,
    };
  }

  /**
   * Run the full daily archive (payments + interactions + portal sessions).
   */
  @GrpcMethod('ArchiveService', 'RunFullArchive')
  async runFullArchive(data: { company_id?: string }) {
    this.logger.log(`Full manual archive triggered (company: ${data.company_id ?? 'all'})`);

    const paymentResult = await this.archiveSchedulerService.archivePayments(data.company_id);
    const interactionCount = await this.archiveSchedulerService.archiveInteractions(data.company_id);
    const portalCount = await this.archiveSchedulerService.archivePortalSessions(data.company_id);

    return {
      payments_archived: paymentResult.archivedCount,
      interactions_archived: interactionCount,
      portal_sessions_archived: portalCount,
      errors: paymentResult.errors,
      success: paymentResult.errors.length === 0,
    };
  }

  /**
   * Get the archive policy for a company.
   */
  @GrpcMethod('ArchiveService', 'GetArchivePolicy')
  async getArchivePolicy(data: { company_id: string }) {
    const policy = await this.archiveSchedulerService.getArchivePolicy(data.company_id);

    return {
      payment_retention_days: policy.paymentRetentionDays,
      interaction_retention_days: policy.interactionRetentionDays,
      portal_session_retention_days: policy.portalSessionRetentionDays,
    };
  }
}
