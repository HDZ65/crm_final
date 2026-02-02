import { credentials, SERVICES, promisify } from "./config";
import {
  CalendarEngineServiceClient,
  DebitConfigurationServiceClient,
  HolidayServiceClient,
  CalendarAdminServiceClient,
  type CalculatePlannedDateRequest,
  type CalculatePlannedDateResponse,
  type CalculatePlannedDatesBatchRequest,
  type CalculatePlannedDatesBatchResponse,
  type CheckDateEligibilityRequest,
  type CheckDateEligibilityResponse,
  type GetSystemConfigRequest,
  type UpdateSystemConfigRequest,
  type SystemDebitConfiguration,
  type CreateCompanyConfigRequest,
  type UpdateCompanyConfigRequest,
  type GetCompanyConfigRequest,
  type ListCompanyConfigsRequest,
  type ListCompanyConfigsResponse,
  type DeleteCompanyConfigRequest,
  type CompanyDebitConfiguration,
  type CreateClientConfigRequest,
  type UpdateClientConfigRequest,
  type GetClientConfigRequest,
  type ListClientConfigsRequest,
  type ListClientConfigsResponse,
  type DeleteClientConfigRequest,
  type ClientDebitConfiguration,
  type CreateContractConfigRequest,
  type UpdateContractConfigRequest,
  type GetContractConfigRequest,
  type ListContractConfigsRequest,
  type ListContractConfigsResponse,
  type DeleteContractConfigRequest,
  type ContractDebitConfiguration,
  type ResolveConfigurationRequest,
  type ResolvedDebitConfiguration,
  type CreateHolidayZoneRequest,
  type UpdateHolidayZoneRequest,
  type GetHolidayZoneRequest,
  type ListHolidayZonesRequest,
  type ListHolidayZonesResponse,
  type DeleteHolidayZoneRequest,
  type HolidayZone,
  type CreateHolidayRequest,
  type UpdateHolidayRequest,
  type GetHolidayRequest,
  type ListHolidaysRequest,
  type ListHolidaysResponse,
  type DeleteHolidayRequest,
  type Holiday,
  type ImportHolidaysByCountryRequest,
  type ImportHolidaysByCountryResponse,
  type GetCalendarViewRequest,
  type GetCalendarViewResponse,
  type GetDateDetailsRequest,
  type GetDateDetailsResponse,
  type GetVolumeHeatmapRequest,
  type GetVolumeHeatmapResponse,
  type ImportCsvRequest,
  type ImportCsvResponse,
  type ConfirmCsvImportRequest,
  type ConfirmCsvImportResponse,
  type ExportCalendarCsvRequest,
  type ExportCalendarCsvResponse,
  type CreateVolumeThresholdRequest,
  type UpdateVolumeThresholdRequest,
  type GetVolumeThresholdRequest,
  type ListVolumeThresholdsRequest,
  type ListVolumeThresholdsResponse,
  type DeleteVolumeThresholdRequest,
  type VolumeThreshold,
  type GetAuditLogsRequest,
  type GetAuditLogsResponse,
  type CalendarAuditLog,
  type DeleteResponse as CalendarDeleteResponse,
} from "@proto/calendar/calendar";

let calendarEngineInstance: CalendarEngineServiceClient | null = null;
let debitConfigInstance: DebitConfigurationServiceClient | null = null;
let holidayInstance: HolidayServiceClient | null = null;
let calendarAdminInstance: CalendarAdminServiceClient | null = null;

function getCalendarEngineClient(): CalendarEngineServiceClient {
  if (!calendarEngineInstance) {
    calendarEngineInstance = new CalendarEngineServiceClient(
      SERVICES.calendar,
      credentials.createInsecure()
    );
  }
  return calendarEngineInstance;
}

function getDebitConfigClient(): DebitConfigurationServiceClient {
  if (!debitConfigInstance) {
    debitConfigInstance = new DebitConfigurationServiceClient(
      SERVICES.calendar,
      credentials.createInsecure()
    );
  }
  return debitConfigInstance;
}

function getHolidayClient(): HolidayServiceClient {
  if (!holidayInstance) {
    holidayInstance = new HolidayServiceClient(
      SERVICES.calendar,
      credentials.createInsecure()
    );
  }
  return holidayInstance;
}

function getCalendarAdminClient(): CalendarAdminServiceClient {
  if (!calendarAdminInstance) {
    calendarAdminInstance = new CalendarAdminServiceClient(
      SERVICES.calendar,
      credentials.createInsecure()
    );
  }
  return calendarAdminInstance;
}

export const calendarEngine = {
  calculatePlannedDate: (request: CalculatePlannedDateRequest): Promise<CalculatePlannedDateResponse> =>
    promisify<CalculatePlannedDateRequest, CalculatePlannedDateResponse>(
      getCalendarEngineClient(),
      "calculatePlannedDate"
    )(request),

  calculatePlannedDatesBatch: (request: CalculatePlannedDatesBatchRequest): Promise<CalculatePlannedDatesBatchResponse> =>
    promisify<CalculatePlannedDatesBatchRequest, CalculatePlannedDatesBatchResponse>(
      getCalendarEngineClient(),
      "calculatePlannedDatesBatch"
    )(request),

  checkDateEligibility: (request: CheckDateEligibilityRequest): Promise<CheckDateEligibilityResponse> =>
    promisify<CheckDateEligibilityRequest, CheckDateEligibilityResponse>(
      getCalendarEngineClient(),
      "checkDateEligibility"
    )(request),
};

export const debitConfig = {
  getSystemConfig: (request: GetSystemConfigRequest): Promise<SystemDebitConfiguration> =>
    promisify<GetSystemConfigRequest, SystemDebitConfiguration>(
      getDebitConfigClient(),
      "getSystemConfig"
    )(request),

  updateSystemConfig: (request: UpdateSystemConfigRequest): Promise<SystemDebitConfiguration> =>
    promisify<UpdateSystemConfigRequest, SystemDebitConfiguration>(
      getDebitConfigClient(),
      "updateSystemConfig"
    )(request),

  createCompanyConfig: (request: CreateCompanyConfigRequest): Promise<CompanyDebitConfiguration> =>
    promisify<CreateCompanyConfigRequest, CompanyDebitConfiguration>(
      getDebitConfigClient(),
      "createCompanyConfig"
    )(request),

  updateCompanyConfig: (request: UpdateCompanyConfigRequest): Promise<CompanyDebitConfiguration> =>
    promisify<UpdateCompanyConfigRequest, CompanyDebitConfiguration>(
      getDebitConfigClient(),
      "updateCompanyConfig"
    )(request),

  getCompanyConfig: (request: GetCompanyConfigRequest): Promise<CompanyDebitConfiguration> =>
    promisify<GetCompanyConfigRequest, CompanyDebitConfiguration>(
      getDebitConfigClient(),
      "getCompanyConfig"
    )(request),

  listCompanyConfigs: (request: ListCompanyConfigsRequest): Promise<ListCompanyConfigsResponse> =>
    promisify<ListCompanyConfigsRequest, ListCompanyConfigsResponse>(
      getDebitConfigClient(),
      "listCompanyConfigs"
    )(request),

  deleteCompanyConfig: (request: DeleteCompanyConfigRequest): Promise<CalendarDeleteResponse> =>
    promisify<DeleteCompanyConfigRequest, CalendarDeleteResponse>(
      getDebitConfigClient(),
      "deleteCompanyConfig"
    )(request),

  createClientConfig: (request: CreateClientConfigRequest): Promise<ClientDebitConfiguration> =>
    promisify<CreateClientConfigRequest, ClientDebitConfiguration>(
      getDebitConfigClient(),
      "createClientConfig"
    )(request),

  updateClientConfig: (request: UpdateClientConfigRequest): Promise<ClientDebitConfiguration> =>
    promisify<UpdateClientConfigRequest, ClientDebitConfiguration>(
      getDebitConfigClient(),
      "updateClientConfig"
    )(request),

  getClientConfig: (request: GetClientConfigRequest): Promise<ClientDebitConfiguration> =>
    promisify<GetClientConfigRequest, ClientDebitConfiguration>(
      getDebitConfigClient(),
      "getClientConfig"
    )(request),

  listClientConfigs: (request: ListClientConfigsRequest): Promise<ListClientConfigsResponse> =>
    promisify<ListClientConfigsRequest, ListClientConfigsResponse>(
      getDebitConfigClient(),
      "listClientConfigs"
    )(request),

  deleteClientConfig: (request: DeleteClientConfigRequest): Promise<CalendarDeleteResponse> =>
    promisify<DeleteClientConfigRequest, CalendarDeleteResponse>(
      getDebitConfigClient(),
      "deleteClientConfig"
    )(request),

  createContractConfig: (request: CreateContractConfigRequest): Promise<ContractDebitConfiguration> =>
    promisify<CreateContractConfigRequest, ContractDebitConfiguration>(
      getDebitConfigClient(),
      "createContractConfig"
    )(request),

  updateContractConfig: (request: UpdateContractConfigRequest): Promise<ContractDebitConfiguration> =>
    promisify<UpdateContractConfigRequest, ContractDebitConfiguration>(
      getDebitConfigClient(),
      "updateContractConfig"
    )(request),

  getContractConfig: (request: GetContractConfigRequest): Promise<ContractDebitConfiguration> =>
    promisify<GetContractConfigRequest, ContractDebitConfiguration>(
      getDebitConfigClient(),
      "getContractConfig"
    )(request),

  listContractConfigs: (request: ListContractConfigsRequest): Promise<ListContractConfigsResponse> =>
    promisify<ListContractConfigsRequest, ListContractConfigsResponse>(
      getDebitConfigClient(),
      "listContractConfigs"
    )(request),

  deleteContractConfig: (request: DeleteContractConfigRequest): Promise<CalendarDeleteResponse> =>
    promisify<DeleteContractConfigRequest, CalendarDeleteResponse>(
      getDebitConfigClient(),
      "deleteContractConfig"
    )(request),

  resolveConfiguration: (request: ResolveConfigurationRequest): Promise<ResolvedDebitConfiguration> =>
    promisify<ResolveConfigurationRequest, ResolvedDebitConfiguration>(
      getDebitConfigClient(),
      "resolveConfiguration"
    )(request),
};

export const holidays = {
  createZone: (request: CreateHolidayZoneRequest): Promise<HolidayZone> =>
    promisify<CreateHolidayZoneRequest, HolidayZone>(
      getHolidayClient(),
      "createHolidayZone"
    )(request),

  updateZone: (request: UpdateHolidayZoneRequest): Promise<HolidayZone> =>
    promisify<UpdateHolidayZoneRequest, HolidayZone>(
      getHolidayClient(),
      "updateHolidayZone"
    )(request),

  getZone: (request: GetHolidayZoneRequest): Promise<HolidayZone> =>
    promisify<GetHolidayZoneRequest, HolidayZone>(
      getHolidayClient(),
      "getHolidayZone"
    )(request),

  listZones: (request: ListHolidayZonesRequest): Promise<ListHolidayZonesResponse> =>
    promisify<ListHolidayZonesRequest, ListHolidayZonesResponse>(
      getHolidayClient(),
      "listHolidayZones"
    )(request),

  deleteZone: (request: DeleteHolidayZoneRequest): Promise<CalendarDeleteResponse> =>
    promisify<DeleteHolidayZoneRequest, CalendarDeleteResponse>(
      getHolidayClient(),
      "deleteHolidayZone"
    )(request),

  create: (request: CreateHolidayRequest): Promise<Holiday> =>
    promisify<CreateHolidayRequest, Holiday>(
      getHolidayClient(),
      "createHoliday"
    )(request),

  update: (request: UpdateHolidayRequest): Promise<Holiday> =>
    promisify<UpdateHolidayRequest, Holiday>(
      getHolidayClient(),
      "updateHoliday"
    )(request),

  get: (request: GetHolidayRequest): Promise<Holiday> =>
    promisify<GetHolidayRequest, Holiday>(
      getHolidayClient(),
      "getHoliday"
    )(request),

  list: (request: ListHolidaysRequest): Promise<ListHolidaysResponse> =>
    promisify<ListHolidaysRequest, ListHolidaysResponse>(
      getHolidayClient(),
      "listHolidays"
    )(request),

  delete: (request: DeleteHolidayRequest): Promise<CalendarDeleteResponse> =>
    promisify<DeleteHolidayRequest, CalendarDeleteResponse>(
      getHolidayClient(),
      "deleteHoliday"
    )(request),

  importByCountry: (request: ImportHolidaysByCountryRequest): Promise<ImportHolidaysByCountryResponse> =>
    promisify<ImportHolidaysByCountryRequest, ImportHolidaysByCountryResponse>(
      getHolidayClient(),
      "importHolidaysByCountry"
    )(request),
};

export const calendarAdmin = {
  getCalendarView: (request: GetCalendarViewRequest): Promise<GetCalendarViewResponse> =>
    promisify<GetCalendarViewRequest, GetCalendarViewResponse>(
      getCalendarAdminClient(),
      "getCalendarView"
    )(request),

  getDateDetails: (request: GetDateDetailsRequest): Promise<GetDateDetailsResponse> =>
    promisify<GetDateDetailsRequest, GetDateDetailsResponse>(
      getCalendarAdminClient(),
      "getDateDetails"
    )(request),

  getVolumeHeatmap: (request: GetVolumeHeatmapRequest): Promise<GetVolumeHeatmapResponse> =>
    promisify<GetVolumeHeatmapRequest, GetVolumeHeatmapResponse>(
      getCalendarAdminClient(),
      "getVolumeHeatmap"
    )(request),

  importCsv: (request: ImportCsvRequest): Promise<ImportCsvResponse> =>
    promisify<ImportCsvRequest, ImportCsvResponse>(
      getCalendarAdminClient(),
      "importCsv"
    )(request),

  confirmCsvImport: (request: ConfirmCsvImportRequest): Promise<ConfirmCsvImportResponse> =>
    promisify<ConfirmCsvImportRequest, ConfirmCsvImportResponse>(
      getCalendarAdminClient(),
      "confirmCsvImport"
    )(request),

  exportCalendarCsv: (request: ExportCalendarCsvRequest): Promise<ExportCalendarCsvResponse> =>
    promisify<ExportCalendarCsvRequest, ExportCalendarCsvResponse>(
      getCalendarAdminClient(),
      "exportCalendarCsv"
    )(request),

  createVolumeThreshold: (request: CreateVolumeThresholdRequest): Promise<VolumeThreshold> =>
    promisify<CreateVolumeThresholdRequest, VolumeThreshold>(
      getCalendarAdminClient(),
      "createVolumeThreshold"
    )(request),

  updateVolumeThreshold: (request: UpdateVolumeThresholdRequest): Promise<VolumeThreshold> =>
    promisify<UpdateVolumeThresholdRequest, VolumeThreshold>(
      getCalendarAdminClient(),
      "updateVolumeThreshold"
    )(request),

  getVolumeThreshold: (request: GetVolumeThresholdRequest): Promise<VolumeThreshold> =>
    promisify<GetVolumeThresholdRequest, VolumeThreshold>(
      getCalendarAdminClient(),
      "getVolumeThreshold"
    )(request),

  listVolumeThresholds: (request: ListVolumeThresholdsRequest): Promise<ListVolumeThresholdsResponse> =>
    promisify<ListVolumeThresholdsRequest, ListVolumeThresholdsResponse>(
      getCalendarAdminClient(),
      "listVolumeThresholds"
    )(request),

  deleteVolumeThreshold: (request: DeleteVolumeThresholdRequest): Promise<CalendarDeleteResponse> =>
    promisify<DeleteVolumeThresholdRequest, CalendarDeleteResponse>(
      getCalendarAdminClient(),
      "deleteVolumeThreshold"
    )(request),

  getAuditLogs: (request: GetAuditLogsRequest): Promise<GetAuditLogsResponse> =>
    promisify<GetAuditLogsRequest, GetAuditLogsResponse>(
      getCalendarAdminClient(),
      "getAuditLogs"
    )(request),
};

export type {
  CalculatePlannedDateRequest,
  CalculatePlannedDateResponse,
  CalculatePlannedDatesBatchRequest,
  CalculatePlannedDatesBatchResponse,
  CheckDateEligibilityRequest,
  CheckDateEligibilityResponse,
  SystemDebitConfiguration,
  CompanyDebitConfiguration,
  ClientDebitConfiguration,
  ContractDebitConfiguration,
  ResolvedDebitConfiguration,
  GetSystemConfigRequest,
  UpdateSystemConfigRequest,
  CreateCompanyConfigRequest,
  UpdateCompanyConfigRequest,
  ListCompanyConfigsRequest,
  ListCompanyConfigsResponse,
  CreateClientConfigRequest,
  UpdateClientConfigRequest,
  ListClientConfigsRequest,
  ListClientConfigsResponse,
  CreateContractConfigRequest,
  UpdateContractConfigRequest,
  ListContractConfigsRequest,
  ListContractConfigsResponse,
  ResolveConfigurationRequest,
  HolidayZone,
  Holiday,
  CreateHolidayZoneRequest,
  UpdateHolidayZoneRequest,
  ListHolidayZonesRequest,
  ListHolidayZonesResponse,
  CreateHolidayRequest,
  UpdateHolidayRequest,
  ListHolidaysRequest,
  ListHolidaysResponse,
  ImportHolidaysByCountryRequest,
  ImportHolidaysByCountryResponse,
  GetCalendarViewRequest,
  GetCalendarViewResponse,
  GetDateDetailsRequest,
  GetDateDetailsResponse,
  GetVolumeHeatmapRequest,
  GetVolumeHeatmapResponse,
  ImportCsvRequest,
  ImportCsvResponse,
  ConfirmCsvImportRequest,
  ConfirmCsvImportResponse,
  ExportCalendarCsvRequest,
  ExportCalendarCsvResponse,
  VolumeThreshold,
  CreateVolumeThresholdRequest,
  UpdateVolumeThresholdRequest,
  ListVolumeThresholdsRequest,
  ListVolumeThresholdsResponse,
  CalendarAuditLog,
  GetAuditLogsRequest,
  GetAuditLogsResponse,
};
