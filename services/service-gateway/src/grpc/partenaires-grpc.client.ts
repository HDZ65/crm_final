import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

export interface PartenaireCommercialServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  Search(data: Record<string, unknown>): Observable<unknown>;
  Activer(data: Record<string, unknown>): Observable<unknown>;
  Desactiver(data: Record<string, unknown>): Observable<unknown>;
  ActiverPourSociete(data: Record<string, unknown>): Observable<unknown>;
  DesactiverPourSociete(data: Record<string, unknown>): Observable<unknown>;
  ListBySociete(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class PartenairesGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(PartenairesGrpcClient.name);
  private partenaireCommercialService: PartenaireCommercialServiceClient;

  constructor(@Inject('COMMERCIAL_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.partenaireCommercialService =
      this.client.getService<PartenaireCommercialServiceClient>('PartenaireCommercialService');
  }

  createPartenaireCommercial(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.partenaireCommercialService.Create(data),
      this.logger,
      'PartenaireCommercialService',
      'Create',
    );
  }

  updatePartenaireCommercial(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.partenaireCommercialService.Update(data),
      this.logger,
      'PartenaireCommercialService',
      'Update',
    );
  }

  getPartenaireCommercial(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.partenaireCommercialService.Get(data),
      this.logger,
      'PartenaireCommercialService',
      'Get',
    );
  }

  listPartenairesCommerciaux(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.partenaireCommercialService.List(data),
      this.logger,
      'PartenaireCommercialService',
      'List',
    );
  }

  deletePartenaireCommercial(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.partenaireCommercialService.Delete(data),
      this.logger,
      'PartenaireCommercialService',
      'Delete',
    );
  }

  searchPartenairesCommerciaux(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.partenaireCommercialService.Search(data),
      this.logger,
      'PartenaireCommercialService',
      'Search',
    );
  }

  activerPartenaireCommercial(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.partenaireCommercialService.Activer(data),
      this.logger,
      'PartenaireCommercialService',
      'Activer',
    );
  }

  desactiverPartenaireCommercial(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.partenaireCommercialService.Desactiver(data),
      this.logger,
      'PartenaireCommercialService',
      'Desactiver',
    );
  }

  activerPartenairePourSociete(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.partenaireCommercialService.ActiverPourSociete(data),
      this.logger,
      'PartenaireCommercialService',
      'ActiverPourSociete',
    );
  }

  desactiverPartenairePourSociete(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.partenaireCommercialService.DesactiverPourSociete(data),
      this.logger,
      'PartenaireCommercialService',
      'DesactiverPourSociete',
    );
  }

  listPartenairesBySociete(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.partenaireCommercialService.ListBySociete(data),
      this.logger,
      'PartenaireCommercialService',
      'ListBySociete',
    );
  }
}
