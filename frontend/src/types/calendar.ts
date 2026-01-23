"use client";

export enum DebitBatch {
  UNSPECIFIED = 0,
  L1 = 1,
  L2 = 2,
  L3 = 3,
  L4 = 4,
}

export const DebitBatchLabels: Record<DebitBatch, string> = {
  [DebitBatch.UNSPECIFIED]: "Non spécifié",
  [DebitBatch.L1]: "Lot 1 (Jours 1-7)",
  [DebitBatch.L2]: "Lot 2 (Jours 8-14)",
  [DebitBatch.L3]: "Lot 3 (Jours 15-21)",
  [DebitBatch.L4]: "Lot 4 (Jours 22-fin)",
};

export const DebitBatchShortLabels: Record<DebitBatch, string> = {
  [DebitBatch.UNSPECIFIED]: "-",
  [DebitBatch.L1]: "L1",
  [DebitBatch.L2]: "L2",
  [DebitBatch.L3]: "L3",
  [DebitBatch.L4]: "L4",
};

export enum DebitDateMode {
  UNSPECIFIED = 0,
  BATCH = 1,
  FIXED_DAY = 2,
}

export const DebitDateModeLabels: Record<DebitDateMode, string> = {
  [DebitDateMode.UNSPECIFIED]: "Non spécifié",
  [DebitDateMode.BATCH]: "Par lot (L1-L4)",
  [DebitDateMode.FIXED_DAY]: "Jour fixe",
};

export enum DateShiftStrategy {
  UNSPECIFIED = 0,
  NEXT_BUSINESS_DAY = 1,
  PREVIOUS_BUSINESS_DAY = 2,
  NEXT_WEEK_SAME_DAY = 3,
}

export const DateShiftStrategyLabels: Record<DateShiftStrategy, string> = {
  [DateShiftStrategy.UNSPECIFIED]: "Non spécifié",
  [DateShiftStrategy.NEXT_BUSINESS_DAY]: "Prochain jour ouvré",
  [DateShiftStrategy.PREVIOUS_BUSINESS_DAY]: "Jour ouvré précédent",
  [DateShiftStrategy.NEXT_WEEK_SAME_DAY]: "Semaine suivante, même jour",
};

export enum ConfigurationLevel {
  UNSPECIFIED = 0,
  SYSTEM_DEFAULT = 1,
  COMPANY = 2,
  CLIENT = 3,
  CONTRACT = 4,
}

export const ConfigurationLevelLabels: Record<ConfigurationLevel, string> = {
  [ConfigurationLevel.UNSPECIFIED]: "Non spécifié",
  [ConfigurationLevel.SYSTEM_DEFAULT]: "Défaut système",
  [ConfigurationLevel.COMPANY]: "Société",
  [ConfigurationLevel.CLIENT]: "Client",
  [ConfigurationLevel.CONTRACT]: "Contrat",
};

export enum PlannedDateStatus {
  UNSPECIFIED = 0,
  PLANNED = 1,
  CONFIRMED = 2,
  PROCESSING = 3,
  EXECUTED = 4,
  FAILED = 5,
  CANCELLED = 6,
}

export const PlannedDateStatusLabels: Record<PlannedDateStatus, string> = {
  [PlannedDateStatus.UNSPECIFIED]: "Non spécifié",
  [PlannedDateStatus.PLANNED]: "Planifié",
  [PlannedDateStatus.CONFIRMED]: "Confirmé",
  [PlannedDateStatus.PROCESSING]: "En cours",
  [PlannedDateStatus.EXECUTED]: "Exécuté",
  [PlannedDateStatus.FAILED]: "Échoué",
  [PlannedDateStatus.CANCELLED]: "Annulé",
};

export const PlannedDateStatusColors: Record<PlannedDateStatus, string> = {
  [PlannedDateStatus.UNSPECIFIED]: "default",
  [PlannedDateStatus.PLANNED]: "secondary",
  [PlannedDateStatus.CONFIRMED]: "default",
  [PlannedDateStatus.PROCESSING]: "default",
  [PlannedDateStatus.EXECUTED]: "default",
  [PlannedDateStatus.FAILED]: "destructive",
  [PlannedDateStatus.CANCELLED]: "outline",
};

export enum HolidayType {
  UNSPECIFIED = 0,
  PUBLIC = 1,
  BANK = 2,
  REGIONAL = 3,
  COMPANY = 4,
}

export const HolidayTypeLabels: Record<HolidayType, string> = {
  [HolidayType.UNSPECIFIED]: "Non spécifié",
  [HolidayType.PUBLIC]: "Jour férié légal",
  [HolidayType.BANK]: "Fermeture bancaire",
  [HolidayType.REGIONAL]: "Férié régional",
  [HolidayType.COMPANY]: "Fermeture société",
};

export enum AuditSource {
  UNSPECIFIED = 0,
  UI = 1,
  CSV_IMPORT = 2,
  API = 3,
  SYSTEM = 4,
}

export const AuditSourceLabels: Record<AuditSource, string> = {
  [AuditSource.UNSPECIFIED]: "Non spécifié",
  [AuditSource.UI]: "Interface admin",
  [AuditSource.CSV_IMPORT]: "Import CSV",
  [AuditSource.API]: "API",
  [AuditSource.SYSTEM]: "Système",
};

export interface HolidayZoneDto {
  id: string;
  organisationId: string;
  code: string;
  name: string;
  countryCode: string;
  regionCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HolidayDto {
  id: string;
  holidayZoneId: string;
  date: string;
  name: string;
  holidayType: HolidayType;
  isRecurring: boolean;
  recurringMonth?: number;
  recurringDay?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemDebitConfigDto {
  id: string;
  organisationId: string;
  defaultMode: DebitDateMode;
  defaultBatch: DebitBatch;
  defaultFixedDay: number;
  shiftStrategy: DateShiftStrategy;
  holidayZoneId: string;
  cutoffConfigId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDebitConfigDto {
  id: string;
  organisationId: string;
  societeId: string;
  mode: DebitDateMode;
  batch: DebitBatch;
  fixedDay: number;
  shiftStrategy: DateShiftStrategy;
  holidayZoneId: string;
  cutoffConfigId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDebitConfigDto {
  id: string;
  organisationId: string;
  clientId: string;
  mode: DebitDateMode;
  batch: DebitBatch;
  fixedDay: number;
  shiftStrategy: DateShiftStrategy;
  holidayZoneId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContractDebitConfigDto {
  id: string;
  organisationId: string;
  contratId: string;
  mode: DebitDateMode;
  batch: DebitBatch;
  fixedDay: number;
  shiftStrategy: DateShiftStrategy;
  holidayZoneId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedDebitConfigDto {
  appliedLevel: ConfigurationLevel;
  appliedConfigId: string;
  mode: DebitDateMode;
  batch: DebitBatch;
  fixedDay: number;
  shiftStrategy: DateShiftStrategy;
  holidayZoneId: string;
  cutoffConfigId: string;
}

export interface PlannedDateResultDto {
  plannedDebitDate: string;
  originalTargetDate: string;
  wasShifted: boolean;
  shiftReason?: string;
  resolvedConfig: ResolvedDebitConfigDto;
}

export interface DateEligibilityDto {
  isEligible: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  nextEligibleDate: string;
  previousEligibleDate: string;
}

export interface CalendarDayDto {
  date: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isEligible: boolean;
  debits: PlannedDebitSummaryDto[];
}

export interface PlannedDebitSummaryDto {
  id: string;
  contratId: string;
  clientName: string;
  amountCents: number;
  currency: string;
  status: PlannedDateStatus;
  batch: DebitBatch;
}

export interface HeatmapCellDto {
  date: string;
  dayOfWeek: number;
  weekOfMonth: number;
  transactionCount: number;
  totalAmountCents: number;
  currency: string;
  intensityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  exceedsThreshold: boolean;
}

export interface VolumeThresholdDto {
  id: string;
  organisationId: string;
  societeId?: string;
  maxTransactionCount: number;
  maxAmountCents: number;
  currency: string;
  alertOnExceed: boolean;
  alertEmail?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarAuditLogDto {
  id: string;
  organisationId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorUserId: string;
  source: AuditSource;
  beforeState?: string;
  afterState?: string;
  changeSummary: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface CsvImportPreviewDto {
  rowNumber: number;
  action: "CREATE" | "UPDATE" | "SKIP";
  entityType: string;
  entityId?: string;
  data: Record<string, string>;
  changeSummary: string;
}

export interface CsvValidationErrorDto {
  rowNumber: number;
  columnName: string;
  value: string;
  errorCode: string;
  errorMessage: string;
}

export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
