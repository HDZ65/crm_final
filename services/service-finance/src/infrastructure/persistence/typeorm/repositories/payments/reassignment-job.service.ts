import { randomUUID } from 'crypto';
import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProviderReassignmentJobEntity,
  ReassignmentJobStatus,
  ScheduleEntity,
} from '../../../../../domain/payments/entities';

export interface CreateReassignmentJobParams {
  companyId: string;
  fromProviderAccountId: string;
  toProviderAccountId: string;
  selectionQuery?: Record<string, any>;
  dryRun: boolean;
}

interface ReassignmentCsvRow {
  scheduleId: string;
  fromProviderAccountId: string;
  toProviderAccountId: string;
  status: 'SIMULATED' | 'UPDATED' | 'FAILED';
  error?: string;
}

@Injectable()
export class ReassignmentJobService {
  private readonly logger = new Logger(ReassignmentJobService.name);

  constructor(
    @InjectRepository(ProviderReassignmentJobEntity)
    private readonly jobRepository: Repository<ProviderReassignmentJobEntity>,
    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepository: Repository<ScheduleEntity>,
  ) {}

  async createJob(
    params: CreateReassignmentJobParams,
  ): Promise<ProviderReassignmentJobEntity> {
    const job = this.jobRepository.create({
      companyId: params.companyId,
      fromProviderAccountId: params.fromProviderAccountId,
      toProviderAccountId: params.toProviderAccountId,
      selectionQuery: params.selectionQuery ?? {},
      status: ReassignmentJobStatus.PENDING,
      dryRun: params.dryRun,
      reportFileId: null,
      totalCount: 0,
      processedCount: 0,
      errorCount: 0,
    });

    return this.jobRepository.save(job);
  }

  async executeJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job.status === ReassignmentJobStatus.CANCELLED || job.isComplete()) {
      return;
    }

    job.status = ReassignmentJobStatus.RUNNING;
    await this.jobRepository.save(job);

    const candidates = await this.scheduleRepository.find({
      where: {
        societeId: job.companyId,
        providerAccountId: job.fromProviderAccountId,
      },
    });

    const selectedSchedules = candidates.filter((schedule) =>
      this.matchesSelectionQuery(schedule, job.selectionQuery || {}),
    );

    job.totalCount = selectedSchedules.length;
    job.processedCount = 0;
    job.errorCount = 0;
    await this.jobRepository.save(job);

    const reportRows: ReassignmentCsvRow[] = [];

    if (job.dryRun) {
      for (const schedule of selectedSchedules) {
        reportRows.push({
          scheduleId: schedule.id,
          fromProviderAccountId: job.fromProviderAccountId,
          toProviderAccountId: job.toProviderAccountId,
          status: 'SIMULATED',
        });
      }

      job.status = ReassignmentJobStatus.DONE;
      job.reportFileId = randomUUID();
      await this.jobRepository.save(job);

      this.logCsvReport(job.id, reportRows);
      return;
    }

    for (const schedule of selectedSchedules) {
      const currentState = await this.jobRepository.findOne({ where: { id: job.id } });
      if (currentState?.status === ReassignmentJobStatus.CANCELLED) {
        this.logger.warn(`Reassignment job ${job.id} cancelled during execution`);
        break;
      }

      try {
        schedule.providerAccountId = job.toProviderAccountId;
        await this.scheduleRepository.save(schedule);

        job.processedCount += 1;
        reportRows.push({
          scheduleId: schedule.id,
          fromProviderAccountId: job.fromProviderAccountId,
          toProviderAccountId: job.toProviderAccountId,
          status: 'UPDATED',
        });
      } catch (error) {
        job.errorCount += 1;
        reportRows.push({
          scheduleId: schedule.id,
          fromProviderAccountId: job.fromProviderAccountId,
          toProviderAccountId: job.toProviderAccountId,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      await this.jobRepository.update(
        { id: job.id },
        {
          processedCount: job.processedCount,
          errorCount: job.errorCount,
        },
      );
    }

    const refreshedJob = await this.getJob(job.id);
    if (refreshedJob.status !== ReassignmentJobStatus.CANCELLED) {
      refreshedJob.status =
        refreshedJob.errorCount > 0
          ? ReassignmentJobStatus.FAILED
          : ReassignmentJobStatus.DONE;
      refreshedJob.reportFileId = randomUUID();
      await this.jobRepository.save(refreshedJob);
    }

    this.logCsvReport(job.id, reportRows);
  }

  async getJob(jobId: string): Promise<ProviderReassignmentJobEntity> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Reassignment job ${jobId} not found`);
    }

    return job;
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);

    if (job.isComplete()) {
      return;
    }

    job.status = ReassignmentJobStatus.CANCELLED;
    await this.jobRepository.save(job);
  }

  private matchesSelectionQuery(
    schedule: ScheduleEntity,
    selectionQuery: Record<string, any>,
  ): boolean {
    const query = selectionQuery || {};

    const clientIds = this.toStringArray(query.client_id ?? query.client_ids);
    if (clientIds.length > 0 && !clientIds.includes(schedule.clientId)) {
      return false;
    }

    const contractIds = this.toStringArray(
      query.contrat_id ?? query.contract_id ?? query.contract_ids,
    );
    if (contractIds.length > 0 && !contractIds.includes(schedule.contratId)) {
      return false;
    }

    const sourceChannels = this.toStringArray(query.source_channel);
    if (sourceChannels.length > 0) {
      const scheduleSourceChannel = this.extractMetadataString(schedule, [
        'source_channel',
        'sourceChannel',
      ]);

      if (!scheduleSourceChannel || !this.matchStringList(scheduleSourceChannel, sourceChannels)) {
        return false;
      }
    }

    const productCodes = this.toStringArray(query.product_code);
    if (productCodes.length > 0) {
      const scheduleProductCode = this.extractMetadataString(schedule, [
        'product_code',
        'productCode',
      ]);

      if (!scheduleProductCode || !this.matchStringList(scheduleProductCode, productCodes)) {
        return false;
      }
    }

    const debitLotCodes = this.toStringArray(
      query.debit_lot_code_in ?? query.debit_lot_code,
    );
    if (debitLotCodes.length > 0) {
      const scheduleLotCode = this.extractMetadataString(schedule, [
        'debit_lot_code',
        'debitLotCode',
      ]);

      if (!scheduleLotCode || !this.matchStringList(scheduleLotCode, debitLotCodes)) {
        return false;
      }
    }

    const preferredDebitDays = this.toNumberArray(query.preferred_debit_day_in);
    if (preferredDebitDays.length > 0) {
      const preferredDebitDay = this.extractPreferredDebitDay(schedule);
      if (preferredDebitDay === null || !preferredDebitDays.includes(preferredDebitDay)) {
        return false;
      }
    }

    const riskTiers = this.toStringArray(query.risk_tier);
    if (riskTiers.length > 0) {
      const scheduleRiskTier = this.extractMetadataString(schedule, [
        'risk_tier',
        'riskTier',
      ]);

      if (!scheduleRiskTier || !this.matchStringList(scheduleRiskTier, riskTiers)) {
        return false;
      }
    }

    if (query.contract_age_months_gte !== undefined) {
      const minMonths = Number(query.contract_age_months_gte);
      const ageMonths = this.getContractAgeMonths(schedule.startDate);

      if (!Number.isFinite(minMonths) || ageMonths < minMonths) {
        return false;
      }
    }

    if (query.planned_debit_date_from) {
      const fromDate = new Date(query.planned_debit_date_from);
      if (!schedule.plannedDebitDate || schedule.plannedDebitDate < fromDate) {
        return false;
      }
    }

    if (query.planned_debit_date_to) {
      const toDate = new Date(query.planned_debit_date_to);
      if (!schedule.plannedDebitDate || schedule.plannedDebitDate > toDate) {
        return false;
      }
    }

    return true;
  }

  private logCsvReport(jobId: string, rows: ReassignmentCsvRow[]): void {
    const csv = this.buildCsv(rows);
    this.logger.log(
      `Generated reassignment report for job ${jobId} with ${rows.length} rows`,
    );
    this.logger.debug(csv);
  }

  private buildCsv(rows: ReassignmentCsvRow[]): string {
    const headers = [
      'schedule_id',
      'from_provider_account_id',
      'to_provider_account_id',
      'status',
      'error',
    ];

    const lines = rows.map((row) =>
      [
        row.scheduleId,
        row.fromProviderAccountId,
        row.toProviderAccountId,
        row.status,
        row.error || '',
      ]
        .map((value) => this.escapeCsv(value))
        .join(','),
    );

    return [headers.join(','), ...lines].join('\n');
  }

  private escapeCsv(value: string): string {
    const escaped = value.replaceAll('"', '""');
    return `"${escaped}"`;
  }

  private extractMetadataString(
    schedule: ScheduleEntity,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = schedule.metadata?.[key];
      if (value !== undefined && value !== null && String(value).trim().length > 0) {
        return String(value).trim();
      }
    }

    return null;
  }

  private extractPreferredDebitDay(schedule: ScheduleEntity): number | null {
    const metadataValue =
      schedule.metadata?.preferred_debit_day ?? schedule.metadata?.preferredDebitDay;
    if (metadataValue !== undefined && metadataValue !== null) {
      const parsed = Number(metadataValue);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    if (schedule.plannedDebitDate) {
      return new Date(schedule.plannedDebitDate).getDate();
    }

    return null;
  }

  private toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry).trim()).filter((entry) => entry.length > 0);
    }

    if (value === undefined || value === null || value === '') {
      return [];
    }

    return [String(value).trim()].filter((entry) => entry.length > 0);
  }

  private toNumberArray(value: unknown): number[] {
    if (Array.isArray(value)) {
      return value
        .map((entry) => Number(entry))
        .filter((entry) => Number.isFinite(entry));
    }

    if (value === undefined || value === null || value === '') {
      return [];
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? [parsed] : [];
  }

  private matchStringList(actual: string, acceptedValues: string[]): boolean {
    const normalizedActual = actual.toUpperCase();
    return acceptedValues.some((value) => value.toUpperCase() === normalizedActual);
  }

  private getContractAgeMonths(startDate: Date): number {
    const start = new Date(startDate);
    const now = new Date();
    let months =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());

    if (now.getDate() < start.getDate()) {
      months -= 1;
    }

    return Math.max(0, months);
  }
}
