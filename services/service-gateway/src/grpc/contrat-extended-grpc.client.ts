import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

// ========== Service Interfaces ==========

export interface StatutContratServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByCode(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface LigneContratServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  ListByContrat(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface HistoriqueStatutContratServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  ListByContrat(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface ContractOrchestrationServiceClient {
  Activate(data: Record<string, unknown>): Observable<unknown>;
  Suspend(data: Record<string, unknown>): Observable<unknown>;
  Terminate(data: Record<string, unknown>): Observable<unknown>;
  PortIn(data: Record<string, unknown>): Observable<unknown>;
  GetHistory(data: Record<string, unknown>): Observable<unknown>;
}

export interface ContratImportServiceClient {
  ImportFromExternal(data: Record<string, unknown>): Observable<unknown>;
  GetImportStatus(data: Record<string, unknown>): Observable<unknown>;
}

// ========== Extended gRPC Client ==========

@Injectable()
export class ContratExtendedGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(ContratExtendedGrpcClient.name);

  private statutContratService: StatutContratServiceClient;
  private ligneContratService: LigneContratServiceClient;
  private historiqueStatutContratService: HistoriqueStatutContratServiceClient;
  private contractOrchestrationService: ContractOrchestrationServiceClient;
  private contratImportService: ContratImportServiceClient;

  constructor(@Inject('COMMERCIAL_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.statutContratService =
      this.client.getService<StatutContratServiceClient>('StatutContratService');
    this.ligneContratService =
      this.client.getService<LigneContratServiceClient>('LigneContratService');
    this.historiqueStatutContratService =
      this.client.getService<HistoriqueStatutContratServiceClient>(
        'HistoriqueStatutContratService',
      );
    this.contractOrchestrationService =
      this.client.getService<ContractOrchestrationServiceClient>(
        'ContractOrchestrationService',
      );
    this.contratImportService =
      this.client.getService<ContratImportServiceClient>('ContratImportService');
  }

  // ========== StatutContratService ==========

  createStatutContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutContratService.Create(data),
      this.logger,
      'StatutContratService',
      'Create',
    );
  }

  updateStatutContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutContratService.Update(data),
      this.logger,
      'StatutContratService',
      'Update',
    );
  }

  getStatutContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutContratService.Get(data),
      this.logger,
      'StatutContratService',
      'Get',
    );
  }

  getStatutContratByCode(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutContratService.GetByCode(data),
      this.logger,
      'StatutContratService',
      'GetByCode',
    );
  }

  listStatutsContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutContratService.List(data),
      this.logger,
      'StatutContratService',
      'List',
    );
  }

  deleteStatutContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutContratService.Delete(data),
      this.logger,
      'StatutContratService',
      'Delete',
    );
  }

  // ========== LigneContratService ==========

  createLigneContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.ligneContratService.Create(data),
      this.logger,
      'LigneContratService',
      'Create',
    );
  }

  updateLigneContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.ligneContratService.Update(data),
      this.logger,
      'LigneContratService',
      'Update',
    );
  }

  getLigneContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.ligneContratService.Get(data),
      this.logger,
      'LigneContratService',
      'Get',
    );
  }

  listLignesByContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.ligneContratService.ListByContrat(data),
      this.logger,
      'LigneContratService',
      'ListByContrat',
    );
  }

  deleteLigneContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.ligneContratService.Delete(data),
      this.logger,
      'LigneContratService',
      'Delete',
    );
  }

  // ========== HistoriqueStatutContratService ==========

  createHistoriqueStatutContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.historiqueStatutContratService.Create(data),
      this.logger,
      'HistoriqueStatutContratService',
      'Create',
    );
  }

  getHistoriqueStatutContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.historiqueStatutContratService.Get(data),
      this.logger,
      'HistoriqueStatutContratService',
      'Get',
    );
  }

  listHistoriqueByContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.historiqueStatutContratService.ListByContrat(data),
      this.logger,
      'HistoriqueStatutContratService',
      'ListByContrat',
    );
  }

  deleteHistoriqueStatutContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.historiqueStatutContratService.Delete(data),
      this.logger,
      'HistoriqueStatutContratService',
      'Delete',
    );
  }

  // ========== ContractOrchestrationService ==========

  activateContract(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.contractOrchestrationService.Activate(data),
      this.logger,
      'ContractOrchestrationService',
      'Activate',
    );
  }

  suspendContract(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.contractOrchestrationService.Suspend(data),
      this.logger,
      'ContractOrchestrationService',
      'Suspend',
    );
  }

  terminateContract(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.contractOrchestrationService.Terminate(data),
      this.logger,
      'ContractOrchestrationService',
      'Terminate',
    );
  }

  portInContract(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.contractOrchestrationService.PortIn(data),
      this.logger,
      'ContractOrchestrationService',
      'PortIn',
    );
  }

  getOrchestrationHistory(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.contractOrchestrationService.GetHistory(data),
      this.logger,
      'ContractOrchestrationService',
      'GetHistory',
    );
  }

  // ========== ContratImportService ==========

  importFromExternal(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.contratImportService.ImportFromExternal(data),
      this.logger,
      'ContratImportService',
      'ImportFromExternal',
    );
  }

  getImportStatus(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.contratImportService.GetImportStatus(data),
      this.logger,
      'ContratImportService',
      'GetImportStatus',
    );
  }
}
