import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { randomUUID as uuidv4 } from 'crypto';

import { CompanyDebitConfigurationEntity } from '../configuration/entities/company-debit-configuration.entity';
import { ClientDebitConfigurationEntity } from '../configuration/entities/client-debit-configuration.entity';
import { ContractDebitConfigurationEntity } from '../configuration/entities/contract-debit-configuration.entity';
import { HolidayEntity, HolidayType } from '../holidays/entities/holiday.entity';
import { AuditService } from '../audit/audit.service';
import { AuditSource } from '../audit/entities/calendar-audit-log.entity';
import { DebitDateMode, DebitBatch, DateShiftStrategy } from '../configuration/entities/system-debit-configuration.entity';
import type { ImportCsvResponse, CsvValidationError } from '@crm/proto/calendar';

export interface CsvImportResult {
  importId: string;
  isDryRun: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: CsvRowError[];
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
}

export interface CsvRowError {
  row: number;
  column?: string;
  value?: string;
  message: string;
}

export type ImportType = 'company_config' | 'client_config' | 'contract_config' | 'holidays';

interface CompanyConfigRow {
  societe_id: string;
  mode: string;
  batch?: string;
  fixed_day?: string;
  shift_strategy?: string;
  holiday_zone_id?: string;
}

interface ClientConfigRow {
  client_id: string;
  mode: string;
  batch?: string;
  fixed_day?: string;
  shift_strategy?: string;
  holiday_zone_id?: string;
}

interface ContractConfigRow {
  contrat_id: string;
  mode: string;
  batch?: string;
  fixed_day?: string;
  shift_strategy?: string;
  holiday_zone_id?: string;
}

interface HolidayRow {
  holiday_zone_id: string;
  date: string;
  name: string;
  type?: string;
  is_recurring?: string;
}

@Injectable()
export class CsvImportService {
  private readonly logger = new Logger(CsvImportService.name);

  constructor(
    @InjectRepository(CompanyDebitConfigurationEntity)
    private readonly companyConfigRepo: Repository<CompanyDebitConfigurationEntity>,
    @InjectRepository(ClientDebitConfigurationEntity)
    private readonly clientConfigRepo: Repository<ClientDebitConfigurationEntity>,
    @InjectRepository(ContractDebitConfigurationEntity)
    private readonly contractConfigRepo: Repository<ContractDebitConfigurationEntity>,
    @InjectRepository(HolidayEntity)
    private readonly holidayRepo: Repository<HolidayEntity>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async importCsv(
    organisationId: string,
    importType: ImportType,
    csvContent: string,
    isDryRun: boolean,
    actorUserId: string,
  ): Promise<CsvImportResult> {
    const importId = uuidv4();
    const result: CsvImportResult = {
      importId,
      isDryRun,
      totalRows: 0,
      validRows: 0,
      errorRows: 0,
      errors: [],
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
    };

    let records: Record<string, string>[];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error) {
      result.errors.push({
        row: 0,
        message: `CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return result;
    }

    result.totalRows = records.length;

    switch (importType) {
      case 'company_config':
        return this.importCompanyConfigs(organisationId, records as unknown as CompanyConfigRow[], isDryRun, actorUserId, result);
      case 'client_config':
        return this.importClientConfigs(organisationId, records as unknown as ClientConfigRow[], isDryRun, actorUserId, result);
      case 'contract_config':
        return this.importContractConfigs(organisationId, records as unknown as ContractConfigRow[], isDryRun, actorUserId, result);
      case 'holidays':
        return this.importHolidays(records as unknown as HolidayRow[], isDryRun, actorUserId, result);
      default:
        result.errors.push({ row: 0, message: `Unknown import type: ${importType}` });
        return result;
    }
  }

  private async importCompanyConfigs(
    organisationId: string,
    rows: CompanyConfigRow[],
    isDryRun: boolean,
    actorUserId: string,
    result: CsvImportResult,
  ): Promise<CsvImportResult> {
    const validatedRows: { row: number; data: CompanyConfigRow; existing?: CompanyDebitConfigurationEntity }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const validation = this.validateConfigRow(row as unknown as Record<string, string | undefined>, rowNum, ['societe_id']);
      if (validation.errors.length > 0) {
        result.errors.push(...validation.errors);
        result.errorRows++;
        continue;
      }

      const existing = await this.companyConfigRepo.findOne({
        where: { organisationId, societeId: row.societe_id },
      });

      validatedRows.push({ row: rowNum, data: row, existing: existing ?? undefined });
      result.validRows++;
    }

    if (isDryRun) {
      validatedRows.forEach(({ existing }) => {
        if (existing) result.updatedCount++;
        else result.createdCount++;
      });
      return result;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const { data, existing } of validatedRows) {
        const configData = {
          organisationId,
          societeId: data.societe_id,
          mode: data.mode as DebitDateMode,
          batch: data.batch ? (data.batch as DebitBatch) : undefined,
          fixedDay: data.fixed_day ? parseInt(data.fixed_day, 10) : undefined,
          shiftStrategy: (data.shift_strategy as DateShiftStrategy) ?? DateShiftStrategy.NEXT_BUSINESS_DAY,
          holidayZoneId: data.holiday_zone_id,
          isActive: true,
        };

        if (existing) {
          await queryRunner.manager.update(CompanyDebitConfigurationEntity, existing.id, configData);
          result.updatedCount++;
        } else {
          await queryRunner.manager.insert(CompanyDebitConfigurationEntity, configData);
          result.createdCount++;
        }
      }

      await queryRunner.commitTransaction();

      await this.auditService.logBulkImport(
        organisationId,
        'company_config',
        result.importId,
        actorUserId,
        `Imported ${result.createdCount} new, updated ${result.updatedCount} existing company configurations`,
        { totalRows: result.totalRows, validRows: result.validRows, errorRows: result.errorRows },
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  private async importClientConfigs(
    organisationId: string,
    rows: ClientConfigRow[],
    isDryRun: boolean,
    actorUserId: string,
    result: CsvImportResult,
  ): Promise<CsvImportResult> {
    const validatedRows: { row: number; data: ClientConfigRow; existing?: ClientDebitConfigurationEntity }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const validation = this.validateConfigRow(row as unknown as Record<string, string | undefined>, rowNum, ['client_id']);
      if (validation.errors.length > 0) {
        result.errors.push(...validation.errors);
        result.errorRows++;
        continue;
      }

      const existing = await this.clientConfigRepo.findOne({
        where: { organisationId, clientId: row.client_id },
      });

      validatedRows.push({ row: rowNum, data: row, existing: existing ?? undefined });
      result.validRows++;
    }

    if (isDryRun) {
      validatedRows.forEach(({ existing }) => {
        if (existing) result.updatedCount++;
        else result.createdCount++;
      });
      return result;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const { data, existing } of validatedRows) {
        const configData = {
          organisationId,
          clientId: data.client_id,
          mode: data.mode as DebitDateMode,
          batch: data.batch ? (data.batch as DebitBatch) : undefined,
          fixedDay: data.fixed_day ? parseInt(data.fixed_day, 10) : undefined,
          shiftStrategy: (data.shift_strategy as DateShiftStrategy) ?? DateShiftStrategy.NEXT_BUSINESS_DAY,
          holidayZoneId: data.holiday_zone_id,
          isActive: true,
        };

        if (existing) {
          await queryRunner.manager.update(ClientDebitConfigurationEntity, existing.id, configData);
          result.updatedCount++;
        } else {
          await queryRunner.manager.insert(ClientDebitConfigurationEntity, configData);
          result.createdCount++;
        }
      }

      await queryRunner.commitTransaction();

      await this.auditService.logBulkImport(
        organisationId,
        'client_config',
        result.importId,
        actorUserId,
        `Imported ${result.createdCount} new, updated ${result.updatedCount} existing client configurations`,
        { totalRows: result.totalRows, validRows: result.validRows, errorRows: result.errorRows },
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  private async importContractConfigs(
    organisationId: string,
    rows: ContractConfigRow[],
    isDryRun: boolean,
    actorUserId: string,
    result: CsvImportResult,
  ): Promise<CsvImportResult> {
    const validatedRows: { row: number; data: ContractConfigRow; existing?: ContractDebitConfigurationEntity }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const validation = this.validateConfigRow(row as unknown as Record<string, string | undefined>, rowNum, ['contrat_id']);
      if (validation.errors.length > 0) {
        result.errors.push(...validation.errors);
        result.errorRows++;
        continue;
      }

      const existing = await this.contractConfigRepo.findOne({
        where: { organisationId, contratId: row.contrat_id },
      });

      validatedRows.push({ row: rowNum, data: row, existing: existing ?? undefined });
      result.validRows++;
    }

    if (isDryRun) {
      validatedRows.forEach(({ existing }) => {
        if (existing) result.updatedCount++;
        else result.createdCount++;
      });
      return result;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const { data, existing } of validatedRows) {
        const configData = {
          organisationId,
          contratId: data.contrat_id,
          mode: data.mode as DebitDateMode,
          batch: data.batch ? (data.batch as DebitBatch) : undefined,
          fixedDay: data.fixed_day ? parseInt(data.fixed_day, 10) : undefined,
          shiftStrategy: (data.shift_strategy as DateShiftStrategy) ?? DateShiftStrategy.NEXT_BUSINESS_DAY,
          holidayZoneId: data.holiday_zone_id,
          isActive: true,
        };

        if (existing) {
          await queryRunner.manager.update(ContractDebitConfigurationEntity, existing.id, configData);
          result.updatedCount++;
        } else {
          await queryRunner.manager.insert(ContractDebitConfigurationEntity, configData);
          result.createdCount++;
        }
      }

      await queryRunner.commitTransaction();

      await this.auditService.logBulkImport(
        organisationId,
        'contract_config',
        result.importId,
        actorUserId,
        `Imported ${result.createdCount} new, updated ${result.updatedCount} existing contract configurations`,
        { totalRows: result.totalRows, validRows: result.validRows, errorRows: result.errorRows },
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  private async importHolidays(
    rows: HolidayRow[],
    isDryRun: boolean,
    actorUserId: string,
    result: CsvImportResult,
  ): Promise<CsvImportResult> {
    const validatedRows: { row: number; data: HolidayRow }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      if (!row.holiday_zone_id) {
        result.errors.push({ row: rowNum, column: 'holiday_zone_id', message: 'holiday_zone_id is required' });
        result.errorRows++;
        continue;
      }

      if (!row.date) {
        result.errors.push({ row: rowNum, column: 'date', message: 'date is required' });
        result.errorRows++;
        continue;
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(row.date)) {
        result.errors.push({ row: rowNum, column: 'date', value: row.date, message: 'date must be in YYYY-MM-DD format' });
        result.errorRows++;
        continue;
      }

      if (!row.name) {
        result.errors.push({ row: rowNum, column: 'name', message: 'name is required' });
        result.errorRows++;
        continue;
      }

      validatedRows.push({ row: rowNum, data: row });
      result.validRows++;
    }

    if (isDryRun) {
      result.createdCount = validatedRows.length;
      return result;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const { data } of validatedRows) {
        const isRecurring = data.is_recurring?.toLowerCase() === 'true';
        const holidayDate = new Date(data.date);

        await queryRunner.manager.insert(HolidayEntity, {
          holidayZoneId: data.holiday_zone_id,
          date: holidayDate,
          name: data.name,
          holidayType: (data.type as HolidayType) ?? HolidayType.PUBLIC,
          isRecurring,
          recurringMonth: isRecurring ? holidayDate.getMonth() + 1 : undefined,
          recurringDay: isRecurring ? holidayDate.getDate() : undefined,
          isActive: true,
        });
        result.createdCount++;
      }

      await queryRunner.commitTransaction();

      await this.auditService.logBulkImport(
        'system',
        'holidays',
        result.importId,
        actorUserId,
        `Imported ${result.createdCount} holidays`,
        { totalRows: result.totalRows, validRows: result.validRows, errorRows: result.errorRows },
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  private validateConfigRow(
    row: Record<string, string | undefined>,
    rowNum: number,
    requiredIdField: string[],
  ): { errors: CsvRowError[] } {
    const errors: CsvRowError[] = [];

    for (const field of requiredIdField) {
      if (!row[field]) {
        errors.push({ row: rowNum, column: field, message: `${field} is required` });
      }
    }

    if (!row.mode) {
      errors.push({ row: rowNum, column: 'mode', message: 'mode is required' });
    } else if (!['BATCH', 'FIXED_DAY'].includes(row.mode)) {
      errors.push({ row: rowNum, column: 'mode', value: row.mode, message: 'mode must be BATCH or FIXED_DAY' });
    }

    if (row.mode === 'BATCH') {
      if (!row.batch) {
        errors.push({ row: rowNum, column: 'batch', message: 'batch is required when mode is BATCH' });
      } else if (!['L1', 'L2', 'L3', 'L4'].includes(row.batch)) {
        errors.push({ row: rowNum, column: 'batch', value: row.batch, message: 'batch must be L1, L2, L3, or L4' });
      }
    }

    if (row.mode === 'FIXED_DAY') {
      if (!row.fixed_day) {
        errors.push({ row: rowNum, column: 'fixed_day', message: 'fixed_day is required when mode is FIXED_DAY' });
      } else {
        const day = parseInt(row.fixed_day, 10);
        if (isNaN(day) || day < 1 || day > 28) {
          errors.push({ row: rowNum, column: 'fixed_day', value: row.fixed_day, message: 'fixed_day must be between 1 and 28' });
        }
      }
    }

    if (row.shift_strategy && !['NEXT_BUSINESS_DAY', 'PREVIOUS_BUSINESS_DAY', 'NEXT_WEEK_SAME_DAY'].includes(row.shift_strategy)) {
      errors.push({
        row: rowNum,
        column: 'shift_strategy',
        value: row.shift_strategy,
        message: 'shift_strategy must be NEXT_BUSINESS_DAY, PREVIOUS_BUSINESS_DAY, or NEXT_WEEK_SAME_DAY',
      });
    }

    return { errors };
  }
}
