import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, FindOptionsWhere } from 'typeorm';
import {
  PlannedDebitEntity,
  PlannedDateStatus,
  VolumeThresholdEntity,
  CalendarAuditLogEntity,
  CalendarAuditSource,
  HolidayEntity,
  HolidayZoneEntity,
  VolumeForecastEntity,
  DebitBatch,
} from '../../../../../domain/calendar/entities';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaginationInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface PaginationOutput {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Calendar view helpers
// ---------------------------------------------------------------------------

interface CalendarDayResult {
  date: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string;
  isEligible: boolean;
  debits: PlannedDebitEntity[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class CalendarAdminService {
  private readonly logger = new Logger(CalendarAdminService.name);

  constructor(
    @InjectRepository(PlannedDebitEntity)
    private readonly plannedDebitRepo: Repository<PlannedDebitEntity>,
    @InjectRepository(VolumeThresholdEntity)
    private readonly thresholdRepo: Repository<VolumeThresholdEntity>,
    @InjectRepository(CalendarAuditLogEntity)
    private readonly auditRepo: Repository<CalendarAuditLogEntity>,
    @InjectRepository(HolidayEntity)
    private readonly holidayRepo: Repository<HolidayEntity>,
    @InjectRepository(HolidayZoneEntity)
    private readonly holidayZoneRepo: Repository<HolidayZoneEntity>,
    @InjectRepository(VolumeForecastEntity)
    private readonly forecastRepo: Repository<VolumeForecastEntity>,
  ) {}

  // =========================================================================
  // GetCalendarView
  // =========================================================================

  async getCalendarView(
    organisationId: string,
    startDate: string,
    endDate: string,
    societeIds: string[],
    batches: string[],
    statuses: string[],
    includeVolumes: boolean,
  ) {
    // Build query for planned debits in the date range
    const qb = this.plannedDebitRepo
      .createQueryBuilder('pd')
      .where('pd.organisationId = :organisationId', { organisationId })
      .andWhere('pd.plannedDebitDate >= :startDate', { startDate })
      .andWhere('pd.plannedDebitDate <= :endDate', { endDate });

    if (societeIds?.length) {
      qb.andWhere('pd.societeId IN (:...societeIds)', { societeIds });
    }
    if (batches?.length) {
      qb.andWhere('pd.batch IN (:...batches)', { batches });
    }
    if (statuses?.length) {
      qb.andWhere('pd.status IN (:...statuses)', { statuses });
    }

    qb.orderBy('pd.plannedDebitDate', 'ASC');

    const debits = await qb.getMany();

    // Fetch holidays for the org in that date range
    const orgZones = await this.holidayZoneRepo.find({
      where: { organisationId, isActive: true },
    });
    const zoneIds = orgZones.map((z) => z.id);

    let holidayMap = new Map<string, string>(); // date -> holiday name
    if (zoneIds.length) {
      const holidays = await this.holidayRepo
        .createQueryBuilder('h')
        .where('h.holidayZoneId IN (:...zoneIds)', { zoneIds })
        .andWhere('h.date >= :startDate', { startDate })
        .andWhere('h.date <= :endDate', { endDate })
        .andWhere('h.isActive = true')
        .getMany();

      for (const h of holidays) {
        const dateStr = typeof h.date === 'string' ? h.date : new Date(h.date).toISOString().split('T')[0];
        holidayMap.set(dateStr, h.name);
      }
    }

    // Group debits by date
    const debitsByDate = new Map<string, PlannedDebitEntity[]>();
    for (const d of debits) {
      const dateStr =
        typeof d.plannedDebitDate === 'string'
          ? d.plannedDebitDate
          : new Date(d.plannedDebitDate).toISOString().split('T')[0];
      if (!debitsByDate.has(dateStr)) {
        debitsByDate.set(dateStr, []);
      }
      debitsByDate.get(dateStr)!.push(d);
    }

    // Build calendar days for the full range
    const days: CalendarDayResult[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay(); // 0=Sunday, 6=Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidayMap.has(dateStr);
      const holidayName = holidayMap.get(dateStr) || '';
      const isEligible = !isWeekend && !isHoliday;

      days.push({
        date: dateStr,
        isWeekend,
        isHoliday,
        holidayName,
        isEligible,
        debits: debitsByDate.get(dateStr) || [],
      });
    }

    return { days, volumes: [] };
  }

  // =========================================================================
  // GetDateDetails
  // =========================================================================

  async getDateDetails(
    organisationId: string,
    date: string,
    societeId: string,
    batch: string | null,
    pagination: PaginationInput,
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;

    const qb = this.plannedDebitRepo
      .createQueryBuilder('pd')
      .where('pd.organisationId = :organisationId', { organisationId })
      .andWhere('pd.plannedDebitDate = :date', { date });

    if (societeId) {
      qb.andWhere('pd.societeId = :societeId', { societeId });
    }
    if (batch) {
      qb.andWhere('pd.batch = :batch', { batch });
    }

    const total = await qb.getCount();
    const debits = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('pd.clientId', 'ASC')
      .getMany();

    // Aggregate
    const aggResult = await this.plannedDebitRepo
      .createQueryBuilder('pd')
      .select('COUNT(pd.id)', 'transactionCount')
      .addSelect('COALESCE(SUM(pd.amountCents), 0)', 'totalAmountCents')
      .where('pd.organisationId = :organisationId', { organisationId })
      .andWhere('pd.plannedDebitDate = :date', { date })
      .getRawOne();

    return {
      debits,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      aggregate: {
        date,
        transactionCount: parseInt(aggResult?.transactionCount || '0', 10),
        totalAmountCents: parseInt(aggResult?.totalAmountCents || '0', 10),
        currency: 'EUR',
      },
    };
  }

  // =========================================================================
  // GetVolumeHeatmap
  // =========================================================================

  async getVolumeHeatmap(
    organisationId: string,
    year: number,
    month: number,
    societeIds: string[],
    batches: string[],
    includeForecast: boolean,
  ) {
    // Determine date range
    let startDate: string;
    let endDate: string;
    if (month > 0) {
      const m = month.toString().padStart(2, '0');
      startDate = `${year}-${m}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      endDate = `${year}-${m}-${lastDay.toString().padStart(2, '0')}`;
    } else {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    }

    // Aggregate planned debits per day
    const qb = this.plannedDebitRepo
      .createQueryBuilder('pd')
      .select('pd.plannedDebitDate', 'date')
      .addSelect('COUNT(pd.id)', 'transactionCount')
      .addSelect('COALESCE(SUM(pd.amountCents), 0)', 'totalAmountCents')
      .where('pd.organisationId = :organisationId', { organisationId })
      .andWhere('pd.plannedDebitDate >= :startDate', { startDate })
      .andWhere('pd.plannedDebitDate <= :endDate', { endDate })
      .groupBy('pd.plannedDebitDate');

    if (societeIds?.length) {
      qb.andWhere('pd.societeId IN (:...societeIds)', { societeIds });
    }
    if (batches?.length) {
      qb.andWhere('pd.batch IN (:...batches)', { batches });
    }

    const rows = await qb.getRawMany();

    // Load thresholds for the org to check exceedance
    const thresholds = await this.thresholdRepo.find({
      where: { organisationId, isActive: true },
    });

    // Build cells
    const cells = rows.map((row) => {
      const d = new Date(row.date);
      const txCount = parseInt(row.transactionCount || '0', 10);
      const totalCents = parseInt(row.totalAmountCents || '0', 10);

      const exceedsThreshold = thresholds.some(
        (t) =>
          (t.maxTransactionCount > 0 && txCount > t.maxTransactionCount) ||
          (t.maxAmountCents > 0 && totalCents > Number(t.maxAmountCents)),
      );

      let intensityLevel = 'LOW';
      if (txCount > 100 || totalCents > 1000000) intensityLevel = 'CRITICAL';
      else if (txCount > 50 || totalCents > 500000) intensityLevel = 'HIGH';
      else if (txCount > 20 || totalCents > 100000) intensityLevel = 'MEDIUM';

      return {
        date: d.toISOString().split('T')[0],
        dayOfWeek: (d.getDay() + 6) % 7, // 0=Monday (proto convention)
        weekOfMonth: Math.ceil(d.getDate() / 7),
        transactionCount: txCount,
        totalAmountCents: totalCents,
        currency: 'EUR',
        intensityLevel,
        exceedsThreshold,
      };
    });

    const exceededThresholds = thresholds.filter((t) =>
      cells.some(
        (c) =>
          (t.maxTransactionCount > 0 && c.transactionCount > t.maxTransactionCount) ||
          (t.maxAmountCents > 0 && c.totalAmountCents > Number(t.maxAmountCents)),
      ),
    );

    return { cells, exceededThresholds };
  }

  // =========================================================================
  // ImportCsv  (dry-run always – real import on ConfirmCsvImport)
  // =========================================================================

  async importCsv(
    organisationId: string,
    csvContent: Uint8Array,
    importType: string,
    dryRun: boolean,
    uploadedByUserId: string,
  ) {
    // Placeholder: parse CSV and validate
    const importId = crypto.randomUUID();
    return {
      importId,
      success: true,
      isDryRun: dryRun,
      totalRows: 0,
      validRows: 0,
      errorRows: 0,
      errors: [],
      preview: [],
    };
  }

  // =========================================================================
  // ConfirmCsvImport
  // =========================================================================

  async confirmCsvImport(importId: string, organisationId: string, confirmedByUserId: string) {
    // Placeholder: apply the previously-validated import
    return {
      success: true,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      auditLogId: '',
    };
  }

  // =========================================================================
  // ExportCalendarCsv
  // =========================================================================

  async exportCalendarCsv(
    organisationId: string,
    startDate: string,
    endDate: string,
    societeIds: string[],
    batches: string[],
    exportType: string,
  ) {
    const qb = this.plannedDebitRepo
      .createQueryBuilder('pd')
      .where('pd.organisationId = :organisationId', { organisationId })
      .andWhere('pd.plannedDebitDate >= :startDate', { startDate })
      .andWhere('pd.plannedDebitDate <= :endDate', { endDate });

    if (societeIds?.length) {
      qb.andWhere('pd.societeId IN (:...societeIds)', { societeIds });
    }
    if (batches?.length) {
      qb.andWhere('pd.batch IN (:...batches)', { batches });
    }

    const debits = await qb.orderBy('pd.plannedDebitDate', 'ASC').getMany();

    // Build CSV content
    const header = 'date,contrat_id,client_id,amount_cents,currency,status,batch\n';
    const rows = debits
      .map(
        (d) =>
          `${d.plannedDebitDate},${d.contratId},${d.clientId},${d.amountCents},${d.currency},${d.status},${d.batch}`,
      )
      .join('\n');

    const csv = header + rows;
    const csvContent = new TextEncoder().encode(csv);
    const filename = `calendar_export_${startDate}_${endDate}.csv`;

    return {
      csvContent,
      filename,
      rowCount: debits.length,
    };
  }

  // =========================================================================
  // VolumeThreshold CRUD
  // =========================================================================

  async createVolumeThreshold(data: {
    organisationId: string;
    societeId?: string;
    maxTransactionCount: number;
    maxAmountCents: number;
    currency: string;
    alertOnExceed: boolean;
    alertEmail?: string;
  }): Promise<VolumeThresholdEntity> {
    const entity = this.thresholdRepo.create({
      ...data,
      isActive: true,
    });
    return this.thresholdRepo.save(entity);
  }

  async updateVolumeThreshold(
    id: string,
    data: {
      maxTransactionCount: number;
      maxAmountCents: number;
      currency: string;
      alertOnExceed: boolean;
      alertEmail?: string;
      isActive: boolean;
    },
  ): Promise<VolumeThresholdEntity> {
    const entity = await this.thresholdRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`VolumeThreshold ${id} not found`);
    }
    Object.assign(entity, data);
    return this.thresholdRepo.save(entity);
  }

  async getVolumeThreshold(id: string): Promise<VolumeThresholdEntity> {
    const entity = await this.thresholdRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`VolumeThreshold ${id} not found`);
    }
    return entity;
  }

  async listVolumeThresholds(
    organisationId: string,
    societeId: string,
    pagination: PaginationInput,
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    const where: FindOptionsWhere<VolumeThresholdEntity> = { organisationId };
    if (societeId) {
      where.societeId = societeId;
    }

    const [thresholds, total] = await this.thresholdRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      thresholds,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async deleteVolumeThreshold(id: string) {
    const entity = await this.thresholdRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`VolumeThreshold ${id} not found`);
    }
    await this.thresholdRepo.remove(entity);
    return { success: true, message: '' };
  }

  // =========================================================================
  // Audit Logs
  // =========================================================================

  async getAuditLogs(
    organisationId: string,
    filters: {
      entityType?: string;
      entityId?: string;
      actorUserId?: string;
      source?: number;
      startDate?: string;
      endDate?: string;
    },
    pagination: PaginationInput,
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;

    const qb = this.auditRepo
      .createQueryBuilder('al')
      .where('al.organisationId = :organisationId', { organisationId });

    if (filters.entityType) {
      qb.andWhere('al.entityType = :entityType', { entityType: filters.entityType });
    }
    if (filters.entityId) {
      qb.andWhere('al.entityId = :entityId', { entityId: filters.entityId });
    }
    if (filters.actorUserId) {
      qb.andWhere('al.actorUserId = :actorUserId', { actorUserId: filters.actorUserId });
    }
    if (filters.startDate) {
      qb.andWhere('al.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      qb.andWhere('al.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const total = await qb.getCount();
    const logs = await qb
      .orderBy('al.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
