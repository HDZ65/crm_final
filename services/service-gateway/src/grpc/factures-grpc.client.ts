import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

// ==================== SERVICE INTERFACES ====================

export interface StatutFactureServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByCode(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface EmissionFactureServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface LigneFactureServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface FactureServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByNumero(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  Validate(data: Record<string, unknown>): Observable<unknown>;
  Finalize(data: Record<string, unknown>): Observable<unknown>;
  CreateAvoir(data: Record<string, unknown>): Observable<unknown>;
  ListAvoirsByFacture(data: Record<string, unknown>): Observable<unknown>;
}

export interface FactureSettingsServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetBySociete(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  UploadLogo(data: Record<string, unknown>): Observable<unknown>;
}

export interface FactureGenerationServiceClient {
  GenerateNextNumero(data: Record<string, unknown>): Observable<unknown>;
  CalculateTotals(data: Record<string, unknown>): Observable<unknown>;
}

// ==================== GRPC CLIENT ====================

@Injectable()
export class FacturesGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(FacturesGrpcClient.name);
  private statutFactureService: StatutFactureServiceClient;
  private emissionFactureService: EmissionFactureServiceClient;
  private ligneFactureService: LigneFactureServiceClient;
  private factureService: FactureServiceClient;
  private factureSettingsService: FactureSettingsServiceClient;
  private factureGenerationService: FactureGenerationServiceClient;

  constructor(@Inject('FINANCE_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.statutFactureService =
      this.client.getService<StatutFactureServiceClient>(
        'StatutFactureService',
      );
    this.emissionFactureService =
      this.client.getService<EmissionFactureServiceClient>(
        'EmissionFactureService',
      );
    this.ligneFactureService =
      this.client.getService<LigneFactureServiceClient>(
        'LigneFactureService',
      );
    this.factureService =
      this.client.getService<FactureServiceClient>('FactureService');
    this.factureSettingsService =
      this.client.getService<FactureSettingsServiceClient>(
        'FactureSettingsService',
      );
    this.factureGenerationService =
      this.client.getService<FactureGenerationServiceClient>(
        'FactureGenerationService',
      );
  }

  // ==================== STATUT FACTURE ====================

  createStatutFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutFactureService.Create(data),
      this.logger,
      'StatutFactureService',
      'Create',
    );
  }

  updateStatutFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutFactureService.Update(data),
      this.logger,
      'StatutFactureService',
      'Update',
    );
  }

  getStatutFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutFactureService.Get(data),
      this.logger,
      'StatutFactureService',
      'Get',
    );
  }

  getStatutFactureByCode(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutFactureService.GetByCode(data),
      this.logger,
      'StatutFactureService',
      'GetByCode',
    );
  }

  listStatutsFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutFactureService.List(data),
      this.logger,
      'StatutFactureService',
      'List',
    );
  }

  deleteStatutFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutFactureService.Delete(data),
      this.logger,
      'StatutFactureService',
      'Delete',
    );
  }

  // ==================== EMISSION FACTURE ====================

  createEmissionFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.emissionFactureService.Create(data),
      this.logger,
      'EmissionFactureService',
      'Create',
    );
  }

  updateEmissionFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.emissionFactureService.Update(data),
      this.logger,
      'EmissionFactureService',
      'Update',
    );
  }

  getEmissionFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.emissionFactureService.Get(data),
      this.logger,
      'EmissionFactureService',
      'Get',
    );
  }

  listEmissionsFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.emissionFactureService.List(data),
      this.logger,
      'EmissionFactureService',
      'List',
    );
  }

  deleteEmissionFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.emissionFactureService.Delete(data),
      this.logger,
      'EmissionFactureService',
      'Delete',
    );
  }

  // ==================== LIGNE FACTURE ====================

  createLigneFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.ligneFactureService.Create(data),
      this.logger,
      'LigneFactureService',
      'Create',
    );
  }

  updateLigneFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.ligneFactureService.Update(data),
      this.logger,
      'LigneFactureService',
      'Update',
    );
  }

  getLigneFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.ligneFactureService.Get(data),
      this.logger,
      'LigneFactureService',
      'Get',
    );
  }

  listLignesFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.ligneFactureService.List(data),
      this.logger,
      'LigneFactureService',
      'List',
    );
  }

  deleteLigneFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.ligneFactureService.Delete(data),
      this.logger,
      'LigneFactureService',
      'Delete',
    );
  }

  // ==================== FACTURE ====================

  createFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureService.Create(data),
      this.logger,
      'FactureService',
      'Create',
    );
  }

  updateFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureService.Update(data),
      this.logger,
      'FactureService',
      'Update',
    );
  }

  getFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureService.Get(data),
      this.logger,
      'FactureService',
      'Get',
    );
  }

  getFactureByNumero(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureService.GetByNumero(data),
      this.logger,
      'FactureService',
      'GetByNumero',
    );
  }

  listFactures(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureService.List(data),
      this.logger,
      'FactureService',
      'List',
    );
  }

  deleteFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureService.Delete(data),
      this.logger,
      'FactureService',
      'Delete',
    );
  }

  validateFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureService.Validate(data),
      this.logger,
      'FactureService',
      'Validate',
    );
  }

  finalizeFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureService.Finalize(data),
      this.logger,
      'FactureService',
      'Finalize',
    );
  }

  createAvoir(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureService.CreateAvoir(data),
      this.logger,
      'FactureService',
      'CreateAvoir',
    );
  }

  listAvoirsByFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureService.ListAvoirsByFacture(data),
      this.logger,
      'FactureService',
      'ListAvoirsByFacture',
    );
  }

  // ==================== FACTURE SETTINGS ====================

  createFactureSettings(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureSettingsService.Create(data),
      this.logger,
      'FactureSettingsService',
      'Create',
    );
  }

  updateFactureSettings(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureSettingsService.Update(data),
      this.logger,
      'FactureSettingsService',
      'Update',
    );
  }

  getFactureSettings(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureSettingsService.Get(data),
      this.logger,
      'FactureSettingsService',
      'Get',
    );
  }

  getFactureSettingsBySociete(
    data: Record<string, unknown>,
  ): Observable<unknown> {
    return wrapGrpcCall(
      this.factureSettingsService.GetBySociete(data),
      this.logger,
      'FactureSettingsService',
      'GetBySociete',
    );
  }

  deleteFactureSettings(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureSettingsService.Delete(data),
      this.logger,
      'FactureSettingsService',
      'Delete',
    );
  }

  uploadLogo(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureSettingsService.UploadLogo(data),
      this.logger,
      'FactureSettingsService',
      'UploadLogo',
    );
  }

  // ==================== FACTURE GENERATION ====================

  generateNextNumero(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureGenerationService.GenerateNextNumero(data),
      this.logger,
      'FactureGenerationService',
      'GenerateNextNumero',
    );
  }

  calculateTotals(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.factureGenerationService.CalculateTotals(data),
      this.logger,
      'FactureGenerationService',
      'CalculateTotals',
    );
  }
}
