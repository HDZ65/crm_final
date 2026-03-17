import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

// ==================== SERVICE INTERFACES ====================

export interface PieceJointeServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  ListByEntite(data: Record<string, unknown>): Observable<unknown>;
  ListByType(data: Record<string, unknown>): Observable<unknown>;
  GetVersions(data: Record<string, unknown>): Observable<unknown>;
  LogAccess(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface BoiteMailServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByUtilisateur(data: Record<string, unknown>): Observable<unknown>;
  GetDefault(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  ListByUtilisateur(data: Record<string, unknown>): Observable<unknown>;
  SetDefault(data: Record<string, unknown>): Observable<unknown>;
  Activer(data: Record<string, unknown>): Observable<unknown>;
  Desactiver(data: Record<string, unknown>): Observable<unknown>;
  UpdateOAuthTokens(data: Record<string, unknown>): Observable<unknown>;
  TestConnection(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class DocumentsGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(DocumentsGrpcClient.name);
  private pieceJointeService: PieceJointeServiceClient;
  private boiteMailService: BoiteMailServiceClient;

  constructor(@Inject('CORE_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.pieceJointeService =
      this.client.getService<PieceJointeServiceClient>('PieceJointeService');
    this.boiteMailService =
      this.client.getService<BoiteMailServiceClient>('BoiteMailService');
  }

  // ==================== PieceJointeService ====================

  createPieceJointe(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.pieceJointeService.Create(data),
      this.logger,
      'PieceJointeService',
      'Create',
    );
  }

  updatePieceJointe(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.pieceJointeService.Update(data),
      this.logger,
      'PieceJointeService',
      'Update',
    );
  }

  getPieceJointe(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.pieceJointeService.Get(data),
      this.logger,
      'PieceJointeService',
      'Get',
    );
  }

  listPiecesJointes(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.pieceJointeService.List(data),
      this.logger,
      'PieceJointeService',
      'List',
    );
  }

  listPiecesJointesByEntite(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.pieceJointeService.ListByEntite(data),
      this.logger,
      'PieceJointeService',
      'ListByEntite',
    );
  }

  listPiecesJointesByType(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.pieceJointeService.ListByType(data),
      this.logger,
      'PieceJointeService',
      'ListByType',
    );
  }

  getPieceJointeVersions(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.pieceJointeService.GetVersions(data),
      this.logger,
      'PieceJointeService',
      'GetVersions',
    );
  }

  logPieceJointeAccess(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.pieceJointeService.LogAccess(data),
      this.logger,
      'PieceJointeService',
      'LogAccess',
    );
  }

  deletePieceJointe(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.pieceJointeService.Delete(data),
      this.logger,
      'PieceJointeService',
      'Delete',
    );
  }

  // ==================== BoiteMailService ====================

  createBoiteMail(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.boiteMailService.Create(data),
      this.logger,
      'BoiteMailService',
      'Create',
    );
  }

  updateBoiteMail(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.boiteMailService.Update(data),
      this.logger,
      'BoiteMailService',
      'Update',
    );
  }

  getBoiteMail(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.boiteMailService.Get(data),
      this.logger,
      'BoiteMailService',
      'Get',
    );
  }

  getBoiteMailByUtilisateur(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.boiteMailService.GetByUtilisateur(data),
      this.logger,
      'BoiteMailService',
      'GetByUtilisateur',
    );
  }

  getDefaultBoiteMail(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.boiteMailService.GetDefault(data),
      this.logger,
      'BoiteMailService',
      'GetDefault',
    );
  }

  listBoitesMail(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.boiteMailService.List(data),
      this.logger,
      'BoiteMailService',
      'List',
    );
  }

  listBoitesMailByUtilisateur(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.boiteMailService.ListByUtilisateur(data),
      this.logger,
      'BoiteMailService',
      'ListByUtilisateur',
    );
  }

  setDefaultBoiteMail(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.boiteMailService.SetDefault(data),
      this.logger,
      'BoiteMailService',
      'SetDefault',
    );
  }

  activerBoiteMail(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.boiteMailService.Activer(data),
      this.logger,
      'BoiteMailService',
      'Activer',
    );
  }

  desactiverBoiteMail(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.boiteMailService.Desactiver(data),
      this.logger,
      'BoiteMailService',
      'Desactiver',
    );
  }

  updateOAuthTokens(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.boiteMailService.UpdateOAuthTokens(data),
      this.logger,
      'BoiteMailService',
      'UpdateOAuthTokens',
    );
  }

  testConnection(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.boiteMailService.TestConnection(data),
      this.logger,
      'BoiteMailService',
      'TestConnection',
    );
  }

  deleteBoiteMail(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.boiteMailService.Delete(data),
      this.logger,
      'BoiteMailService',
      'Delete',
    );
  }
}
