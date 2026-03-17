import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

// ============================================================================
// gRPC Service Interface — ControleQualiteService
// ============================================================================

interface ControleQualiteServiceClient {
  // Controles
  CreerControle(data: Record<string, unknown>): Observable<unknown>;
  GetControle(data: Record<string, unknown>): Observable<unknown>;
  GetControles(data: Record<string, unknown>): Observable<unknown>;
  GetControleByContrat(data: Record<string, unknown>): Observable<unknown>;
  // Workflow
  ValiderCritere(data: Record<string, unknown>): Observable<unknown>;
  RejeterControle(data: Record<string, unknown>): Observable<unknown>;
  ValiderControle(data: Record<string, unknown>): Observable<unknown>;
  RetournerControle(data: Record<string, unknown>): Observable<unknown>;
  // Criteres
  GetCriteres(data: Record<string, unknown>): Observable<unknown>;
  CreateCritere(data: Record<string, unknown>): Observable<unknown>;
  UpdateCritere(data: Record<string, unknown>): Observable<unknown>;
  DeleteCritere(data: Record<string, unknown>): Observable<unknown>;
  // Regles
  GetRegles(data: Record<string, unknown>): Observable<unknown>;
  CreateRegle(data: Record<string, unknown>): Observable<unknown>;
  UpdateRegle(data: Record<string, unknown>): Observable<unknown>;
  // Stats
  GetStatistiques(data: Record<string, unknown>): Observable<unknown>;
}

// ============================================================================
// QualiteGrpcClient — facade over ControleQualiteService
// ============================================================================

@Injectable()
export class QualiteGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(QualiteGrpcClient.name);

  private controleQualiteService!: ControleQualiteServiceClient;

  constructor(@Inject('COMMERCIAL_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.controleQualiteService =
      this.client.getService<ControleQualiteServiceClient>('ControleQualiteService');
  }

  // ===========================================================================
  // Controles
  // ===========================================================================

  creerControle(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.CreerControle(data),
      this.logger,
      'ControleQualiteService',
      'CreerControle',
    );
  }

  getControle(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.GetControle(data),
      this.logger,
      'ControleQualiteService',
      'GetControle',
    );
  }

  getControles(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.GetControles(data),
      this.logger,
      'ControleQualiteService',
      'GetControles',
    );
  }

  getControleByContrat(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.GetControleByContrat(data),
      this.logger,
      'ControleQualiteService',
      'GetControleByContrat',
    );
  }

  // ===========================================================================
  // Workflow
  // ===========================================================================

  validerCritere(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.ValiderCritere(data),
      this.logger,
      'ControleQualiteService',
      'ValiderCritere',
    );
  }

  rejeterControle(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.RejeterControle(data),
      this.logger,
      'ControleQualiteService',
      'RejeterControle',
    );
  }

  validerControle(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.ValiderControle(data),
      this.logger,
      'ControleQualiteService',
      'ValiderControle',
    );
  }

  retournerControle(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.RetournerControle(data),
      this.logger,
      'ControleQualiteService',
      'RetournerControle',
    );
  }

  // ===========================================================================
  // Criteres
  // ===========================================================================

  getCriteres(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.GetCriteres(data),
      this.logger,
      'ControleQualiteService',
      'GetCriteres',
    );
  }

  createCritere(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.CreateCritere(data),
      this.logger,
      'ControleQualiteService',
      'CreateCritere',
    );
  }

  updateCritere(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.UpdateCritere(data),
      this.logger,
      'ControleQualiteService',
      'UpdateCritere',
    );
  }

  deleteCritere(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.DeleteCritere(data),
      this.logger,
      'ControleQualiteService',
      'DeleteCritere',
    );
  }

  // ===========================================================================
  // Regles
  // ===========================================================================

  getRegles(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.GetRegles(data),
      this.logger,
      'ControleQualiteService',
      'GetRegles',
    );
  }

  createRegle(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.CreateRegle(data),
      this.logger,
      'ControleQualiteService',
      'CreateRegle',
    );
  }

  updateRegle(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.UpdateRegle(data),
      this.logger,
      'ControleQualiteService',
      'UpdateRegle',
    );
  }

  // ===========================================================================
  // Statistiques
  // ===========================================================================

  getStatistiques(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.controleQualiteService.GetStatistiques(data),
      this.logger,
      'ControleQualiteService',
      'GetStatistiques',
    );
  }
}
