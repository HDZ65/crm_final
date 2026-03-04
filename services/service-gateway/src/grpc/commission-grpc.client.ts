import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

// ============================================================================
// gRPC Service Interfaces — 6 commission sub-services
// ============================================================================

interface CommissionCrudServiceClient {
  CreateCommission(data: Record<string, unknown>): Observable<unknown>;
  GetCommission(data: Record<string, unknown>): Observable<unknown>;
  GetCommissions(data: Record<string, unknown>): Observable<unknown>;
  GetCommissionsByApporteur(data: Record<string, unknown>): Observable<unknown>;
  GetCommissionsByPeriode(data: Record<string, unknown>): Observable<unknown>;
  UpdateCommission(data: Record<string, unknown>): Observable<unknown>;
  DeleteCommission(data: Record<string, unknown>): Observable<unknown>;
  CreateBareme(data: Record<string, unknown>): Observable<unknown>;
  GetBareme(data: Record<string, unknown>): Observable<unknown>;
  GetBaremes(data: Record<string, unknown>): Observable<unknown>;
  GetBaremeApplicable(data: Record<string, unknown>): Observable<unknown>;
  UpdateBareme(data: Record<string, unknown>): Observable<unknown>;
  DeleteBareme(data: Record<string, unknown>): Observable<unknown>;
  CreatePalier(data: Record<string, unknown>): Observable<unknown>;
  GetPalier(data: Record<string, unknown>): Observable<unknown>;
  GetPaliersByBareme(data: Record<string, unknown>): Observable<unknown>;
  UpdatePalier(data: Record<string, unknown>): Observable<unknown>;
  DeletePalier(data: Record<string, unknown>): Observable<unknown>;
  CreateStatut(data: Record<string, unknown>): Observable<unknown>;
  GetStatut(data: Record<string, unknown>): Observable<unknown>;
  GetStatuts(data: Record<string, unknown>): Observable<unknown>;
  GetStatutByCode(data: Record<string, unknown>): Observable<unknown>;
  UpdateStatut(data: Record<string, unknown>): Observable<unknown>;
  DeleteStatut(data: Record<string, unknown>): Observable<unknown>;
}

interface CommissionBordereauServiceClient {
  CreateBordereau(data: Record<string, unknown>): Observable<unknown>;
  GetBordereau(data: Record<string, unknown>): Observable<unknown>;
  GetBordereaux(data: Record<string, unknown>): Observable<unknown>;
  GetBordereauByApporteurPeriode(data: Record<string, unknown>): Observable<unknown>;
  UpdateBordereau(data: Record<string, unknown>): Observable<unknown>;
  ValidateBordereau(data: Record<string, unknown>): Observable<unknown>;
  ExportBordereau(data: Record<string, unknown>): Observable<unknown>;
  ExportBordereauFiles(data: Record<string, unknown>): Observable<unknown>;
  DeleteBordereau(data: Record<string, unknown>): Observable<unknown>;
  CreateLigneBordereau(data: Record<string, unknown>): Observable<unknown>;
  GetLigneBordereau(data: Record<string, unknown>): Observable<unknown>;
  GetLignesByBordereau(data: Record<string, unknown>): Observable<unknown>;
  UpdateLigneBordereau(data: Record<string, unknown>): Observable<unknown>;
  ValidateLigne(data: Record<string, unknown>): Observable<unknown>;
  DeleteLigneBordereau(data: Record<string, unknown>): Observable<unknown>;
}

interface CommissionCalculationServiceClient {
  CalculerCommission(data: Record<string, unknown>): Observable<unknown>;
  GenererBordereau(data: Record<string, unknown>): Observable<unknown>;
  DeclencherReprise(data: Record<string, unknown>): Observable<unknown>;
  GetAuditLogs(data: Record<string, unknown>): Observable<unknown>;
  GetAuditLogsByRef(data: Record<string, unknown>): Observable<unknown>;
  GetAuditLogsByCommission(data: Record<string, unknown>): Observable<unknown>;
  GetRecurrences(data: Record<string, unknown>): Observable<unknown>;
  GetRecurrencesByContrat(data: Record<string, unknown>): Observable<unknown>;
}

interface CommissionContestationServiceClient {
  CreateReprise(data: Record<string, unknown>): Observable<unknown>;
  GetReprise(data: Record<string, unknown>): Observable<unknown>;
  GetReprises(data: Record<string, unknown>): Observable<unknown>;
  GetReprisesByCommission(data: Record<string, unknown>): Observable<unknown>;
  ApplyReprise(data: Record<string, unknown>): Observable<unknown>;
  CancelReprise(data: Record<string, unknown>): Observable<unknown>;
  DeleteReprise(data: Record<string, unknown>): Observable<unknown>;
  CreerContestation(data: Record<string, unknown>): Observable<unknown>;
  GetContestations(data: Record<string, unknown>): Observable<unknown>;
  ResoudreContestation(data: Record<string, unknown>): Observable<unknown>;
}

interface CommissionValidationServiceClient {
  GetReportsNegatifs(data: Record<string, unknown>): Observable<unknown>;
  PreselectionnerLignes(data: Record<string, unknown>): Observable<unknown>;
  RecalculerTotauxBordereau(data: Record<string, unknown>): Observable<unknown>;
  ValiderBordereauFinal(data: Record<string, unknown>): Observable<unknown>;
  GetLignesForValidation(data: Record<string, unknown>): Observable<unknown>;
}

interface CommissionDashboardServiceClient {
  GetDashboardKpi(data: Record<string, unknown>): Observable<unknown>;
  GenererSnapshotKpi(data: Record<string, unknown>): Observable<unknown>;
  GetComparatifs(data: Record<string, unknown>): Observable<unknown>;
  ExportAnalytique(data: Record<string, unknown>): Observable<unknown>;
}

// ============================================================================
// CommissionGrpcClient — facade over 6 commission gRPC sub-services
// ============================================================================

@Injectable()
export class CommissionGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(CommissionGrpcClient.name);

  private crudService!: CommissionCrudServiceClient;
  private bordereauService!: CommissionBordereauServiceClient;
  private calculationService!: CommissionCalculationServiceClient;
  private contestationService!: CommissionContestationServiceClient;
  private validationService!: CommissionValidationServiceClient;
  private dashboardService!: CommissionDashboardServiceClient;

  constructor(@Inject('COMMERCIAL_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.crudService =
      this.client.getService<CommissionCrudServiceClient>('CommissionCrudService');
    this.bordereauService =
      this.client.getService<CommissionBordereauServiceClient>('CommissionBordereauService');
    this.calculationService =
      this.client.getService<CommissionCalculationServiceClient>('CommissionCalculationService');
    this.contestationService =
      this.client.getService<CommissionContestationServiceClient>('CommissionContestationService');
    this.validationService =
      this.client.getService<CommissionValidationServiceClient>('CommissionValidationService');
    this.dashboardService =
      this.client.getService<CommissionDashboardServiceClient>('CommissionDashboardService');
  }

  // ===========================================================================
  // CRUD — CommissionCrudService
  // ===========================================================================

  createCommission(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.CreateCommission(data),
      this.logger,
      'CommissionCrudService',
      'CreateCommission',
    );
  }

  getCommission(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.GetCommission(data),
      this.logger,
      'CommissionCrudService',
      'GetCommission',
    );
  }

  getCommissions(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.GetCommissions(data),
      this.logger,
      'CommissionCrudService',
      'GetCommissions',
    );
  }

  getCommissionsByApporteur(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.GetCommissionsByApporteur(data),
      this.logger,
      'CommissionCrudService',
      'GetCommissionsByApporteur',
    );
  }

  getCommissionsByPeriode(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.GetCommissionsByPeriode(data),
      this.logger,
      'CommissionCrudService',
      'GetCommissionsByPeriode',
    );
  }

  updateCommission(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.UpdateCommission(data),
      this.logger,
      'CommissionCrudService',
      'UpdateCommission',
    );
  }

  deleteCommission(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.DeleteCommission(data),
      this.logger,
      'CommissionCrudService',
      'DeleteCommission',
    );
  }

  createBareme(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.CreateBareme(data),
      this.logger,
      'CommissionCrudService',
      'CreateBareme',
    );
  }

  getBareme(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.GetBareme(data),
      this.logger,
      'CommissionCrudService',
      'GetBareme',
    );
  }

  getBaremes(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.GetBaremes(data),
      this.logger,
      'CommissionCrudService',
      'GetBaremes',
    );
  }

  getBaremeApplicable(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.GetBaremeApplicable(data),
      this.logger,
      'CommissionCrudService',
      'GetBaremeApplicable',
    );
  }

  updateBareme(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.UpdateBareme(data),
      this.logger,
      'CommissionCrudService',
      'UpdateBareme',
    );
  }

  deleteBareme(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.DeleteBareme(data),
      this.logger,
      'CommissionCrudService',
      'DeleteBareme',
    );
  }

  createPalier(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.CreatePalier(data),
      this.logger,
      'CommissionCrudService',
      'CreatePalier',
    );
  }

  getPalier(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.GetPalier(data),
      this.logger,
      'CommissionCrudService',
      'GetPalier',
    );
  }

  getPaliersByBareme(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.GetPaliersByBareme(data),
      this.logger,
      'CommissionCrudService',
      'GetPaliersByBareme',
    );
  }

  updatePalier(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.UpdatePalier(data),
      this.logger,
      'CommissionCrudService',
      'UpdatePalier',
    );
  }

  deletePalier(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.DeletePalier(data),
      this.logger,
      'CommissionCrudService',
      'DeletePalier',
    );
  }

  createStatut(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.CreateStatut(data),
      this.logger,
      'CommissionCrudService',
      'CreateStatut',
    );
  }

  getStatut(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.GetStatut(data),
      this.logger,
      'CommissionCrudService',
      'GetStatut',
    );
  }

  getStatuts(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.GetStatuts(data),
      this.logger,
      'CommissionCrudService',
      'GetStatuts',
    );
  }

  getStatutByCode(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.GetStatutByCode(data),
      this.logger,
      'CommissionCrudService',
      'GetStatutByCode',
    );
  }

  updateStatut(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.UpdateStatut(data),
      this.logger,
      'CommissionCrudService',
      'UpdateStatut',
    );
  }

  deleteStatut(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.crudService.DeleteStatut(data),
      this.logger,
      'CommissionCrudService',
      'DeleteStatut',
    );
  }

  // ===========================================================================
  // Bordereau — CommissionBordereauService
  // ===========================================================================

  createBordereau(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.CreateBordereau(data),
      this.logger,
      'CommissionBordereauService',
      'CreateBordereau',
    );
  }

  getBordereau(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.GetBordereau(data),
      this.logger,
      'CommissionBordereauService',
      'GetBordereau',
    );
  }

  getBordereaux(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.GetBordereaux(data),
      this.logger,
      'CommissionBordereauService',
      'GetBordereaux',
    );
  }

  getBordereauByApporteurPeriode(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.GetBordereauByApporteurPeriode(data),
      this.logger,
      'CommissionBordereauService',
      'GetBordereauByApporteurPeriode',
    );
  }

  updateBordereau(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.UpdateBordereau(data),
      this.logger,
      'CommissionBordereauService',
      'UpdateBordereau',
    );
  }

  validateBordereau(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.ValidateBordereau(data),
      this.logger,
      'CommissionBordereauService',
      'ValidateBordereau',
    );
  }

  exportBordereau(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.ExportBordereau(data),
      this.logger,
      'CommissionBordereauService',
      'ExportBordereau',
    );
  }

  exportBordereauFiles(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.ExportBordereauFiles(data),
      this.logger,
      'CommissionBordereauService',
      'ExportBordereauFiles',
    );
  }

  deleteBordereau(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.DeleteBordereau(data),
      this.logger,
      'CommissionBordereauService',
      'DeleteBordereau',
    );
  }

  createLigneBordereau(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.CreateLigneBordereau(data),
      this.logger,
      'CommissionBordereauService',
      'CreateLigneBordereau',
    );
  }

  getLigneBordereau(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.GetLigneBordereau(data),
      this.logger,
      'CommissionBordereauService',
      'GetLigneBordereau',
    );
  }

  getLignesByBordereau(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.GetLignesByBordereau(data),
      this.logger,
      'CommissionBordereauService',
      'GetLignesByBordereau',
    );
  }

  updateLigneBordereau(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.UpdateLigneBordereau(data),
      this.logger,
      'CommissionBordereauService',
      'UpdateLigneBordereau',
    );
  }

  validateLigne(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.ValidateLigne(data),
      this.logger,
      'CommissionBordereauService',
      'ValidateLigne',
    );
  }

  deleteLigneBordereau(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.bordereauService.DeleteLigneBordereau(data),
      this.logger,
      'CommissionBordereauService',
      'DeleteLigneBordereau',
    );
  }

  // ===========================================================================
  // Calculation — CommissionCalculationService
  // ===========================================================================

  calculerCommission(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.calculationService.CalculerCommission(data),
      this.logger,
      'CommissionCalculationService',
      'CalculerCommission',
    );
  }

  genererBordereau(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.calculationService.GenererBordereau(data),
      this.logger,
      'CommissionCalculationService',
      'GenererBordereau',
    );
  }

  declencherReprise(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.calculationService.DeclencherReprise(data),
      this.logger,
      'CommissionCalculationService',
      'DeclencherReprise',
    );
  }

  getAuditLogs(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.calculationService.GetAuditLogs(data),
      this.logger,
      'CommissionCalculationService',
      'GetAuditLogs',
    );
  }

  getAuditLogsByRef(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.calculationService.GetAuditLogsByRef(data),
      this.logger,
      'CommissionCalculationService',
      'GetAuditLogsByRef',
    );
  }

  getAuditLogsByCommission(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.calculationService.GetAuditLogsByCommission(data),
      this.logger,
      'CommissionCalculationService',
      'GetAuditLogsByCommission',
    );
  }

  getRecurrences(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.calculationService.GetRecurrences(data),
      this.logger,
      'CommissionCalculationService',
      'GetRecurrences',
    );
  }

  getRecurrencesByContrat(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.calculationService.GetRecurrencesByContrat(data),
      this.logger,
      'CommissionCalculationService',
      'GetRecurrencesByContrat',
    );
  }

  // ===========================================================================
  // Contestation — CommissionContestationService
  // ===========================================================================

  createReprise(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.contestationService.CreateReprise(data),
      this.logger,
      'CommissionContestationService',
      'CreateReprise',
    );
  }

  getReprise(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.contestationService.GetReprise(data),
      this.logger,
      'CommissionContestationService',
      'GetReprise',
    );
  }

  getReprises(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.contestationService.GetReprises(data),
      this.logger,
      'CommissionContestationService',
      'GetReprises',
    );
  }

  getReprisesByCommission(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.contestationService.GetReprisesByCommission(data),
      this.logger,
      'CommissionContestationService',
      'GetReprisesByCommission',
    );
  }

  applyReprise(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.contestationService.ApplyReprise(data),
      this.logger,
      'CommissionContestationService',
      'ApplyReprise',
    );
  }

  cancelReprise(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.contestationService.CancelReprise(data),
      this.logger,
      'CommissionContestationService',
      'CancelReprise',
    );
  }

  deleteReprise(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.contestationService.DeleteReprise(data),
      this.logger,
      'CommissionContestationService',
      'DeleteReprise',
    );
  }

  creerContestation(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.contestationService.CreerContestation(data),
      this.logger,
      'CommissionContestationService',
      'CreerContestation',
    );
  }

  getContestations(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.contestationService.GetContestations(data),
      this.logger,
      'CommissionContestationService',
      'GetContestations',
    );
  }

  resoudreContestation(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.contestationService.ResoudreContestation(data),
      this.logger,
      'CommissionContestationService',
      'ResoudreContestation',
    );
  }

  // ===========================================================================
  // Validation — CommissionValidationService
  // ===========================================================================

  getReportsNegatifs(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.validationService.GetReportsNegatifs(data),
      this.logger,
      'CommissionValidationService',
      'GetReportsNegatifs',
    );
  }

  preselectionnerLignes(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.validationService.PreselectionnerLignes(data),
      this.logger,
      'CommissionValidationService',
      'PreselectionnerLignes',
    );
  }

  recalculerTotauxBordereau(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.validationService.RecalculerTotauxBordereau(data),
      this.logger,
      'CommissionValidationService',
      'RecalculerTotauxBordereau',
    );
  }

  validerBordereauFinal(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.validationService.ValiderBordereauFinal(data),
      this.logger,
      'CommissionValidationService',
      'ValiderBordereauFinal',
    );
  }

  getLignesForValidation(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.validationService.GetLignesForValidation(data),
      this.logger,
      'CommissionValidationService',
      'GetLignesForValidation',
    );
  }

  // ===========================================================================
  // Dashboard — CommissionDashboardService
  // ===========================================================================

  getDashboardKpi(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.dashboardService.GetDashboardKpi(data),
      this.logger,
      'CommissionDashboardService',
      'GetDashboardKpi',
    );
  }

  genererSnapshotKpi(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.dashboardService.GenererSnapshotKpi(data),
      this.logger,
      'CommissionDashboardService',
      'GenererSnapshotKpi',
    );
  }

  getComparatifs(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.dashboardService.GetComparatifs(data),
      this.logger,
      'CommissionDashboardService',
      'GetComparatifs',
    );
  }

  exportAnalytique(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.dashboardService.ExportAnalytique(data),
      this.logger,
      'CommissionDashboardService',
      'ExportAnalytique',
    );
  }
}
