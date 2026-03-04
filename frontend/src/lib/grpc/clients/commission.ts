import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import { CommissionCrudServiceService } from "@proto/commission/commission-crud";
import { CommissionBordereauServiceService } from "@proto/commission/commission-bordereau";
import { CommissionCalculationServiceService } from "@proto/commission/commission-calculation";
import { CommissionContestationServiceService } from "@proto/commission/commission-contestation";
import { CommissionValidationServiceService } from "@proto/commission/commission-validation";
import { CommissionDashboardServiceService } from "@proto/commission/commission-dashboard";
import {
  CommissionServiceService,
  type GetByIdRequest as CommissionGetByIdRequest,
  type GetCommissionsRequest,
  type CreateCommissionRequest,
  type UpdateCommissionRequest,
  type CommissionResponse,
  type CommissionListResponse,
  type DeleteResponse as CommissionDeleteResponse,
  type GetBordereauxRequest,
  type CreateBordereauRequest,
  type UpdateBordereauRequest,
  type ValidateBordereauRequest,
  type BordereauResponse,
  type BordereauListResponse,
  type ExportBordereauResponse,
  type GetReprisesRequest,
  type CreateRepriseRequest,
  type ApplyRepriseRequest,
  type RepriseResponse,
  type RepriseListResponse,
  type GetStatutsRequest as GetStatutsCommissionRequest,
  type StatutListResponse as StatutCommissionListResponse,
  type CalculerCommissionRequest,
  type CalculerCommissionResponse,
  type GenererBordereauRequest,
  type GenererBordereauResponse,
  type DeclencherRepriseRequest,
  type GetBaremesRequest,
  type CreateBaremeRequest,
  type UpdateBaremeRequest,
  type GetBaremeApplicableRequest,
  type BaremeResponse,
  type BaremeListResponse,
  type GetByBaremeRequest,
  type CreatePalierRequest,
  type UpdatePalierRequest,
  type PalierResponse,
  type PalierListResponse,
  type GetAuditLogsRequest as CommissionGetAuditLogsRequest,
  type GetAuditLogsByRefRequest as CommissionGetAuditLogsByRefRequest,
  type GetByCommissionRequest as CommissionGetByCommissionRequest,
  type AuditLogListResponse as CommissionAuditLogListResponse,
  type GetRecurrencesRequest as CommissionGetRecurrencesRequest,
  type GetRecurrencesByContratRequest as CommissionGetRecurrencesByContratRequest,
  type RecurrenceListResponse as CommissionRecurrenceListResponse,
  type GetReportsNegatifsRequest as CommissionGetReportsNegatifsRequest,
  type ReportNegatifListResponse as CommissionReportNegatifListResponse,
  type CreerContestationRequest,
  type GetContestationsRequest,
  type GetContestationsResponse,
  type ResoudreContestationRequest,
  type ContestationResponse,
  type PreselectionRequest,
  type PreselectionResponse,
  type RecalculerTotauxRequest,
  type TotauxResponse,
  type ValiderBordereauFinalRequest,
  type ValiderBordereauFinalResponse,
  type GetLignesForValidationRequest,
  type GetLignesForValidationResponse,
  // Additional types for split clients
  type GetByApporteurRequest,
  type GetByPeriodeRequest,
  type CreateStatutRequest,
  type UpdateStatutRequest,
  type StatutResponse,
  type GetStatutByCodeRequest,
  type CreateLigneBordereauRequest,
  type UpdateLigneBordereauRequest,
  type LigneBordereauResponse,
  type LigneBordereauListResponse,
  type ValidateLigneRequest,
  type GetByBordereauRequest,
  type ExportBordereauRequest,
  type GetBordereauByApporteurPeriodeRequest,
  type GetDashboardKpiRequest,
  type GetDashboardKpiResponse,
  type GenererSnapshotKpiRequest,
  type GenererSnapshotKpiResponse,
  type GetComparatifsRequest,
  type GetComparatifsResponse,
  type ExportAnalytiqueRequest,
  type ExportAnalytiqueResponse,
} from "@proto/commission/commission";

// ============================================
// MONOLITH CLIENT (backward compat)
// ============================================

let commissionInstance: GrpcClient | null = null;

function getCommissionClient(): GrpcClient {
  if (!commissionInstance) {
    commissionInstance = makeClient(
      CommissionServiceService,
      "CommissionService",
      SERVICES.commission,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return commissionInstance;
}

export const commissions = {
  create: (request: CreateCommissionRequest): Promise<CommissionResponse> =>
    promisify<CreateCommissionRequest, CommissionResponse>(
      getCommissionClient(),
      "createCommission"
    )(request),

  get: (request: CommissionGetByIdRequest): Promise<CommissionResponse> =>
    promisify<CommissionGetByIdRequest, CommissionResponse>(
      getCommissionClient(),
      "getCommission"
    )(request),

  list: (request: GetCommissionsRequest): Promise<CommissionListResponse> =>
    promisify<GetCommissionsRequest, CommissionListResponse>(
      getCommissionClient(),
      "getCommissions"
    )(request),

  update: (request: UpdateCommissionRequest): Promise<CommissionResponse> =>
    promisify<UpdateCommissionRequest, CommissionResponse>(
      getCommissionClient(),
      "updateCommission"
    )(request),

  delete: (request: CommissionGetByIdRequest): Promise<CommissionDeleteResponse> =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(
      getCommissionClient(),
      "deleteCommission"
    )(request),

  getStatuts: (request: GetStatutsCommissionRequest): Promise<StatutCommissionListResponse> =>
    promisify<GetStatutsCommissionRequest, StatutCommissionListResponse>(
      getCommissionClient(),
      "getStatuts"
    )(request),

  calculer: (request: CalculerCommissionRequest): Promise<CalculerCommissionResponse> =>
    promisify<CalculerCommissionRequest, CalculerCommissionResponse>(
      getCommissionClient(),
      "calculerCommission"
    )(request),

  genererBordereau: (request: GenererBordereauRequest): Promise<GenererBordereauResponse> =>
    promisify<GenererBordereauRequest, GenererBordereauResponse>(
      getCommissionClient(),
      "genererBordereau"
    )(request),

  declencherReprise: (request: DeclencherRepriseRequest): Promise<RepriseResponse> =>
    promisify<DeclencherRepriseRequest, RepriseResponse>(
      getCommissionClient(),
      "declencherReprise"
    )(request),

  getAuditLogs: (request: CommissionGetAuditLogsRequest): Promise<CommissionAuditLogListResponse> =>
    promisify<CommissionGetAuditLogsRequest, CommissionAuditLogListResponse>(
      getCommissionClient(),
      "getAuditLogs"
    )(request),

  getAuditLogsByRef: (request: CommissionGetAuditLogsByRefRequest): Promise<CommissionAuditLogListResponse> =>
    promisify<CommissionGetAuditLogsByRefRequest, CommissionAuditLogListResponse>(
      getCommissionClient(),
      "getAuditLogsByRef"
    )(request),

  getAuditLogsByCommission: (request: CommissionGetByCommissionRequest): Promise<CommissionAuditLogListResponse> =>
    promisify<CommissionGetByCommissionRequest, CommissionAuditLogListResponse>(
      getCommissionClient(),
      "getAuditLogsByCommission"
    )(request),

  getRecurrences: (request: CommissionGetRecurrencesRequest): Promise<CommissionRecurrenceListResponse> =>
    promisify<CommissionGetRecurrencesRequest, CommissionRecurrenceListResponse>(
      getCommissionClient(),
      "getRecurrences"
    )(request),

  getRecurrencesByContrat: (request: CommissionGetRecurrencesByContratRequest): Promise<CommissionRecurrenceListResponse> =>
    promisify<CommissionGetRecurrencesByContratRequest, CommissionRecurrenceListResponse>(
      getCommissionClient(),
      "getRecurrencesByContrat"
    )(request),

  getReportsNegatifs: (request: CommissionGetReportsNegatifsRequest): Promise<CommissionReportNegatifListResponse> =>
    promisify<CommissionGetReportsNegatifsRequest, CommissionReportNegatifListResponse>(
      getCommissionClient(),
      "getReportsNegatifs"
    )(request),

  creerContestation: (request: CreerContestationRequest): Promise<ContestationResponse> =>
    promisify<CreerContestationRequest, ContestationResponse>(
      getCommissionClient(),
      "creerContestation"
    )(request),

  getContestations: (request: GetContestationsRequest): Promise<GetContestationsResponse> =>
    promisify<GetContestationsRequest, GetContestationsResponse>(
      getCommissionClient(),
      "getContestations"
    )(request),

  resoudreContestation: (request: ResoudreContestationRequest): Promise<ContestationResponse> =>
    promisify<ResoudreContestationRequest, ContestationResponse>(
      getCommissionClient(),
      "resoudreContestation"
    )(request),

  preselectionnerLignes: (request: PreselectionRequest): Promise<PreselectionResponse> =>
    promisify<PreselectionRequest, PreselectionResponse>(
      getCommissionClient(),
      "preselectionnerLignes"
    )(request),

  recalculerTotauxBordereau: (request: RecalculerTotauxRequest): Promise<TotauxResponse> =>
    promisify<RecalculerTotauxRequest, TotauxResponse>(
      getCommissionClient(),
      "recalculerTotauxBordereau"
    )(request),

  validerBordereauFinal: (request: ValiderBordereauFinalRequest): Promise<ValiderBordereauFinalResponse> =>
    promisify<ValiderBordereauFinalRequest, ValiderBordereauFinalResponse>(
      getCommissionClient(),
      "validerBordereauFinal"
    )(request),

  getLignesForValidation: (request: GetLignesForValidationRequest): Promise<GetLignesForValidationResponse> =>
    promisify<GetLignesForValidationRequest, GetLignesForValidationResponse>(
      getCommissionClient(),
      "getLignesForValidation"
    )(request),
};

export const bordereaux = {
  create: (request: CreateBordereauRequest): Promise<BordereauResponse> =>
    promisify<CreateBordereauRequest, BordereauResponse>(
      getCommissionClient(),
      "createBordereau"
    )(request),

  get: (request: CommissionGetByIdRequest): Promise<BordereauResponse> =>
    promisify<CommissionGetByIdRequest, BordereauResponse>(
      getCommissionClient(),
      "getBordereau"
    )(request),

  list: (request: GetBordereauxRequest): Promise<BordereauListResponse> =>
    promisify<GetBordereauxRequest, BordereauListResponse>(
      getCommissionClient(),
      "getBordereaux"
    )(request),

  update: (request: UpdateBordereauRequest): Promise<BordereauResponse> =>
    promisify<UpdateBordereauRequest, BordereauResponse>(
      getCommissionClient(),
      "updateBordereau"
    )(request),

  validate: (request: ValidateBordereauRequest): Promise<BordereauResponse> =>
    promisify<ValidateBordereauRequest, BordereauResponse>(
      getCommissionClient(),
      "validateBordereau"
    )(request),

  export: (request: CommissionGetByIdRequest): Promise<ExportBordereauResponse> =>
    promisify<CommissionGetByIdRequest, ExportBordereauResponse>(
      getCommissionClient(),
      "exportBordereau"
    )(request),

  delete: (request: CommissionGetByIdRequest): Promise<CommissionDeleteResponse> =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(
      getCommissionClient(),
      "deleteBordereau"
    )(request),
};

export const reprises = {
  create: (request: CreateRepriseRequest): Promise<RepriseResponse> =>
    promisify<CreateRepriseRequest, RepriseResponse>(
      getCommissionClient(),
      "createReprise"
    )(request),

  get: (request: CommissionGetByIdRequest): Promise<RepriseResponse> =>
    promisify<CommissionGetByIdRequest, RepriseResponse>(
      getCommissionClient(),
      "getReprise"
    )(request),

  list: (request: GetReprisesRequest): Promise<RepriseListResponse> =>
    promisify<GetReprisesRequest, RepriseListResponse>(
      getCommissionClient(),
      "getReprises"
    )(request),

  apply: (request: ApplyRepriseRequest): Promise<RepriseResponse> =>
    promisify<ApplyRepriseRequest, RepriseResponse>(
      getCommissionClient(),
      "applyReprise"
    )(request),

  cancel: (request: CommissionGetByIdRequest): Promise<RepriseResponse> =>
    promisify<CommissionGetByIdRequest, RepriseResponse>(
      getCommissionClient(),
      "cancelReprise"
    )(request),

  delete: (request: CommissionGetByIdRequest): Promise<CommissionDeleteResponse> =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(
      getCommissionClient(),
      "deleteReprise"
    )(request),
};

export const baremes = {
  create: (request: CreateBaremeRequest): Promise<BaremeResponse> =>
    promisify<CreateBaremeRequest, BaremeResponse>(
      getCommissionClient(),
      "createBareme"
    )(request),

  get: (request: CommissionGetByIdRequest): Promise<BaremeResponse> =>
    promisify<CommissionGetByIdRequest, BaremeResponse>(
      getCommissionClient(),
      "getBareme"
    )(request),

  list: (request: GetBaremesRequest): Promise<BaremeListResponse> =>
    promisify<GetBaremesRequest, BaremeListResponse>(
      getCommissionClient(),
      "getBaremes"
    )(request),

  getApplicable: (request: GetBaremeApplicableRequest): Promise<BaremeResponse> =>
    promisify<GetBaremeApplicableRequest, BaremeResponse>(
      getCommissionClient(),
      "getBaremeApplicable"
    )(request),

  update: (request: UpdateBaremeRequest): Promise<BaremeResponse> =>
    promisify<UpdateBaremeRequest, BaremeResponse>(
      getCommissionClient(),
      "updateBareme"
    )(request),

  delete: (request: CommissionGetByIdRequest): Promise<CommissionDeleteResponse> =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(
      getCommissionClient(),
      "deleteBareme"
    )(request),
};

export const paliers = {
  create: (request: CreatePalierRequest): Promise<PalierResponse> =>
    promisify<CreatePalierRequest, PalierResponse>(
      getCommissionClient(),
      "createPalier"
    )(request),

  get: (request: CommissionGetByIdRequest): Promise<PalierResponse> =>
    promisify<CommissionGetByIdRequest, PalierResponse>(
      getCommissionClient(),
      "getPalier"
    )(request),

  listByBareme: (request: GetByBaremeRequest): Promise<PalierListResponse> =>
    promisify<GetByBaremeRequest, PalierListResponse>(
      getCommissionClient(),
      "getPaliersByBareme"
    )(request),

  update: (request: UpdatePalierRequest): Promise<PalierResponse> =>
    promisify<UpdatePalierRequest, PalierResponse>(
      getCommissionClient(),
      "updatePalier"
    )(request),

  delete: (request: CommissionGetByIdRequest): Promise<CommissionDeleteResponse> =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(
      getCommissionClient(),
      "deletePalier"
    )(request),
};

// ============================================
// SPLIT CLIENTS (route to specific services)
// ============================================

// ----- CommissionCrud -----
let crudInstance: GrpcClient | null = null;
function getCrudClient(): GrpcClient {
  if (!crudInstance) {
    crudInstance = makeClient(
      CommissionCrudServiceService,
      "CommissionCrudService",
      SERVICES.commission,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return crudInstance;
}

export const commissionCrud = {
  createCommission: (request: CreateCommissionRequest) =>
    promisify<CreateCommissionRequest, CommissionResponse>(getCrudClient(), "createCommission")(request),
  getCommission: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, CommissionResponse>(getCrudClient(), "getCommission")(request),
  getCommissions: (request: GetCommissionsRequest) =>
    promisify<GetCommissionsRequest, CommissionListResponse>(getCrudClient(), "getCommissions")(request),
  getCommissionsByApporteur: (request: GetByApporteurRequest) =>
    promisify<GetByApporteurRequest, CommissionListResponse>(getCrudClient(), "getCommissionsByApporteur")(request),
  getCommissionsByPeriode: (request: GetByPeriodeRequest) =>
    promisify<GetByPeriodeRequest, CommissionListResponse>(getCrudClient(), "getCommissionsByPeriode")(request),
  updateCommission: (request: UpdateCommissionRequest) =>
    promisify<UpdateCommissionRequest, CommissionResponse>(getCrudClient(), "updateCommission")(request),
  deleteCommission: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(getCrudClient(), "deleteCommission")(request),
  createBareme: (request: CreateBaremeRequest) =>
    promisify<CreateBaremeRequest, BaremeResponse>(getCrudClient(), "createBareme")(request),
  getBareme: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, BaremeResponse>(getCrudClient(), "getBareme")(request),
  getBaremes: (request: GetBaremesRequest) =>
    promisify<GetBaremesRequest, BaremeListResponse>(getCrudClient(), "getBaremes")(request),
  getBaremeApplicable: (request: GetBaremeApplicableRequest) =>
    promisify<GetBaremeApplicableRequest, BaremeResponse>(getCrudClient(), "getBaremeApplicable")(request),
  updateBareme: (request: UpdateBaremeRequest) =>
    promisify<UpdateBaremeRequest, BaremeResponse>(getCrudClient(), "updateBareme")(request),
  deleteBareme: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(getCrudClient(), "deleteBareme")(request),
  createPalier: (request: CreatePalierRequest) =>
    promisify<CreatePalierRequest, PalierResponse>(getCrudClient(), "createPalier")(request),
  getPalier: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, PalierResponse>(getCrudClient(), "getPalier")(request),
  getPaliersByBareme: (request: GetByBaremeRequest) =>
    promisify<GetByBaremeRequest, PalierListResponse>(getCrudClient(), "getPaliersByBareme")(request),
  updatePalier: (request: UpdatePalierRequest) =>
    promisify<UpdatePalierRequest, PalierResponse>(getCrudClient(), "updatePalier")(request),
  deletePalier: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(getCrudClient(), "deletePalier")(request),
  createStatut: (request: CreateStatutRequest) =>
    promisify<CreateStatutRequest, StatutResponse>(getCrudClient(), "createStatut")(request),
  getStatut: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, StatutResponse>(getCrudClient(), "getStatut")(request),
  getStatuts: (request: GetStatutsCommissionRequest) =>
    promisify<GetStatutsCommissionRequest, StatutCommissionListResponse>(getCrudClient(), "getStatuts")(request),
  getStatutByCode: (request: GetStatutByCodeRequest) =>
    promisify<GetStatutByCodeRequest, StatutResponse>(getCrudClient(), "getStatutByCode")(request),
  updateStatut: (request: UpdateStatutRequest) =>
    promisify<UpdateStatutRequest, StatutResponse>(getCrudClient(), "updateStatut")(request),
  deleteStatut: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(getCrudClient(), "deleteStatut")(request),
};

// ----- CommissionBordereau -----
let bordereauInstance: GrpcClient | null = null;
function getBordereauClient(): GrpcClient {
  if (!bordereauInstance) {
    bordereauInstance = makeClient(
      CommissionBordereauServiceService,
      "CommissionBordereauService",
      SERVICES.commission,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return bordereauInstance;
}

export const commissionBordereau = {
  createBordereau: (request: CreateBordereauRequest) =>
    promisify<CreateBordereauRequest, BordereauResponse>(getBordereauClient(), "createBordereau")(request),
  getBordereau: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, BordereauResponse>(getBordereauClient(), "getBordereau")(request),
  getBordereaux: (request: GetBordereauxRequest) =>
    promisify<GetBordereauxRequest, BordereauListResponse>(getBordereauClient(), "getBordereaux")(request),
  getBordereauByApporteurPeriode: (request: GetBordereauByApporteurPeriodeRequest) =>
    promisify<GetBordereauByApporteurPeriodeRequest, BordereauResponse>(getBordereauClient(), "getBordereauByApporteurPeriode")(request),
  updateBordereau: (request: UpdateBordereauRequest) =>
    promisify<UpdateBordereauRequest, BordereauResponse>(getBordereauClient(), "updateBordereau")(request),
  validateBordereau: (request: ValidateBordereauRequest) =>
    promisify<ValidateBordereauRequest, BordereauResponse>(getBordereauClient(), "validateBordereau")(request),
  exportBordereau: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, ExportBordereauResponse>(getBordereauClient(), "exportBordereau")(request),
  exportBordereauFiles: (request: ExportBordereauRequest) =>
    promisify<ExportBordereauRequest, ExportBordereauResponse>(getBordereauClient(), "exportBordereauFiles")(request),
  deleteBordereau: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(getBordereauClient(), "deleteBordereau")(request),
  createLigneBordereau: (request: CreateLigneBordereauRequest) =>
    promisify<CreateLigneBordereauRequest, LigneBordereauResponse>(getBordereauClient(), "createLigneBordereau")(request),
  getLigneBordereau: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, LigneBordereauResponse>(getBordereauClient(), "getLigneBordereau")(request),
  getLignesByBordereau: (request: GetByBordereauRequest) =>
    promisify<GetByBordereauRequest, LigneBordereauListResponse>(getBordereauClient(), "getLignesByBordereau")(request),
  updateLigneBordereau: (request: UpdateLigneBordereauRequest) =>
    promisify<UpdateLigneBordereauRequest, LigneBordereauResponse>(getBordereauClient(), "updateLigneBordereau")(request),
  validateLigne: (request: ValidateLigneRequest) =>
    promisify<ValidateLigneRequest, LigneBordereauResponse>(getBordereauClient(), "validateLigne")(request),
  deleteLigneBordereau: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(getBordereauClient(), "deleteLigneBordereau")(request),
};

// ----- CommissionCalculation -----
let calculationInstance: GrpcClient | null = null;
function getCalculationClient(): GrpcClient {
  if (!calculationInstance) {
    calculationInstance = makeClient(
      CommissionCalculationServiceService,
      "CommissionCalculationService",
      SERVICES.commission,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return calculationInstance;
}

export const commissionCalculation = {
  calculerCommission: (request: CalculerCommissionRequest) =>
    promisify<CalculerCommissionRequest, CalculerCommissionResponse>(getCalculationClient(), "calculerCommission")(request),
  genererBordereau: (request: GenererBordereauRequest) =>
    promisify<GenererBordereauRequest, GenererBordereauResponse>(getCalculationClient(), "genererBordereau")(request),
  declencherReprise: (request: DeclencherRepriseRequest) =>
    promisify<DeclencherRepriseRequest, RepriseResponse>(getCalculationClient(), "declencherReprise")(request),
  getAuditLogs: (request: CommissionGetAuditLogsRequest) =>
    promisify<CommissionGetAuditLogsRequest, CommissionAuditLogListResponse>(getCalculationClient(), "getAuditLogs")(request),
  getAuditLogsByRef: (request: CommissionGetAuditLogsByRefRequest) =>
    promisify<CommissionGetAuditLogsByRefRequest, CommissionAuditLogListResponse>(getCalculationClient(), "getAuditLogsByRef")(request),
  getAuditLogsByCommission: (request: CommissionGetByCommissionRequest) =>
    promisify<CommissionGetByCommissionRequest, CommissionAuditLogListResponse>(getCalculationClient(), "getAuditLogsByCommission")(request),
  getRecurrences: (request: CommissionGetRecurrencesRequest) =>
    promisify<CommissionGetRecurrencesRequest, CommissionRecurrenceListResponse>(getCalculationClient(), "getRecurrences")(request),
  getRecurrencesByContrat: (request: CommissionGetRecurrencesByContratRequest) =>
    promisify<CommissionGetRecurrencesByContratRequest, CommissionRecurrenceListResponse>(getCalculationClient(), "getRecurrencesByContrat")(request),
};

// ----- CommissionContestation -----
let contestationInstance: GrpcClient | null = null;
function getContestationClient(): GrpcClient {
  if (!contestationInstance) {
    contestationInstance = makeClient(
      CommissionContestationServiceService,
      "CommissionContestationService",
      SERVICES.commission,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return contestationInstance;
}

export const commissionContestation = {
  createReprise: (request: CreateRepriseRequest) =>
    promisify<CreateRepriseRequest, RepriseResponse>(getContestationClient(), "createReprise")(request),
  getReprise: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, RepriseResponse>(getContestationClient(), "getReprise")(request),
  getReprises: (request: GetReprisesRequest) =>
    promisify<GetReprisesRequest, RepriseListResponse>(getContestationClient(), "getReprises")(request),
  getReprisesByCommission: (request: CommissionGetByCommissionRequest) =>
    promisify<CommissionGetByCommissionRequest, RepriseListResponse>(getContestationClient(), "getReprisesByCommission")(request),
  applyReprise: (request: ApplyRepriseRequest) =>
    promisify<ApplyRepriseRequest, RepriseResponse>(getContestationClient(), "applyReprise")(request),
  cancelReprise: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, RepriseResponse>(getContestationClient(), "cancelReprise")(request),
  deleteReprise: (request: CommissionGetByIdRequest) =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(getContestationClient(), "deleteReprise")(request),
  creerContestation: (request: CreerContestationRequest) =>
    promisify<CreerContestationRequest, ContestationResponse>(getContestationClient(), "creerContestation")(request),
  getContestations: (request: GetContestationsRequest) =>
    promisify<GetContestationsRequest, GetContestationsResponse>(getContestationClient(), "getContestations")(request),
  resoudreContestation: (request: ResoudreContestationRequest) =>
    promisify<ResoudreContestationRequest, ContestationResponse>(getContestationClient(), "resoudreContestation")(request),
};

// ----- CommissionValidation -----
let validationInstance: GrpcClient | null = null;
function getValidationClient(): GrpcClient {
  if (!validationInstance) {
    validationInstance = makeClient(
      CommissionValidationServiceService,
      "CommissionValidationService",
      SERVICES.commission,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return validationInstance;
}

export const commissionValidation = {
  getReportsNegatifs: (request: CommissionGetReportsNegatifsRequest) =>
    promisify<CommissionGetReportsNegatifsRequest, CommissionReportNegatifListResponse>(getValidationClient(), "getReportsNegatifs")(request),
  preselectionnerLignes: (request: PreselectionRequest) =>
    promisify<PreselectionRequest, PreselectionResponse>(getValidationClient(), "preselectionnerLignes")(request),
  recalculerTotauxBordereau: (request: RecalculerTotauxRequest) =>
    promisify<RecalculerTotauxRequest, TotauxResponse>(getValidationClient(), "recalculerTotauxBordereau")(request),
  validerBordereauFinal: (request: ValiderBordereauFinalRequest) =>
    promisify<ValiderBordereauFinalRequest, ValiderBordereauFinalResponse>(getValidationClient(), "validerBordereauFinal")(request),
  getLignesForValidation: (request: GetLignesForValidationRequest) =>
    promisify<GetLignesForValidationRequest, GetLignesForValidationResponse>(getValidationClient(), "getLignesForValidation")(request),
};

// ----- CommissionDashboard -----
let dashboardInstance: GrpcClient | null = null;
function getDashboardClient(): GrpcClient {
  if (!dashboardInstance) {
    dashboardInstance = makeClient(
      CommissionDashboardServiceService,
      "CommissionDashboardService",
      SERVICES.commission,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return dashboardInstance;
}

export const commissionDashboard = {
  getDashboardKpi: (request: GetDashboardKpiRequest) =>
    promisify<GetDashboardKpiRequest, GetDashboardKpiResponse>(getDashboardClient(), "getDashboardKpi")(request),
  genererSnapshotKpi: (request: GenererSnapshotKpiRequest) =>
    promisify<GenererSnapshotKpiRequest, GenererSnapshotKpiResponse>(getDashboardClient(), "genererSnapshotKpi")(request),
  getComparatifs: (request: GetComparatifsRequest) =>
    promisify<GetComparatifsRequest, GetComparatifsResponse>(getDashboardClient(), "getComparatifs")(request),
  exportAnalytique: (request: ExportAnalytiqueRequest) =>
    promisify<ExportAnalytiqueRequest, ExportAnalytiqueResponse>(getDashboardClient(), "exportAnalytique")(request),
};

// ============================================
// TYPE RE-EXPORTS
// ============================================

export type {
  CommissionResponse,
  CommissionListResponse,
  GetCommissionsRequest,
  BordereauResponse,
  BordereauListResponse,
  GetBordereauxRequest,
  ExportBordereauResponse,
  RepriseResponse,
  RepriseListResponse,
  GetReprisesRequest,
  StatutCommissionListResponse,
  GenererBordereauRequest,
  GenererBordereauResponse,
  CalculerCommissionRequest,
  CalculerCommissionResponse,
  ContestationResponse,
  GetContestationsResponse,
  TotauxResponse,
  PreselectionResponse,
  ValiderBordereauFinalResponse,
  GetLignesForValidationResponse,
};
