import {
  AuditSource,
  ConfigurationLevel,
  DateShiftStrategy,
  DebitBatch,
  DebitDateMode,
  HolidayType,
  PlannedDateStatus,
} from "@proto/calendar/calendar";

export const DebitBatchLabels: Record<DebitBatch, string> = {
  [DebitBatch.DEBIT_BATCH_UNSPECIFIED]: "Non spécifié",
  [DebitBatch.DEBIT_BATCH_L1]: "Lot 1 (Jours 1-7)",
  [DebitBatch.DEBIT_BATCH_L2]: "Lot 2 (Jours 8-14)",
  [DebitBatch.DEBIT_BATCH_L3]: "Lot 3 (Jours 15-21)",
  [DebitBatch.DEBIT_BATCH_L4]: "Lot 4 (Jours 22-fin)",
  [DebitBatch.UNRECOGNIZED]: "Non spécifié",
};

export const DebitBatchShortLabels: Record<DebitBatch, string> = {
  [DebitBatch.DEBIT_BATCH_UNSPECIFIED]: "-",
  [DebitBatch.DEBIT_BATCH_L1]: "L1",
  [DebitBatch.DEBIT_BATCH_L2]: "L2",
  [DebitBatch.DEBIT_BATCH_L3]: "L3",
  [DebitBatch.DEBIT_BATCH_L4]: "L4",
  [DebitBatch.UNRECOGNIZED]: "-",
};

export const DebitDateModeLabels: Record<DebitDateMode, string> = {
  [DebitDateMode.DEBIT_DATE_MODE_UNSPECIFIED]: "Non spécifié",
  [DebitDateMode.DEBIT_DATE_MODE_BATCH]: "Par lot (L1-L4)",
  [DebitDateMode.DEBIT_DATE_MODE_FIXED_DAY]: "Jour fixe",
  [DebitDateMode.UNRECOGNIZED]: "Non spécifié",
};

export const DateShiftStrategyLabels: Record<DateShiftStrategy, string> = {
  [DateShiftStrategy.DATE_SHIFT_STRATEGY_UNSPECIFIED]: "Non spécifié",
  [DateShiftStrategy.DATE_SHIFT_STRATEGY_NEXT_BUSINESS_DAY]: "Prochain jour ouvré",
  [DateShiftStrategy.DATE_SHIFT_STRATEGY_PREVIOUS_BUSINESS_DAY]: "Jour ouvré précédent",
  [DateShiftStrategy.DATE_SHIFT_STRATEGY_NEXT_WEEK_SAME_DAY]: "Semaine suivante, même jour",
  [DateShiftStrategy.UNRECOGNIZED]: "Non spécifié",
};

export const ConfigurationLevelLabels: Record<ConfigurationLevel, string> = {
  [ConfigurationLevel.CONFIGURATION_LEVEL_UNSPECIFIED]: "Non spécifié",
  [ConfigurationLevel.CONFIGURATION_LEVEL_SYSTEM_DEFAULT]: "Défaut système",
  [ConfigurationLevel.CONFIGURATION_LEVEL_COMPANY]: "Société",
  [ConfigurationLevel.CONFIGURATION_LEVEL_CLIENT]: "Client",
  [ConfigurationLevel.CONFIGURATION_LEVEL_CONTRACT]: "Contrat",
  [ConfigurationLevel.UNRECOGNIZED]: "Non spécifié",
};

export const PlannedDateStatusLabels: Record<PlannedDateStatus, string> = {
  [PlannedDateStatus.PLANNED_DATE_STATUS_UNSPECIFIED]: "Non spécifié",
  [PlannedDateStatus.PLANNED_DATE_STATUS_PLANNED]: "Planifié",
  [PlannedDateStatus.PLANNED_DATE_STATUS_CONFIRMED]: "Confirmé",
  [PlannedDateStatus.PLANNED_DATE_STATUS_PROCESSING]: "En cours",
  [PlannedDateStatus.PLANNED_DATE_STATUS_EXECUTED]: "Exécuté",
  [PlannedDateStatus.PLANNED_DATE_STATUS_FAILED]: "Échoué",
  [PlannedDateStatus.PLANNED_DATE_STATUS_CANCELLED]: "Annulé",
  [PlannedDateStatus.UNRECOGNIZED]: "Non spécifié",
};

export const PlannedDateStatusColors: Record<PlannedDateStatus, string> = {
  [PlannedDateStatus.PLANNED_DATE_STATUS_UNSPECIFIED]: "default",
  [PlannedDateStatus.PLANNED_DATE_STATUS_PLANNED]: "secondary",
  [PlannedDateStatus.PLANNED_DATE_STATUS_CONFIRMED]: "default",
  [PlannedDateStatus.PLANNED_DATE_STATUS_PROCESSING]: "default",
  [PlannedDateStatus.PLANNED_DATE_STATUS_EXECUTED]: "default",
  [PlannedDateStatus.PLANNED_DATE_STATUS_FAILED]: "destructive",
  [PlannedDateStatus.PLANNED_DATE_STATUS_CANCELLED]: "outline",
  [PlannedDateStatus.UNRECOGNIZED]: "default",
};

export const HolidayTypeLabels: Record<HolidayType, string> = {
  [HolidayType.HOLIDAY_TYPE_UNSPECIFIED]: "Non spécifié",
  [HolidayType.HOLIDAY_TYPE_PUBLIC]: "Jour férié légal",
  [HolidayType.HOLIDAY_TYPE_BANK]: "Fermeture bancaire",
  [HolidayType.HOLIDAY_TYPE_REGIONAL]: "Férié régional",
  [HolidayType.HOLIDAY_TYPE_COMPANY]: "Fermeture société",
  [HolidayType.UNRECOGNIZED]: "Non spécifié",
};

export const AuditSourceLabels: Record<AuditSource, string> = {
  [AuditSource.AUDIT_SOURCE_UNSPECIFIED]: "Non spécifié",
  [AuditSource.AUDIT_SOURCE_UI]: "Interface admin",
  [AuditSource.AUDIT_SOURCE_CSV_IMPORT]: "Import CSV",
  [AuditSource.AUDIT_SOURCE_API]: "API",
  [AuditSource.AUDIT_SOURCE_SYSTEM]: "Système",
  [AuditSource.UNRECOGNIZED]: "Non spécifié",
};
