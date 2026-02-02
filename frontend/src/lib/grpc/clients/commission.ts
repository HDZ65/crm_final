import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify } from "./config";
import {
  CommissionServiceClient,
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
} from "@proto/commission/commission";

let commissionInstance: CommissionServiceClient | null = null;

function getCommissionClient(): CommissionServiceClient {
  if (!commissionInstance) {
    commissionInstance = new CommissionServiceClient(
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
};
