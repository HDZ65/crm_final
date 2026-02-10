// Apporteurs
export { useApporteurs, useApporteur } from './use-apporteurs'

// Statuts Commission
export { useStatutsCommission, useStatutCommission } from './use-statuts-commission'

// Commissions
export {
  useCommissions,
  useCommissionsWithDetails,
  useCommission,
  useCommissionWithDetails,
  useCommissionsSummary,
} from './use-commissions'

// Barèmes Commission
export {
  useBaremesCommission,
  useBaremeApplicable,
  useBaremeByCode,
  useBaremeCommission,
} from './use-baremes-commission'

// Paliers Commission
export {
  usePaliersCommission,
  usePalierApplicable,
  usePalierCommission,
} from './use-paliers-commission'

// Reprises Commission
export {
  useReprisesCommission,
  useRepriseCommission,
  useReprisesEnAttente,
} from './use-reprises-commission'

// Bordereaux Commission
export {
  useBordereauxCommission,
  useBordereauxWithDetails,
  useBordereauCommission,
} from './use-bordereaux-commission'

// Lignes Bordereau
export {
  useLignesBordereau,
  useLigneBordereau,
  useLignesSelectionnees,
  usePreselectionnerLignes,
  useRecalculerTotaux,
} from './use-lignes-bordereau'

// Commission Engine
export {
  useCalculerCommission,
  useGenererBordereau,
  useDeclencherReprise,
  useCommissionEngine,
} from './use-commission-engine'

// Commission Mutations
export {
  useCreateApporteur,
  useUpdateApporteur,
  useToggleApporteurActif,
  useAnnulerReprise,
  useValiderBordereau,
  useExportBordereauPDF,
  useExportBordereauExcel,
  useDeselectionnerCommission,
  useCommissionMutations,
  // Barèmes
  useCreateBareme,
  useUpdateBareme,
  useToggleBaremeActif,
  useDeleteBareme,
  // Paliers
  useCreatePalier,
  useUpdatePalier,
  useDeletePalier,
} from './use-commission-mutations'

// Display types re-exported for convenience
export type {
  AnnulerRepriseDto,
  ValiderBordereauDto,
} from '@/lib/ui/display-types/commission'

// Proto request types re-exported for convenience
export type {
  CreateApporteurRequest,
  UpdateApporteurRequest,
} from '@proto/commerciaux/commerciaux'

export type {
  CreateBaremeRequest,
  UpdateBaremeRequest,
  CreatePalierRequest,
  UpdatePalierRequest,
} from '@proto/commission/commission'

// Contestations Commission
export {
  useContestations,
  useCreerContestation,
  useResoudreContestation,
} from './use-contestations-commission'

export type {
  ContestationFilters,
  CreerContestationPayload,
  ResoudreContestationPayload,
} from './use-contestations-commission'

// Audit Logs Commission
export {
  useAuditLogs,
  useAuditLogsByCommission,
} from './use-audit-logs-commission'

export type {
  AuditLogDisplay,
  AuditLogFilters,
} from './use-audit-logs-commission'

// Recurrences Commission
export {
  useRecurrences,
  useRecurrencesByContrat,
} from './use-recurrences-commission'

export type {
  RecurrenceDisplay,
  RecurrenceFilters,
} from './use-recurrences-commission'

// Reports Negatifs Commission
export {
  useReportsNegatifs,
} from './use-reports-negatifs-commission'

export type {
  ReportNegatifDisplay,
  ReportsNegatifsFilters,
} from './use-reports-negatifs-commission'

// Commission Config
export {
  useCommissionConfig,
  useTypesApporteur,
  useTypesProduit,
  useTypesReprise,
  useTypesCalcul,
  useTypesBase,
} from './use-commission-config'

export type {
  TypeOption,
  DureeOption,
  CommissionConfigResponseDto,
} from './use-commission-config'
