import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

export interface StatutClientServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByCode(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface AdresseServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  ListByClient(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface ClientBaseServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  Search(data: Record<string, unknown>): Observable<unknown>;
}

export interface ClientEntrepriseServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface ClientPartenaireServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class ClientsGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(ClientsGrpcClient.name);

  private statutClientService: StatutClientServiceClient;
  private adresseService: AdresseServiceClient;
  private clientBaseService: ClientBaseServiceClient;
  private clientEntrepriseService: ClientEntrepriseServiceClient;
  private clientPartenaireService: ClientPartenaireServiceClient;

  constructor(@Inject('CORE_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.statutClientService =
      this.client.getService<StatutClientServiceClient>('StatutClientService');
    this.adresseService = this.client.getService<AdresseServiceClient>('AdresseService');
    this.clientBaseService =
      this.client.getService<ClientBaseServiceClient>('ClientBaseService');
    this.clientEntrepriseService =
      this.client.getService<ClientEntrepriseServiceClient>('ClientEntrepriseService');
    this.clientPartenaireService =
      this.client.getService<ClientPartenaireServiceClient>('ClientPartenaireService');
  }

  createStatutClient(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutClientService.Create(data),
      this.logger,
      'StatutClientService',
      'Create',
    );
  }

  updateStatutClient(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutClientService.Update(data),
      this.logger,
      'StatutClientService',
      'Update',
    );
  }

  getStatutClient(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutClientService.Get(data),
      this.logger,
      'StatutClientService',
      'Get',
    );
  }

  getStatutClientByCode(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutClientService.GetByCode(data),
      this.logger,
      'StatutClientService',
      'GetByCode',
    );
  }

  listStatutsClient(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutClientService.List(data),
      this.logger,
      'StatutClientService',
      'List',
    );
  }

  deleteStatutClient(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.statutClientService.Delete(data),
      this.logger,
      'StatutClientService',
      'Delete',
    );
  }

  createAdresse(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.adresseService.Create(data),
      this.logger,
      'AdresseService',
      'Create',
    );
  }

  updateAdresse(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.adresseService.Update(data),
      this.logger,
      'AdresseService',
      'Update',
    );
  }

  getAdresse(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.adresseService.Get(data),
      this.logger,
      'AdresseService',
      'Get',
    );
  }

  listAdressesByClient(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.adresseService.ListByClient(data),
      this.logger,
      'AdresseService',
      'ListByClient',
    );
  }

  deleteAdresse(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.adresseService.Delete(data),
      this.logger,
      'AdresseService',
      'Delete',
    );
  }

  createClientBase(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientBaseService.Create(data),
      this.logger,
      'ClientBaseService',
      'Create',
    );
  }

  updateClientBase(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientBaseService.Update(data),
      this.logger,
      'ClientBaseService',
      'Update',
    );
  }

  getClientBase(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientBaseService.Get(data),
      this.logger,
      'ClientBaseService',
      'Get',
    );
  }

  listClientsBase(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientBaseService.List(data),
      this.logger,
      'ClientBaseService',
      'List',
    );
  }

  deleteClientBase(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientBaseService.Delete(data),
      this.logger,
      'ClientBaseService',
      'Delete',
    );
  }

  searchClientBase(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientBaseService.Search(data),
      this.logger,
      'ClientBaseService',
      'Search',
    );
  }

  createClientEntreprise(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientEntrepriseService.Create(data),
      this.logger,
      'ClientEntrepriseService',
      'Create',
    );
  }

  updateClientEntreprise(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientEntrepriseService.Update(data),
      this.logger,
      'ClientEntrepriseService',
      'Update',
    );
  }

  getClientEntreprise(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientEntrepriseService.Get(data),
      this.logger,
      'ClientEntrepriseService',
      'Get',
    );
  }

  listClientsEntreprise(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientEntrepriseService.List(data),
      this.logger,
      'ClientEntrepriseService',
      'List',
    );
  }

  deleteClientEntreprise(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientEntrepriseService.Delete(data),
      this.logger,
      'ClientEntrepriseService',
      'Delete',
    );
  }

  createClientPartenaire(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientPartenaireService.Create(data),
      this.logger,
      'ClientPartenaireService',
      'Create',
    );
  }

  updateClientPartenaire(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientPartenaireService.Update(data),
      this.logger,
      'ClientPartenaireService',
      'Update',
    );
  }

  getClientPartenaire(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientPartenaireService.Get(data),
      this.logger,
      'ClientPartenaireService',
      'Get',
    );
  }

  listClientsPartenaire(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientPartenaireService.List(data),
      this.logger,
      'ClientPartenaireService',
      'List',
    );
  }

  deleteClientPartenaire(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.clientPartenaireService.Delete(data),
      this.logger,
      'ClientPartenaireService',
      'Delete',
    );
  }
}
