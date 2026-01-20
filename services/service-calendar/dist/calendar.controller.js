var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CalendarController_1;
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { CalendarEngineService } from './modules/engine/calendar-engine.service.js';
import { ConfigurationResolverService } from './modules/configuration/configuration-resolver.service.js';
import { ConfigurationService } from './modules/configuration/configuration.service.js';
import { HolidaysService } from './modules/holidays/holidays.service.js';
import { AuditService } from './modules/audit/audit.service.js';
import { CsvImportService } from './modules/csv-import/csv-import.service.js';
import { AuditSource } from './modules/audit/entities/calendar-audit-log.entity.js';
import { DebitDateMode, DebitBatch, DateShiftStrategy } from './modules/configuration/entities/system-debit-configuration.entity.js';
let CalendarController = CalendarController_1 = class CalendarController {
    calendarEngine;
    configResolver;
    configService;
    holidaysService;
    auditService;
    csvImportService;
    logger = new Logger(CalendarController_1.name);
    constructor(calendarEngine, configResolver, configService, holidaysService, auditService, csvImportService) {
        this.calendarEngine = calendarEngine;
        this.configResolver = configResolver;
        this.configService = configService;
        this.holidaysService = holidaysService;
        this.auditService = auditService;
        this.csvImportService = csvImportService;
    }
    async calculatePlannedDate(request) {
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
    async calculatePlannedDatesBatch(request) {
        this.logger.debug(`CalculatePlannedDatesBatch: org=${request.organisationId}, count=${request.inputs.length}`);
        const result = await this.calendarEngine.calculateBatch(request.inputs, request.organisationId, request.targetMonth, request.targetYear);
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
    async checkDateEligibility(request) {
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
    async resolveConfiguration(request) {
        this.logger.debug(`ResolveConfiguration: org=${request.organisationId}`);
        const resolved = await this.configResolver.resolve({
            organisationId: request.organisationId,
            contratId: request.contratId,
            clientId: request.clientId,
            societeId: request.societeId,
        });
        return this.mapResolvedConfig(resolved);
    }
    async getSystemConfig(request) {
        this.logger.debug(`GetSystemConfig: org=${request.organisationId}`);
        const config = await this.configService.getSystemConfig(request.organisationId);
        if (!config) {
            return null;
        }
        return this.mapSystemConfig(config);
    }
    async updateSystemConfig(request) {
        this.logger.debug(`UpdateSystemConfig: org=${request.organisationId}`);
        const config = await this.configService.updateSystemConfig(request.organisationId, {
            defaultMode: this.mapProtoToMode(request.defaultMode),
            defaultBatch: request.defaultBatch ? this.mapProtoToBatch(request.defaultBatch) : undefined,
            defaultFixedDay: request.defaultFixedDay || undefined,
            shiftStrategy: this.mapProtoToShiftStrategy(request.shiftStrategy),
            holidayZoneId: request.holidayZoneId || undefined,
            cutoffConfigId: request.cutoffConfigId || undefined,
        }, 'system');
        return this.mapSystemConfig(config);
    }
    async createCompanyConfig(request) {
        this.logger.debug(`CreateCompanyConfig: org=${request.organisationId}, societe=${request.societeId}`);
        const config = await this.configService.createCompanyConfig(request.organisationId, request.societeId, {
            mode: this.mapProtoToMode(request.mode),
            batch: request.batch ? this.mapProtoToBatch(request.batch) : undefined,
            fixedDay: request.fixedDay || undefined,
            shiftStrategy: this.mapProtoToShiftStrategy(request.shiftStrategy),
            holidayZoneId: request.holidayZoneId || undefined,
            cutoffConfigId: request.cutoffConfigId || undefined,
        }, 'system');
        return this.mapCompanyConfig(config);
    }
    async updateCompanyConfig(request) {
        this.logger.debug(`UpdateCompanyConfig: id=${request.id}`);
        const config = await this.configService.updateCompanyConfig(request.id, {
            mode: this.mapProtoToMode(request.mode),
            batch: request.batch ? this.mapProtoToBatch(request.batch) : undefined,
            fixedDay: request.fixedDay || undefined,
            shiftStrategy: this.mapProtoToShiftStrategy(request.shiftStrategy),
            holidayZoneId: request.holidayZoneId || undefined,
            cutoffConfigId: request.cutoffConfigId || undefined,
            isActive: request.isActive,
        }, 'system');
        return this.mapCompanyConfig(config);
    }
    async getCompanyConfig(request) {
        this.logger.debug(`GetCompanyConfig: id=${request.id}`);
        const config = await this.configService.getCompanyConfig(request.id);
        if (!config) {
            return null;
        }
        return this.mapCompanyConfig(config);
    }
    async listCompanyConfigs(request) {
        this.logger.debug(`ListCompanyConfigs: org=${request.organisationId}`);
        const result = await this.configService.listCompanyConfigs(request.organisationId, request.societeId, request.pagination);
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
    async deleteCompanyConfig(request) {
        this.logger.debug(`DeleteCompanyConfig: id=${request.id}`);
        await this.configService.deleteCompanyConfig(request.id, 'system');
        return { success: true, message: 'Company configuration deleted' };
    }
    async createClientConfig(request) {
        this.logger.debug(`CreateClientConfig: org=${request.organisationId}, client=${request.clientId}`);
        const config = await this.configService.createClientConfig(request.organisationId, request.clientId, {
            mode: this.mapProtoToMode(request.mode),
            batch: request.batch ? this.mapProtoToBatch(request.batch) : undefined,
            fixedDay: request.fixedDay || undefined,
            shiftStrategy: this.mapProtoToShiftStrategy(request.shiftStrategy),
            holidayZoneId: request.holidayZoneId || undefined,
        }, 'system');
        return this.mapClientConfig(config);
    }
    async updateClientConfig(request) {
        this.logger.debug(`UpdateClientConfig: id=${request.id}`);
        const config = await this.configService.updateClientConfig(request.id, {
            mode: this.mapProtoToMode(request.mode),
            batch: request.batch ? this.mapProtoToBatch(request.batch) : undefined,
            fixedDay: request.fixedDay || undefined,
            shiftStrategy: this.mapProtoToShiftStrategy(request.shiftStrategy),
            holidayZoneId: request.holidayZoneId || undefined,
            isActive: request.isActive,
        }, 'system');
        return this.mapClientConfig(config);
    }
    async getClientConfig(request) {
        this.logger.debug(`GetClientConfig: id=${request.id}`);
        const config = await this.configService.getClientConfig(request.id);
        if (!config) {
            return null;
        }
        return this.mapClientConfig(config);
    }
    async listClientConfigs(request) {
        this.logger.debug(`ListClientConfigs: org=${request.organisationId}`);
        const result = await this.configService.listClientConfigs(request.organisationId, request.clientId, request.pagination);
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
    async deleteClientConfig(request) {
        this.logger.debug(`DeleteClientConfig: id=${request.id}`);
        await this.configService.deleteClientConfig(request.id, 'system');
        return { success: true, message: 'Client configuration deleted' };
    }
    async createContractConfig(request) {
        this.logger.debug(`CreateContractConfig: org=${request.organisationId}, contrat=${request.contratId}`);
        const config = await this.configService.createContractConfig(request.organisationId, request.contratId, {
            mode: this.mapProtoToMode(request.mode),
            batch: request.batch ? this.mapProtoToBatch(request.batch) : undefined,
            fixedDay: request.fixedDay || undefined,
            shiftStrategy: this.mapProtoToShiftStrategy(request.shiftStrategy),
            holidayZoneId: request.holidayZoneId || undefined,
        }, 'system');
        return this.mapContractConfig(config);
    }
    async updateContractConfig(request) {
        this.logger.debug(`UpdateContractConfig: id=${request.id}`);
        const config = await this.configService.updateContractConfig(request.id, {
            mode: this.mapProtoToMode(request.mode),
            batch: request.batch ? this.mapProtoToBatch(request.batch) : undefined,
            fixedDay: request.fixedDay || undefined,
            shiftStrategy: this.mapProtoToShiftStrategy(request.shiftStrategy),
            holidayZoneId: request.holidayZoneId || undefined,
            isActive: request.isActive,
        }, 'system');
        return this.mapContractConfig(config);
    }
    async getContractConfig(request) {
        this.logger.debug(`GetContractConfig: id=${request.id}`);
        const config = await this.configService.getContractConfig(request.id);
        if (!config) {
            return null;
        }
        return this.mapContractConfig(config);
    }
    async listContractConfigs(request) {
        this.logger.debug(`ListContractConfigs: org=${request.organisationId}`);
        const result = await this.configService.listContractConfigs(request.organisationId, request.contratId, request.pagination);
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
    async deleteContractConfig(request) {
        this.logger.debug(`DeleteContractConfig: id=${request.id}`);
        await this.configService.deleteContractConfig(request.id, 'system');
        return { success: true, message: 'Contract configuration deleted' };
    }
    async listHolidays(request) {
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
    async listHolidayZones(request) {
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
    async createHolidayZone(request) {
        this.logger.debug(`CreateHolidayZone: org=${request.organisationId}, code=${request.code}`);
        const zone = await this.holidaysService.createHolidayZone(request.organisationId, request.code, request.name, request.countryCode, request.regionCode);
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
    async importCsv(request) {
        this.logger.debug(`ImportCsv: org=${request.organisationId}, type=${request.importType}, dryRun=${request.dryRun}`);
        const importTypeMap = {
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
        const result = await this.csvImportService.importCsv(request.organisationId, mappedType, request.csvContent.toString('utf-8'), request.dryRun, request.uploadedByUserId);
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
    async getAuditLogs(request) {
        this.logger.debug(`GetAuditLogs: org=${request.organisationId}`);
        const sourceMap = {
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
    mapResolvedConfig(config) {
        const levelMap = {
            system: 1,
            company: 2,
            client: 3,
            contract: 4,
        };
        const modeMap = {
            BATCH: 1,
            FIXED_DAY: 2,
        };
        const batchMap = {
            L1: 1,
            L2: 2,
            L3: 3,
            L4: 4,
        };
        const shiftMap = {
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
    mapHolidayType(type) {
        const typeMap = {
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
    mapAuditSourceToProto(source) {
        const sourceMap = {
            [AuditSource.UI]: 1,
            [AuditSource.CSV_IMPORT]: 2,
            [AuditSource.API]: 3,
            [AuditSource.SYSTEM]: 4,
        };
        return sourceMap[source] ?? 0;
    }
    mapProtoToMode(mode) {
        const modeMap = {
            1: DebitDateMode.BATCH,
            2: DebitDateMode.FIXED_DAY,
        };
        return modeMap[mode] ?? DebitDateMode.BATCH;
    }
    mapProtoToBatch(batch) {
        const batchMap = {
            1: DebitBatch.L1,
            2: DebitBatch.L2,
            3: DebitBatch.L3,
            4: DebitBatch.L4,
        };
        return batchMap[batch] ?? DebitBatch.L1;
    }
    mapProtoToShiftStrategy(strategy) {
        const strategyMap = {
            1: DateShiftStrategy.NEXT_BUSINESS_DAY,
            2: DateShiftStrategy.PREVIOUS_BUSINESS_DAY,
            3: DateShiftStrategy.NEXT_WEEK_SAME_DAY,
        };
        return strategyMap[strategy] ?? DateShiftStrategy.NEXT_BUSINESS_DAY;
    }
    mapModeToProto(mode) {
        const modeMap = {
            [DebitDateMode.BATCH]: 1,
            [DebitDateMode.FIXED_DAY]: 2,
        };
        return modeMap[mode] ?? 0;
    }
    mapBatchToProto(batch) {
        if (!batch)
            return 0;
        const batchMap = {
            [DebitBatch.L1]: 1,
            [DebitBatch.L2]: 2,
            [DebitBatch.L3]: 3,
            [DebitBatch.L4]: 4,
        };
        return batchMap[batch] ?? 0;
    }
    mapShiftStrategyToProto(strategy) {
        const strategyMap = {
            [DateShiftStrategy.NEXT_BUSINESS_DAY]: 1,
            [DateShiftStrategy.PREVIOUS_BUSINESS_DAY]: 2,
            [DateShiftStrategy.NEXT_WEEK_SAME_DAY]: 3,
        };
        return strategyMap[strategy] ?? 0;
    }
    mapSystemConfig(config) {
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
    mapCompanyConfig(config) {
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
    mapClientConfig(config) {
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
    mapContractConfig(config) {
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
};
__decorate([
    GrpcMethod('CalendarEngineService', 'CalculatePlannedDate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "calculatePlannedDate", null);
__decorate([
    GrpcMethod('CalendarEngineService', 'CalculatePlannedDatesBatch'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "calculatePlannedDatesBatch", null);
__decorate([
    GrpcMethod('CalendarEngineService', 'CheckDateEligibility'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "checkDateEligibility", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'ResolveConfiguration'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "resolveConfiguration", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'GetSystemConfig'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getSystemConfig", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'UpdateSystemConfig'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "updateSystemConfig", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'CreateCompanyConfig'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "createCompanyConfig", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'UpdateCompanyConfig'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "updateCompanyConfig", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'GetCompanyConfig'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getCompanyConfig", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'ListCompanyConfigs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "listCompanyConfigs", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'DeleteCompanyConfig'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "deleteCompanyConfig", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'CreateClientConfig'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "createClientConfig", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'UpdateClientConfig'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "updateClientConfig", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'GetClientConfig'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getClientConfig", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'ListClientConfigs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "listClientConfigs", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'DeleteClientConfig'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "deleteClientConfig", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'CreateContractConfig'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "createContractConfig", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'UpdateContractConfig'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "updateContractConfig", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'GetContractConfig'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getContractConfig", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'ListContractConfigs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "listContractConfigs", null);
__decorate([
    GrpcMethod('DebitConfigurationService', 'DeleteContractConfig'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "deleteContractConfig", null);
__decorate([
    GrpcMethod('HolidayService', 'ListHolidays'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "listHolidays", null);
__decorate([
    GrpcMethod('HolidayService', 'ListHolidayZones'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "listHolidayZones", null);
__decorate([
    GrpcMethod('HolidayService', 'CreateHolidayZone'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "createHolidayZone", null);
__decorate([
    GrpcMethod('CalendarAdminService', 'ImportCsv'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "importCsv", null);
__decorate([
    GrpcMethod('CalendarAdminService', 'GetAuditLogs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getAuditLogs", null);
CalendarController = CalendarController_1 = __decorate([
    Controller(),
    __metadata("design:paramtypes", [CalendarEngineService,
        ConfigurationResolverService,
        ConfigurationService,
        HolidaysService,
        AuditService,
        CsvImportService])
], CalendarController);
export { CalendarController };
//# sourceMappingURL=calendar.controller.js.map