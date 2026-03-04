import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

// ========== Service Interfaces ==========

export interface TypeActiviteServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByCode(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface ActiviteServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  ListByClient(data: Record<string, unknown>): Observable<unknown>;
  ListByContrat(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface TacheServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  ListByAssigne(data: Record<string, unknown>): Observable<unknown>;
  ListByClient(data: Record<string, unknown>): Observable<unknown>;
  ListByContrat(data: Record<string, unknown>): Observable<unknown>;
  ListByFacture(data: Record<string, unknown>): Observable<unknown>;
  ListEnRetard(data: Record<string, unknown>): Observable<unknown>;
  GetStats(data: Record<string, unknown>): Observable<unknown>;
  GetAlertes(data: Record<string, unknown>): Observable<unknown>;
  MarquerEnCours(data: Record<string, unknown>): Observable<unknown>;
  MarquerTerminee(data: Record<string, unknown>): Observable<unknown>;
  MarquerAnnulee(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface EvenementSuiviServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  ListByExpedition(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

// ========== gRPC Client ==========

@Injectable()
export class ActivitesGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(ActivitesGrpcClient.name);
  private typeActiviteService!: TypeActiviteServiceClient;
  private activiteService!: ActiviteServiceClient;
  private tacheService!: TacheServiceClient;
  private evenementSuiviService!: EvenementSuiviServiceClient;

  constructor(@Inject('ENGAGEMENT_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.typeActiviteService =
      this.client.getService<TypeActiviteServiceClient>('TypeActiviteService');
    this.activiteService =
      this.client.getService<ActiviteServiceClient>('ActiviteService');
    this.tacheService =
      this.client.getService<TacheServiceClient>('TacheService');
    this.evenementSuiviService =
      this.client.getService<EvenementSuiviServiceClient>('EvenementSuiviService');
  }

  // ========== TypeActiviteService ==========

  createTypeActivite(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.typeActiviteService.Create(data), this.logger, 'TypeActiviteService', 'Create');
  }

  updateTypeActivite(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.typeActiviteService.Update(data), this.logger, 'TypeActiviteService', 'Update');
  }

  getTypeActivite(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.typeActiviteService.Get(data), this.logger, 'TypeActiviteService', 'Get');
  }

  getTypeActiviteByCode(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.typeActiviteService.GetByCode(data), this.logger, 'TypeActiviteService', 'GetByCode');
  }

  listTypesActivite(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.typeActiviteService.List(data), this.logger, 'TypeActiviteService', 'List');
  }

  deleteTypeActivite(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.typeActiviteService.Delete(data), this.logger, 'TypeActiviteService', 'Delete');
  }

  // ========== ActiviteService ==========

  createActivite(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.activiteService.Create(data), this.logger, 'ActiviteService', 'Create');
  }

  updateActivite(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.activiteService.Update(data), this.logger, 'ActiviteService', 'Update');
  }

  getActivite(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.activiteService.Get(data), this.logger, 'ActiviteService', 'Get');
  }

  listActivitesByClient(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.activiteService.ListByClient(data), this.logger, 'ActiviteService', 'ListByClient');
  }

  listActivitesByContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.activiteService.ListByContrat(data), this.logger, 'ActiviteService', 'ListByContrat');
  }

  listActivites(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.activiteService.List(data), this.logger, 'ActiviteService', 'List');
  }

  deleteActivite(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.activiteService.Delete(data), this.logger, 'ActiviteService', 'Delete');
  }

  // ========== TacheService ==========

  createTache(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.Create(data), this.logger, 'TacheService', 'Create');
  }

  updateTache(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.Update(data), this.logger, 'TacheService', 'Update');
  }

  getTache(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.Get(data), this.logger, 'TacheService', 'Get');
  }

  listTaches(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.List(data), this.logger, 'TacheService', 'List');
  }

  listTachesByAssigne(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.ListByAssigne(data), this.logger, 'TacheService', 'ListByAssigne');
  }

  listTachesByClient(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.ListByClient(data), this.logger, 'TacheService', 'ListByClient');
  }

  listTachesByContrat(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.ListByContrat(data), this.logger, 'TacheService', 'ListByContrat');
  }

  listTachesByFacture(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.ListByFacture(data), this.logger, 'TacheService', 'ListByFacture');
  }

  listTachesEnRetard(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.ListEnRetard(data), this.logger, 'TacheService', 'ListEnRetard');
  }

  getTacheStats(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.GetStats(data), this.logger, 'TacheService', 'GetStats');
  }

  getTacheAlertes(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.GetAlertes(data), this.logger, 'TacheService', 'GetAlertes');
  }

  marquerTacheEnCours(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.MarquerEnCours(data), this.logger, 'TacheService', 'MarquerEnCours');
  }

  marquerTacheTerminee(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.MarquerTerminee(data), this.logger, 'TacheService', 'MarquerTerminee');
  }

  marquerTacheAnnulee(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.MarquerAnnulee(data), this.logger, 'TacheService', 'MarquerAnnulee');
  }

  deleteTache(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.tacheService.Delete(data), this.logger, 'TacheService', 'Delete');
  }

  // ========== EvenementSuiviService ==========

  createEvenementSuivi(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.evenementSuiviService.Create(data), this.logger, 'EvenementSuiviService', 'Create');
  }

  updateEvenementSuivi(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.evenementSuiviService.Update(data), this.logger, 'EvenementSuiviService', 'Update');
  }

  getEvenementSuivi(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.evenementSuiviService.Get(data), this.logger, 'EvenementSuiviService', 'Get');
  }

  listEvenementsByExpedition(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.evenementSuiviService.ListByExpedition(data), this.logger, 'EvenementSuiviService', 'ListByExpedition');
  }

  listEvenementsSuivi(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.evenementSuiviService.List(data), this.logger, 'EvenementSuiviService', 'List');
  }

  deleteEvenementSuivi(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.evenementSuiviService.Delete(data), this.logger, 'EvenementSuiviService', 'Delete');
  }
}
