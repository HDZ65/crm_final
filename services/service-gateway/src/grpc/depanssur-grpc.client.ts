import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

interface DepanssurServiceClient {
  CreateAbonnement(data: Record<string, unknown>): Observable<unknown>;
  GetAbonnement(data: Record<string, unknown>): Observable<unknown>;
  GetAbonnementByClient(data: Record<string, unknown>): Observable<unknown>;
  UpdateAbonnement(data: Record<string, unknown>): Observable<unknown>;
  ListAbonnements(data: Record<string, unknown>): Observable<unknown>;
  CreateDossier(data: Record<string, unknown>): Observable<unknown>;
  GetDossier(data: Record<string, unknown>): Observable<unknown>;
  GetDossierByReference(data: Record<string, unknown>): Observable<unknown>;
  UpdateDossier(data: Record<string, unknown>): Observable<unknown>;
  ListDossiers(data: Record<string, unknown>): Observable<unknown>;
  DeleteDossier(data: Record<string, unknown>): Observable<unknown>;
  CreateOption(data: Record<string, unknown>): Observable<unknown>;
  GetOption(data: Record<string, unknown>): Observable<unknown>;
  UpdateOption(data: Record<string, unknown>): Observable<unknown>;
  ListOptions(data: Record<string, unknown>): Observable<unknown>;
  DeleteOption(data: Record<string, unknown>): Observable<unknown>;
  GetCompteur(data: Record<string, unknown>): Observable<unknown>;
  UpdateCompteur(data: Record<string, unknown>): Observable<unknown>;
  ResetCompteur(data: Record<string, unknown>): Observable<unknown>;
  ListCompteurs(data: Record<string, unknown>): Observable<unknown>;
  CreateConsentement(data: Record<string, unknown>): Observable<unknown>;
  GetConsentement(data: Record<string, unknown>): Observable<unknown>;
  UpdateConsentement(data: Record<string, unknown>): Observable<unknown>;
  ListConsentements(data: Record<string, unknown>): Observable<unknown>;
  DeleteConsentement(data: Record<string, unknown>): Observable<unknown>;
  HandleWebhook(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class DepanssurGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(DepanssurGrpcClient.name);
  private depanssurService: DepanssurServiceClient;

  constructor(@Inject('CORE_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.depanssurService =
      this.client.getService<DepanssurServiceClient>('DepanssurService');
  }

  createAbonnement(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.CreateAbonnement(data),
      this.logger,
      'DepanssurService',
      'CreateAbonnement',
    );
  }

  getAbonnement(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.GetAbonnement(data),
      this.logger,
      'DepanssurService',
      'GetAbonnement',
    );
  }

  getAbonnementByClient(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.GetAbonnementByClient(data),
      this.logger,
      'DepanssurService',
      'GetAbonnementByClient',
    );
  }

  updateAbonnement(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.UpdateAbonnement(data),
      this.logger,
      'DepanssurService',
      'UpdateAbonnement',
    );
  }

  listAbonnements(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.ListAbonnements(data),
      this.logger,
      'DepanssurService',
      'ListAbonnements',
    );
  }

  createDossier(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.CreateDossier(data),
      this.logger,
      'DepanssurService',
      'CreateDossier',
    );
  }

  getDossier(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.GetDossier(data),
      this.logger,
      'DepanssurService',
      'GetDossier',
    );
  }

  getDossierByReference(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.GetDossierByReference(data),
      this.logger,
      'DepanssurService',
      'GetDossierByReference',
    );
  }

  updateDossier(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.UpdateDossier(data),
      this.logger,
      'DepanssurService',
      'UpdateDossier',
    );
  }

  listDossiers(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.ListDossiers(data),
      this.logger,
      'DepanssurService',
      'ListDossiers',
    );
  }

  deleteDossier(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.DeleteDossier(data),
      this.logger,
      'DepanssurService',
      'DeleteDossier',
    );
  }

  createOption(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.CreateOption(data),
      this.logger,
      'DepanssurService',
      'CreateOption',
    );
  }

  getOption(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.GetOption(data),
      this.logger,
      'DepanssurService',
      'GetOption',
    );
  }

  updateOption(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.UpdateOption(data),
      this.logger,
      'DepanssurService',
      'UpdateOption',
    );
  }

  listOptions(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.ListOptions(data),
      this.logger,
      'DepanssurService',
      'ListOptions',
    );
  }

  deleteOption(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.DeleteOption(data),
      this.logger,
      'DepanssurService',
      'DeleteOption',
    );
  }

  getCompteur(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.GetCompteur(data),
      this.logger,
      'DepanssurService',
      'GetCompteur',
    );
  }

  updateCompteur(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.UpdateCompteur(data),
      this.logger,
      'DepanssurService',
      'UpdateCompteur',
    );
  }

  resetCompteur(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.ResetCompteur(data),
      this.logger,
      'DepanssurService',
      'ResetCompteur',
    );
  }

  listCompteurs(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.ListCompteurs(data),
      this.logger,
      'DepanssurService',
      'ListCompteurs',
    );
  }

  createConsentement(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.CreateConsentement(data),
      this.logger,
      'DepanssurService',
      'CreateConsentement',
    );
  }

  getConsentement(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.GetConsentement(data),
      this.logger,
      'DepanssurService',
      'GetConsentement',
    );
  }

  updateConsentement(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.UpdateConsentement(data),
      this.logger,
      'DepanssurService',
      'UpdateConsentement',
    );
  }

  listConsentements(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.ListConsentements(data),
      this.logger,
      'DepanssurService',
      'ListConsentements',
    );
  }

  deleteConsentement(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.DeleteConsentement(data),
      this.logger,
      'DepanssurService',
      'DeleteConsentement',
    );
  }

  handleWebhook(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.depanssurService.HandleWebhook(data),
      this.logger,
      'DepanssurService',
      'HandleWebhook',
    );
  }
}
