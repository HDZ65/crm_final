import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { format, parseISO, addDays, subDays } from 'date-fns';

import { CalendarEngineService } from './modules/engine/calendar-engine.service.js';
import { ConfigurationResolverService } from './modules/configuration/configuration-resolver.service.js';
import { ConfigurationService } from './modules/configuration/configuration.service.js';
import { HolidaysService } from './modules/holidays/holidays.service.js';
import { AuditService } from './modules/audit/audit.service.js';
import { CsvImportService, ImportType } from './modules/csv-import/csv-import.service.js';
import { AuditSource } from './modules/audit/entities/calendar-audit-log.entity.js';
import { DebitDateMode, DebitBatch, DateShiftStrategy } from './modules/configuration/entities/system-debit-configuration.entity.js';

@Controller()
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(
    private readonly calendarEngine: CalendarEngineService,
    private readonly configResolver: ConfigurationResolverService,
    private readonly configService: ConfigurationService,
    private readonly holidaysService: HolidaysService,
    private readonly auditService: AuditService,
    private readonly csvImportService: CsvImportService,
  ) {}

  @GrpcMethod('CalendarEngineService', 'CalculatePlannedDate')
  async calculatePlannedDate(request: {
    organisationId: string;
    contratId?: string;
    clientId?: string;
    societeId?: string;
    referenceDate?: string;
    targetMonth: number;
    targetYear: number;
    includeResolutionTrace?: boolean;
  }) {
    this.logger.debug(`CalculatePlannedDate: org=${request.organisationId}, month=${request.targetMonth}/${request.targetYear}`);

    const result = await this.calendarEngine.calculatePlannedDate({
      organisationId: request.organisationId,
      contratId: request.contratId,
      clientId: request.clientId,
      societeId: request.societeId,
      referenceDate: request.referenceDate,
      targetMonth: request.targetMonth,
      targetYear: request.targetYear,
      includeResolutionTrace: request.includeResolutionTrace,
    });

    return {
      plannedDebitDate: result.plannedDebitDate,
      originalTargetDate: result.originalTargetDate,
      wasShifted: result.wasShifted,
      shiftReason: result.shiftReason,
      resolvedConfig: this.mapResolvedConfig(result.resolvedConfig),
      resolutionTrace: result.resolutionTrace?.map((step) => ({
        stepOrder: step.stepOrder,
        description: step.description,
        inputDate: step.inputDate,
        outputDate: step.outputDate,
        appliedRule: step.appliedRule,
      })),
    };
  }

  @GrpcMethod('CalendarEngineService', 'CalculatePlannedDatesBatch')
  async calculatePlannedDatesBatch(request: {
    organisationId: string;
    inputs: Array<{
      contratId: string;
      clientId: string;
      societeId: string;
      amountCents: number;
      currency: string;
    }>;
    targetMonth: number;
    targetYear: number;
  }) {
    this.logger.debug(`CalculatePlannedDatesBatch: org=${request.organisationId}, count=${request.inputs.length}`);

    const result = await this.calendarEngine.calculateBatch(
      request.inputs,
      request.organisationId,
      request.targetMonth,
      request.targetYear,
    );

    return {
      results: result.results.map((r) => ({
        contratId: r.contratId,
        success: r.success,
        plannedDebitDate: r.plannedDebitDate,
        errorCode: r.errorCode,
        errorMessage: r.errorMessage,
        resolvedConfig: r.resolvedConfig ? this.mapResolvedConfig(r.resolvedConfig) : undefined,
      })),
      totalCount: result.totalCount,
      successCount: result.successCount,
      errorCount: result.errorCount,
    };
  }

  @GrpcMethod('CalendarEngineService', 'CheckDateEligibility')
  async checkDateEligibility(request: {
    organisationId: string;
    date: string;
    holidayZoneId: string;
  }) {
    this.logger.debug(`CheckDateEligibility: date=${request.date}, zone=${request.holidayZoneId}`);

    const date = parseISO(request.date);
    const eligibility = await this.holidaysService.checkEligibility(date, request.holidayZoneId);

    let nextEligibleDate = '';
    let previousEligibleDate = '';

    if (!eligibility.isEligible) {
      let nextDate = addDays(date, 1);
      for (let i = 0; i < 30; i++) {
        const nextCheck = await this.holidaysService.checkEligibility(nextDate, request.holidayZoneId);
        if (nextCheck.isEligible) {
          nextEligibleDate = format(nextDate, 'yyyy-MM-dd');
          break;
        }
        nextDate = addDays(nextDate, 1);
      }

      let prevDate = subDays(date, 1);
      for (let i = 0; i < 30; i++) {
        const prevCheck = await this.holidaysService.checkEligibility(prevDate, request.holidayZoneId);
        if (prevCheck.isEligible) {
          previousEligibleDate = format(prevDate, 'yyyy-MM-dd');
          break;
        }
        prevDate = subDays(prevDate, 1);
      }
    }

    return {
      isEligible: eligibility.isEligible,
      isWeekend: eligibility.isWeekend,
      isHoliday: eligibility.isHoliday,
      holidayName: eligibility.holidayName ?? '',
      nextEligibleDate,
      previousEligibleDate,
    };
  }

  @GrpcMethod('DebitConfigurationService', 'ResolveConfiguration')
  async resolveConfiguration(request: {
    organisationId: string;
    contratId?: string;
    clientId?: string;
    societeId?: string;
  }) {
    this.logger.debug(`ResolveConfiguration: org=${request.organisationId}`);

    const resolved = await this.configResolver.resolve({
      organisationId: request.organisationId,
      contratId: request.contratId,
      clientId: request.clientId,
      societeId: request.societeId,
    });

    return this.mapResolvedConfig(resolved);
  }

  @GrpcMethod('DebitConfigurationService', 'GetSystemConfig')
  async getSystemConfig(request: { organisationId: string }) {
    this.logger.debug(`GetSystemConfig: org=${request.organisationId}`);
    const config = await this.configService.getSystemConfig(request.organisationId);
    if (!config) {
      return null;
    }
    return this.mapSystemConfig(config);
  }

  @GrpcMethod('DebitConfigurationService', 'UpdateSystemConfig')
  async updateSystemConfig(request: {
    organisationId: string;
    defaultMode: number;
    defaultBatch: number;
    defaultFixedDay: number;
    shiftStrategy: number;
    holidayZoneId: string;
    cutoffConfigId: string;
  }) {
    this.logger.debug(`UpdateSystemConfig: org=${request.organisationId}`);
    const config = await this.configService.updateSystemConfig(
      request.organisationId,
      {
        defaultMode: this.mapProtoToMode(request.defaultMode),
        defaultBatch: request.defaultBatch ? this.mapProtoToBatch(request.defaultBatch) : undefined,
        defaultFixedDay: request.defaultFixedDay || undefined,
        shiftStrategy: this.mapProtoToShiftStrategy(request.shiftStrategy),
        holidayZoneId: request.holidayZoneId || undefined,
        cutoffConfigId: request.cutoffConfigId || undefined,
      },
      'system',
    );
    return this.mapSystemConfig(config);
  }

  @GrpcMethod('DebitConfigurationService', 'CreateCompanyConfig')
  async createCompanyConfig(request: {
    organisationId: string;
    societeId: string;
    mode: number;
    batch: number;
    fixedDay: number;
    shiftStrategy: number;
    holidayZoneId: string;
    cutoffConfigId: string;
  }) {
    this.logger.debug(`CreateCompanyConfig: org=${request.organisationId}, societe=${request.societeId}`);
    const config = await this.configService.createCompanyConfig(
      request.organisationId,
      request.societeId,
      {
        mode: this.mapProtoToMode(request.mode),
        batch: request.batch ? this.mapProtoToBatch(request.batch) : undefined,
        fixedDay: request.fixedDay || undefined,
        shiftStrategy: this.mapProtoToShiftStrategy(request.shiftStrategy),
        holidayZoneId: request.holidayZoneId || undefined,
        cutoffConfigId: request.cutoffConfigId || undefined,
      },
      'system',
    );
    return this.mapCompanyConfig(config);
  }

  @GrpcMethod('DebitConfigurationService', 'UpdateCompanyConfig')
  async updateCompanyConfig(request: {
    id: string;
    mode: number;
    batch: number;
    fixedDay: number;
    shiftStrategy: number;
    holidayZoneId: string;
    cutoffConfigId: string;
    isActive: boolean;
  }) {
    this.logger.debug(`UpdateCompanyConfig: id=${request.id}`);
    const config = await this.configService.updateCompanyConfig(
      request.id,
      {
        mode: this.mapProtoToMode(request.mode),
        batch: request.batch ? this.mapProtoToBatch(request.batch) : undefined,
        fixedDay: request.fixedDay || undefined,
        shiftStrategy: this.mapProtoToShiftStrategy(request.shiftStrategy),
        holidayZoneId: request.holidayZoneId || undefined,
        cutoffConfigId: request.cutoffConfigId || undefined,
        isActive: request.isActive,
      },
      'system',
    );
    return this.mapCompanyConfig(config);
  }

  @GrpcMethod('DebitConfigurationService', 'GetCompanyConfig')
  async getCompanyConfig(request: { id: string }) {
    this.logger.debug(`GetCompanyConfig: id=${request.id}`);
    const config = await this.configService.getCompanyConfig(request.id);
    if (!config) {
      return null;
    }
    return this.mapCompanyConfig(config);
  }

  @GrpcMethod('DebitConfigurationService', 'ListCompanyConfigs')
  async listCompanyConfigs(request: {
    organisationId: string;
    societeId?: string;
    pagination?: { page: number; limit: number };
  }) {
    this.logger.debug(`ListCompanyConfigs: org=${request.organisationId}`);
    const result = await this.configService.listCompanyConfigs(
      request.organisationId,
      request.societeId,
      request.pagination,
    );
    return {
      configs: result.items.map((c) => this.mapCompanyConfig(c)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('DebitConfigurationService', 'DeleteCompanyConfig')
  async deleteCompanyConfig(request: { id: string }) {
    this.logger.debug(`DeleteCompanyConfig: id=${request.id}`);
    await this.configService.deleteCompanyConfig(request.id, 'system');
    return { success: true, message: 'Company configuration deleted' };
  }

  @GrpcMethod('DebitConfigurationService', 'CreateClientConfig')
  async createClientConfig(request: {
    organisationId: string;
    clientId: string;
    mode: number;
    batch: number;
    fixedDay: number;
    shiftStrategy: number;
    holidayZoneId: string;
  }) {
    this.logger.debug(`CreateClientConfig: org=${request.organisationId}, client=${request.clientId}`);
    const config = await this.configService.createClientConfig(
      request.organisationId,
      request.clientId,
      {
        mode: this.mapProtoToMode(request.mode),
        batch: request.batch ? this.mapProtoToBatch(request.batch) : undefined,
        fixedDay: request.fixedDay || undefined,
        shiftStrategy: this.mapProtoToShiftStrategy(request.shiftStrategy),
        holidayZoneId: request.holidayZoneId || undefined,
      },
      'system',
    );
    return this.mapClientConfig(config);
  }

  @GrpcMethod('DebitConfigurationService', 'UpdateClientConfig')
  async updateClientConfig(request: {
    id: string;
    mode: number;
    batch: number;
    fixedDay: number;
    shiftStrategy: number;
    holidayZoneId: string;
    isActive: boolean;
  }) {
    this.logger.debug(`UpdateClientConfig: id=${request.id}`);
    const config = await this.configService.updateClientConfig(
      request.id,
      {
        mode: this.mapProtoToMode(request.mode),
        batch: request.batch ? this.mapProtoToBatch(request.batch) : undefined,
        fixedDay: request.fixedDay || undefined,
        shiftStrategy: this.mapProtoToShiftStrategy(request.shiftStrategy),
        holidayZoneId: request.holidayZoneId || undefined,
        isActive: request.isActive,
      },
      'system',
    );
    return this.mapClientConfig(config);
  }

  @GrpcMethod('DebitConfigurationService', 'GetClientConfig')
  async getClientConfig(request: { id: string }) {
    this.logger.debug(`GetClientConfig: id=${request.id}`);
    const config = await this.configService.getClientConfig(request.id);
    if (!config) {
      return null;
    }
    return this.mapClientConfig(config);
  }

  @GrpcMethod('DebitConfigurationService', 'ListClientConfigs')
  async listClientConfigs(request: {
    organisationId: string;
    clientId?: string;
    pagination?: { page: number; limit: number };
  }) {
    this.logger.debug(`ListClientConfigs: org=${request.organisationId}`);
    const result = await this.configService.listClientConfigs(
      request.organisationId,
      request.clientId,
      request.pagination,
    );
    return {
      configs: result.items.map((c) => this.mapClientConfig(c)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('DebitConfigurationService', 'DeleteClientConfig')
  async deleteClientConfig(request: { id: string }) {
    this.logger.debug(`DeleteClientConfig: id=${request.id}`);
    await this.configService.deleteClientConfig(request.id, 'system');
    return { success: true, message: 'Client configuration deleted' };
  }

  @GrpcMethod('DebitConfigurationService', 'CreateContractConfig')
  async createContractConfig(request: {
    organisationId: string;
    contratId: string;
    mode: number;
    batch: number;
    fixedDay: number;
    shiftStrategy: number;
    holidayZoneId: string;
  }) {
    this.logger.debug(`CreateContractConfig: org=${request.organisationId}, contrat=${request.contratId}`);
    const config = await this.configService.createContractConfig(
      request.organisationId,
      request.contratId,
      {
        mode: this.mapProtoToMode(request.mode),
        batch: request.batch ? this.mapProtoToBatch(request.batch) : undefined,
        fixedDay: request.fixedDay || undefined,
        shiftStrategy: this.mapProtoToShiftStrategy(request.shiftStrategy),
        holidayZoneId: request.holidayZoneId || undefined,
      },
      'system',
    );
    return this.mapContractConfig(config);
  }

  @GrpcMethod('DebitConfigurationService', 'UpdateContractConfig')
  async updateContractConfig(request: {
    id: string;
    mode: number;
    batch: number;
    fixedDay: number;
    shiftStrategy: number;
    holidayZoneId: string;
    isActive: boolean;
  }) {
    this.logger.debug(`UpdateContractConfig: id=${request.id}`);
    const config = await this.configService.updateContractConfig(
      request.id,
      {
        mode: this.mapProtoToMode(request.mode),
        batch: request.batch ? this.mapProtoToBatch(request.batch) : undefined,
        fixedDay: request.fixedDay || undefined,
        shiftStrategy: this.mapProtoToShiftStrategy(request.shiftStrategy),
        holidayZoneId: request.holidayZoneId || undefined,
        isActive: request.isActive,
      },
      'system',
    );
    return this.mapContractConfig(config);
  }

  @GrpcMethod('DebitConfigurationService', 'GetContractConfig')
  async getContractConfig(request: { id: string }) {
    this.logger.debug(`GetContractConfig: id=${request.id}`);
    const config = await this.configService.getContractConfig(request.id);
    if (!config) {
      return null;
    }
    return this.mapContractConfig(config);
  }

  @GrpcMethod('DebitConfigurationService', 'ListContractConfigs')
  async listContractConfigs(request: {
    organisationId: string;
    contratId?: string;
    pagination?: { page: number; limit: number };
  }) {
    this.logger.debug(`ListContractConfigs: org=${request.organisationId}`);
    const result = await this.configService.listContractConfigs(
      request.organisationId,
      request.contratId,
      request.pagination,
    );
    return {
      configs: result.items.map((c) => this.mapContractConfig(c)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('DebitConfigurationService', 'DeleteContractConfig')
  async deleteContractConfig(request: { id: string }) {
    this.logger.debug(`DeleteContractConfig: id=${request.id}`);
    await this.configService.deleteContractConfig(request.id, 'system');
    return { success: true, message: 'Contract configuration deleted' };
  }

  @GrpcMethod('HolidayService', 'ListHolidays')
  async listHolidays(request: {
    holidayZoneId: string;
    year: number;
    pagination?: { page: number; limit: number };
  }) {
    this.logger.debug(`ListHolidays: zone=${request.holidayZoneId}, year=${request.year}`);

    const holidays = await this.holidaysService.getHolidaysForYear(request.holidayZoneId, request.year);

    const page = request.pagination?.page ?? 1;
    const limit = request.pagination?.limit ?? 50;
    const offset = (page - 1) * limit;
    const paginatedHolidays = holidays.slice(offset, offset + limit);

    return {
      holidays: paginatedHolidays.map((h) => ({
        id: '',
        holidayZoneId: request.holidayZoneId,
        date: h.date,
        name: h.name,
        holidayType: this.mapHolidayType(h.type),
        isRecurring: false,
        recurringMonth: 0,
        recurringDay: 0,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      })),
      pagination: {
        total: holidays.length,
        page,
        limit,
        totalPages: Math.ceil(holidays.length / limit),
      },
    };
  }

  @GrpcMethod('HolidayService', 'ListHolidayZones')
  async listHolidayZones(request: {
    organisationId: string;
    countryCode?: string;
    pagination?: { page: number; limit: number };
  }) {
    this.logger.debug(`ListHolidayZones: org=${request.organisationId}`);

    const zones = await this.holidaysService.getHolidayZonesByOrganisation(request.organisationId);

    const filteredZones = request.countryCode
      ? zones.filter((z) => z.countryCode === request.countryCode)
      : zones;

    const page = request.pagination?.page ?? 1;
    const limit = request.pagination?.limit ?? 50;
    const offset = (page - 1) * limit;
    const paginatedZones = filteredZones.slice(offset, offset + limit);

    return {
      zones: paginatedZones.map((z) => ({
        id: z.id,
        organisationId: z.organisationId,
        code: z.code,
        name: z.name,
        countryCode: z.countryCode,
        regionCode: z.regionCode ?? '',
        isActive: z.isActive,
        createdAt: z.createdAt.toISOString(),
        updatedAt: z.updatedAt.toISOString(),
      })),
      pagination: {
        total: filteredZones.length,
        page,
        limit,
        totalPages: Math.ceil(filteredZones.length / limit),
      },
    };
  }

  @GrpcMethod('HolidayService', 'CreateHolidayZone')
  async createHolidayZone(request: {
    organisationId: string;
    code: string;
    name: string;
    countryCode: string;
    regionCode?: string;
  }) {
    this.logger.debug(`CreateHolidayZone: org=${request.organisationId}, code=${request.code}`);

    const zone = await this.holidaysService.createHolidayZone(
      request.organisationId,
      request.code,
      request.name,
      request.countryCode,
      request.regionCode,
    );

    return {
      id: zone.id,
      organisationId: zone.organisationId,
      code: zone.code,
      name: zone.name,
      countryCode: zone.countryCode,
      regionCode: zone.regionCode ?? '',
      isActive: zone.isActive,
      createdAt: zone.createdAt.toISOString(),
      updatedAt: zone.updatedAt.toISOString(),
    };
  }

  @GrpcMethod('CalendarAdminService', 'ImportCsv')
  async importCsv(request: {
    organisationId: string;
    csvContent: Buffer;
    importType: string;
    dryRun: boolean;
    uploadedByUserId: string;
  }) {
    this.logger.debug(`ImportCsv: org=${request.organisationId}, type=${request.importType}, dryRun=${request.dryRun}`);

    const importTypeMap: Record<string, ImportType> = {
      COMPANY_CONFIG: 'company_config',
      CLIENT_CONFIG: 'client_config',
      CONTRACT_CONFIG: 'contract_config',
      HOLIDAYS: 'holidays',
    };

    const mappedType = importTypeMap[request.importType];
    if (!mappedType) {
      return {
        importId: '',
        success: false,
        isDryRun: request.dryRun,
        totalRows: 0,
        validRows: 0,
        errorRows: 1,
        errors: [{ rowNumber: 0, columnName: '', value: '', errorCode: 'INVALID_TYPE', errorMessage: `Invalid import type: ${request.importType}` }],
        preview: [],
      };
    }

    const result = await this.csvImportService.importCsv(
      request.organisationId,
      mappedType,
      request.csvContent.toString('utf-8'),
      request.dryRun,
      request.uploadedByUserId,
    );

    return {
      importId: result.importId,
      success: result.errorRows === 0,
      isDryRun: result.isDryRun,
      totalRows: result.totalRows,
      validRows: result.validRows,
      errorRows: result.errorRows,
      errors: result.errors.map((e) => ({
        rowNumber: e.row,
        columnName: e.column ?? '',
        value: e.value ?? '',
        errorCode: 'VALIDATION_ERROR',
        errorMessage: e.message,
      })),
      preview: [],
    };
  }

  @GrpcMethod('CalendarAdminService', 'GetAuditLogs')
  async getAuditLogs(request: {
    organisationId: string;
    entityType?: string;
    entityId?: string;
    actorUserId?: string;
    source?: number;
    startDate?: string;
    endDate?: string;
    pagination?: { page: number; limit: number };
  }) {
    this.logger.debug(`GetAuditLogs: org=${request.organisationId}`);

    const sourceMap: Record<number, AuditSource> = {
      1: AuditSource.UI,
      2: AuditSource.CSV_IMPORT,
      3: AuditSource.API,
      4: AuditSource.SYSTEM,
    };

    const page = request.pagination?.page ?? 1;
    const limit = request.pagination?.limit ?? 50;

    const result = await this.auditService.getAuditLogs({
      organisationId: request.organisationId,
      entityType: request.entityType,
      entityId: request.entityId,
      actorUserId: request.actorUserId,
      source: request.source ? sourceMap[request.source] : undefined,
      fromDate: request.startDate ? parseISO(request.startDate) : undefined,
      toDate: request.endDate ? parseISO(request.endDate) : undefined,
      limit,
      offset: (page - 1) * limit,
    });

    return {
      logs: result.logs.map((log) => ({
        id: log.id,
        organisationId: log.organisationId,
        entityType: log.entityType,
        entityId: log.entityId,
        action: log.action,
        actorUserId: log.actorUserId ?? '',
        source: this.mapAuditSourceToProto(log.source),
        beforeState: log.beforeState ? JSON.stringify(log.beforeState) : '',
        afterState: log.afterState ? JSON.stringify(log.afterState) : '',
        changeSummary: log.changeSummary ?? '',
        ipAddress: log.ipAddress ?? '',
        userAgent: log.userAgent ?? '',
        createdAt: log.createdAt.toISOString(),
      })),
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  private mapResolvedConfig(config: {
    mode: string;
    batch?: string;
    fixedDay?: number;
    shiftStrategy: string;
    holidayZoneId: string;
    appliedLevel: string;
    appliedConfigId: string;
  }) {
    const levelMap: Record<string, number> = {
      system: 1,
      company: 2,
      client: 3,
      contract: 4,
    };

    const modeMap: Record<string, number> = {
      BATCH: 1,
      FIXED_DAY: 2,
    };

    const batchMap: Record<string, number> = {
      L1: 1,
      L2: 2,
      L3: 3,
      L4: 4,
    };

    const shiftMap: Record<string, number> = {
      NEXT_BUSINESS_DAY: 1,
      PREVIOUS_BUSINESS_DAY: 2,
      NEXT_WEEK_SAME_DAY: 3,
    };

    return {
      appliedLevel: levelMap[config.appliedLevel] ?? 0,
      appliedConfigId: config.appliedConfigId,
      mode: modeMap[config.mode] ?? 0,
      batch: config.batch ? batchMap[config.batch] ?? 0 : 0,
      fixedDay: config.fixedDay ?? 0,
      shiftStrategy: shiftMap[config.shiftStrategy] ?? 0,
      holidayZoneId: config.holidayZoneId,
      cutoffConfigId: '',
    };
  }

  private mapHolidayType(type: string): number {
    const typeMap: Record<string, number> = {
      public: 1,
      PUBLIC: 1,
      bank: 2,
      BANK: 2,
      regional: 3,
      REGIONAL: 3,
      company: 4,
      COMPANY: 4,
    };
    return typeMap[type] ?? 0;
  }

  private mapAuditSourceToProto(source: AuditSource): number {
    const sourceMap: Record<AuditSource, number> = {
      [AuditSource.UI]: 1,
      [AuditSource.CSV_IMPORT]: 2,
      [AuditSource.API]: 3,
      [AuditSource.SYSTEM]: 4,
    };
    return sourceMap[source] ?? 0;
  }

  private mapProtoToMode(mode: number): DebitDateMode {
    const modeMap: Record<number, DebitDateMode> = {
      1: DebitDateMode.BATCH,
      2: DebitDateMode.FIXED_DAY,
    };
    return modeMap[mode] ?? DebitDateMode.BATCH;
  }

  private mapProtoToBatch(batch: number): DebitBatch {
    const batchMap: Record<number, DebitBatch> = {
      1: DebitBatch.L1,
      2: DebitBatch.L2,
      3: DebitBatch.L3,
      4: DebitBatch.L4,
    };
    return batchMap[batch] ?? DebitBatch.L1;
  }

  private mapProtoToShiftStrategy(strategy: number): DateShiftStrategy {
    const strategyMap: Record<number, DateShiftStrategy> = {
      1: DateShiftStrategy.NEXT_BUSINESS_DAY,
      2: DateShiftStrategy.PREVIOUS_BUSINESS_DAY,
      3: DateShiftStrategy.NEXT_WEEK_SAME_DAY,
    };
    return strategyMap[strategy] ?? DateShiftStrategy.NEXT_BUSINESS_DAY;
  }

  private mapModeToProto(mode: DebitDateMode): number {
    const modeMap: Record<DebitDateMode, number> = {
      [DebitDateMode.BATCH]: 1,
      [DebitDateMode.FIXED_DAY]: 2,
    };
    return modeMap[mode] ?? 0;
  }

  private mapBatchToProto(batch: DebitBatch | null | undefined): number {
    if (!batch) return 0;
    const batchMap: Record<DebitBatch, number> = {
      [DebitBatch.L1]: 1,
      [DebitBatch.L2]: 2,
      [DebitBatch.L3]: 3,
      [DebitBatch.L4]: 4,
    };
    return batchMap[batch] ?? 0;
  }

  private mapShiftStrategyToProto(strategy: DateShiftStrategy): number {
    const strategyMap: Record<DateShiftStrategy, number> = {
      [DateShiftStrategy.NEXT_BUSINESS_DAY]: 1,
      [DateShiftStrategy.PREVIOUS_BUSINESS_DAY]: 2,
      [DateShiftStrategy.NEXT_WEEK_SAME_DAY]: 3,
    };
    return strategyMap[strategy] ?? 0;
  }

  private mapSystemConfig(config: {
    id: string;
    organisationId: string;
    defaultMode: DebitDateMode;
    defaultBatch: DebitBatch | null;
    defaultFixedDay: number | null;
    shiftStrategy: DateShiftStrategy;
    holidayZoneId: string | null;
    cutoffConfigId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: config.id,
      organisationId: config.organisationId,
      defaultMode: this.mapModeToProto(config.defaultMode),
      defaultBatch: this.mapBatchToProto(config.defaultBatch),
      defaultFixedDay: config.defaultFixedDay ?? 0,
      shiftStrategy: this.mapShiftStrategyToProto(config.shiftStrategy),
      holidayZoneId: config.holidayZoneId ?? '',
      cutoffConfigId: config.cutoffConfigId ?? '',
      isActive: config.isActive,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  private mapCompanyConfig(config: {
    id: string;
    organisationId: string;
    societeId: string;
    mode: DebitDateMode;
    batch: DebitBatch | null;
    fixedDay: number | null;
    shiftStrategy: DateShiftStrategy;
    holidayZoneId: string | null;
    cutoffConfigId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: config.id,
      organisationId: config.organisationId,
      societeId: config.societeId,
      mode: this.mapModeToProto(config.mode),
      batch: this.mapBatchToProto(config.batch),
      fixedDay: config.fixedDay ?? 0,
      shiftStrategy: this.mapShiftStrategyToProto(config.shiftStrategy),
      holidayZoneId: config.holidayZoneId ?? '',
      cutoffConfigId: config.cutoffConfigId ?? '',
      isActive: config.isActive,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  private mapClientConfig(config: {
    id: string;
    organisationId: string;
    clientId: string;
    mode: DebitDateMode;
    batch: DebitBatch | null;
    fixedDay: number | null;
    shiftStrategy: DateShiftStrategy;
    holidayZoneId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: config.id,
      organisationId: config.organisationId,
      clientId: config.clientId,
      mode: this.mapModeToProto(config.mode),
      batch: this.mapBatchToProto(config.batch),
      fixedDay: config.fixedDay ?? 0,
      shiftStrategy: this.mapShiftStrategyToProto(config.shiftStrategy),
      holidayZoneId: config.holidayZoneId ?? '',
      isActive: config.isActive,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  private mapContractConfig(config: {
    id: string;
    organisationId: string;
    contratId: string;
    mode: DebitDateMode;
    batch: DebitBatch | null;
    fixedDay: number | null;
    shiftStrategy: DateShiftStrategy;
    holidayZoneId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: config.id,
      organisationId: config.organisationId,
      contratId: config.contratId,
      mode: this.mapModeToProto(config.mode),
      batch: this.mapBatchToProto(config.batch),
      fixedDay: config.fixedDay ?? 0,
      shiftStrategy: this.mapShiftStrategyToProto(config.shiftStrategy),
      holidayZoneId: config.holidayZoneId ?? '',
      isActive: config.isActive,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }
}
