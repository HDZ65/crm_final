import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { StatutClientService } from './modules/statut-client/statut-client.service';
import { AdresseService } from './modules/adresse/adresse.service';
import { ClientBaseService } from './modules/client-base/client-base.service';
import { ClientEntrepriseService } from './modules/client-entreprise/client-entreprise.service';
import { ClientPartenaireService } from './modules/client-partenaire/client-partenaire.service';

import type {
  StatutClient,
  CreateStatutClientRequest,
  UpdateStatutClientRequest,
  GetStatutClientRequest,
  GetStatutClientByCodeRequest,
  ListStatutsClientRequest,
  ListStatutsClientResponse,
  DeleteStatutClientRequest,
  DeleteResponse,
  Adresse,
  CreateAdresseRequest,
  UpdateAdresseRequest,
  GetAdresseRequest,
  ListAdressesRequest,
  ListAdressesResponse,
  DeleteAdresseRequest,
  ClientBase,
  CreateClientBaseRequest,
  UpdateClientBaseRequest,
  GetClientBaseRequest,
  ListClientsBaseRequest,
  ListClientsBaseResponse,
  DeleteClientBaseRequest,
  SearchClientRequest,
  SearchClientResponse,
  ClientEntreprise,
  CreateClientEntrepriseRequest,
  UpdateClientEntrepriseRequest,
  GetClientEntrepriseRequest,
  ListClientsEntrepriseRequest,
  ListClientsEntrepriseResponse,
  DeleteClientEntrepriseRequest,
  ClientPartenaire,
  CreateClientPartenaireRequest,
  UpdateClientPartenaireRequest,
  GetClientPartenaireRequest,
  ListClientsPartenaireRequest,
  ListClientsPartenaireResponse,
  DeleteClientPartenaireRequest,
} from '@proto/clients/clients';

function toProtoDate(date: Date | null | undefined): string {
  return date ? date.toISOString() : '';
}

@Controller()
export class ClientsController {
  constructor(
    private readonly statutService: StatutClientService,
    private readonly adresseService: AdresseService,
    private readonly clientBaseService: ClientBaseService,
    private readonly clientEntrepriseService: ClientEntrepriseService,
    private readonly clientPartenaireService: ClientPartenaireService,
  ) {}

  // ===== STATUT CLIENT =====

  @GrpcMethod('StatutClientService', 'Create')
  async createStatut(data: CreateStatutClientRequest): Promise<StatutClient> {
    const entity = await this.statutService.create({
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordreAffichage,
    });
    return this.mapStatut(entity);
  }

  @GrpcMethod('StatutClientService', 'Update')
  async updateStatut(data: UpdateStatutClientRequest): Promise<StatutClient> {
    const entity = await this.statutService.update({
      id: data.id,
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordreAffichage,
    });
    return this.mapStatut(entity);
  }

  @GrpcMethod('StatutClientService', 'Get')
  async getStatut(data: GetStatutClientRequest): Promise<StatutClient> {
    const entity = await this.statutService.findById(data.id);
    return this.mapStatut(entity);
  }

  @GrpcMethod('StatutClientService', 'GetByCode')
  async getStatutByCode(data: GetStatutClientByCodeRequest): Promise<StatutClient> {
    const entity = await this.statutService.findByCode(data.code);
    return this.mapStatut(entity);
  }

  @GrpcMethod('StatutClientService', 'List')
  async listStatuts(data: ListStatutsClientRequest): Promise<ListStatutsClientResponse> {
    const result = await this.statutService.findAll(data.pagination);
    return {
      statuts: result.statuts.map((s) => this.mapStatut(s)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('StatutClientService', 'Delete')
  async deleteStatut(data: DeleteStatutClientRequest): Promise<DeleteResponse> {
    const success = await this.statutService.delete(data.id);
    return { success };
  }

  private mapStatut(entity: any): StatutClient {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      description: entity.description || '',
      ordreAffichage: entity.ordreAffichage || 0,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== ADRESSE =====

  @GrpcMethod('AdresseService', 'Create')
  async createAdresse(data: CreateAdresseRequest): Promise<Adresse> {
    const entity = await this.adresseService.create({
      clientBaseId: data.clientBaseId,
      ligne1: data.ligne1,
      ligne2: data.ligne2,
      codePostal: data.codePostal,
      ville: data.ville,
      pays: data.pays,
      type: data.type,
    });
    return this.mapAdresse(entity);
  }

  @GrpcMethod('AdresseService', 'Update')
  async updateAdresse(data: UpdateAdresseRequest): Promise<Adresse> {
    const entity = await this.adresseService.update({
      id: data.id,
      ligne1: data.ligne1,
      ligne2: data.ligne2,
      codePostal: data.codePostal,
      ville: data.ville,
      pays: data.pays,
      type: data.type,
    });
    return this.mapAdresse(entity);
  }

  @GrpcMethod('AdresseService', 'Get')
  async getAdresse(data: GetAdresseRequest): Promise<Adresse> {
    const entity = await this.adresseService.findById(data.id);
    return this.mapAdresse(entity);
  }

  @GrpcMethod('AdresseService', 'ListByClient')
  async listAdressesByClient(data: ListAdressesRequest): Promise<ListAdressesResponse> {
    const result = await this.adresseService.findByClient(data.clientBaseId, data.pagination);
    return {
      adresses: result.adresses.map((a) => this.mapAdresse(a)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('AdresseService', 'Delete')
  async deleteAdresse(data: DeleteAdresseRequest): Promise<DeleteResponse> {
    const success = await this.adresseService.delete(data.id);
    return { success };
  }

  private mapAdresse(entity: any): Adresse {
    return {
      id: entity.id,
      clientBaseId: entity.clientBaseId,
      ligne1: entity.ligne1,
      ligne2: entity.ligne2 || '',
      codePostal: entity.codePostal,
      ville: entity.ville,
      pays: entity.pays,
      type: entity.type,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== CLIENT BASE =====

  @GrpcMethod('ClientBaseService', 'Create')
  async createClientBase(data: CreateClientBaseRequest): Promise<ClientBase> {
    const entity = await this.clientBaseService.create({
      organisationId: data.organisationId,
      typeClient: data.typeClient,
      nom: data.nom,
      prenom: data.prenom,
      dateNaissance: data.dateNaissance,
      compteCode: data.compteCode,
      partenaireId: data.partenaireId,
      telephone: data.telephone,
      email: data.email,
      statut: data.statut,
    });
    return this.mapClientBase(entity);
  }

  @GrpcMethod('ClientBaseService', 'Update')
  async updateClientBase(data: UpdateClientBaseRequest): Promise<ClientBase> {
    const entity = await this.clientBaseService.update({
      id: data.id,
      typeClient: data.typeClient,
      nom: data.nom,
      prenom: data.prenom,
      dateNaissance: data.dateNaissance,
      compteCode: data.compteCode,
      partenaireId: data.partenaireId,
      telephone: data.telephone,
      email: data.email,
      statut: data.statut,
    });
    return this.mapClientBase(entity);
  }

  @GrpcMethod('ClientBaseService', 'Get')
  async getClientBase(data: GetClientBaseRequest): Promise<ClientBase> {
    const entity = await this.clientBaseService.findById(data.id);
    return this.mapClientBase(entity);
  }

  @GrpcMethod('ClientBaseService', 'List')
  async listClientsBase(data: ListClientsBaseRequest): Promise<ListClientsBaseResponse> {
    const result = await this.clientBaseService.findAll(
      {
        organisationId: data.organisationId,
        statutId: data.statutId,
        societeId: data.societeId,
        search: data.search,
      },
      {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
        sortBy: data.pagination?.sortBy,
        sortOrder: data.pagination?.sortOrder,
      },
    );
    return {
      clients: result.clients.map((c) => this.mapClientBase(c)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('ClientBaseService', 'Delete')
  async deleteClientBase(data: DeleteClientBaseRequest): Promise<DeleteResponse> {
    const success = await this.clientBaseService.delete(data.id);
    return { success };
  }

  @GrpcMethod('ClientBaseService', 'Search')
  async searchClient(data: SearchClientRequest): Promise<SearchClientResponse> {
    const result = await this.clientBaseService.search(data.organisationId, data.telephone, data.nom);
    return {
      found: result.found,
      client: result.client ? this.mapClientBase(result.client) : undefined,
    };
  }

  private mapClientBase(entity: any): ClientBase {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      typeClient: entity.typeClient,
      nom: entity.nom,
      prenom: entity.prenom,
      dateNaissance: toProtoDate(entity.dateNaissance),
      compteCode: entity.compteCode,
      partenaireId: entity.partenaireId,
      dateCreation: toProtoDate(entity.dateCreation),
      telephone: entity.telephone,
      email: entity.email || '',
      statut: entity.statut,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
      adresses: entity.adresses?.map((a: any) => this.mapAdresse(a)) || [],
    };
  }

  // ===== CLIENT ENTREPRISE =====

  @GrpcMethod('ClientEntrepriseService', 'Create')
  async createClientEntreprise(data: CreateClientEntrepriseRequest): Promise<ClientEntreprise> {
    const entity = await this.clientEntrepriseService.create({
      raisonSociale: data.raisonSociale,
      numeroTVA: data.numeroTva,
      siren: data.siren,
    });
    return this.mapClientEntreprise(entity);
  }

  @GrpcMethod('ClientEntrepriseService', 'Update')
  async updateClientEntreprise(data: UpdateClientEntrepriseRequest): Promise<ClientEntreprise> {
    const entity = await this.clientEntrepriseService.update({
      id: data.id,
      raisonSociale: data.raisonSociale,
      numeroTVA: data.numeroTva,
      siren: data.siren,
    });
    return this.mapClientEntreprise(entity);
  }

  @GrpcMethod('ClientEntrepriseService', 'Get')
  async getClientEntreprise(data: GetClientEntrepriseRequest): Promise<ClientEntreprise> {
    const entity = await this.clientEntrepriseService.findById(data.id);
    return this.mapClientEntreprise(entity);
  }

  @GrpcMethod('ClientEntrepriseService', 'List')
  async listClientsEntreprise(data: ListClientsEntrepriseRequest): Promise<ListClientsEntrepriseResponse> {
    const result = await this.clientEntrepriseService.findAll(data.pagination);
    return {
      clients: result.clients.map((c) => this.mapClientEntreprise(c)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('ClientEntrepriseService', 'Delete')
  async deleteClientEntreprise(data: DeleteClientEntrepriseRequest): Promise<DeleteResponse> {
    const success = await this.clientEntrepriseService.delete(data.id);
    return { success };
  }

  private mapClientEntreprise(entity: any): ClientEntreprise {
    return {
      id: entity.id,
      raisonSociale: entity.raisonSociale,
      numeroTva: entity.numeroTVA,
      siren: entity.siren,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== CLIENT PARTENAIRE =====

  @GrpcMethod('ClientPartenaireService', 'Create')
  async createClientPartenaire(data: CreateClientPartenaireRequest): Promise<ClientPartenaire> {
    const entity = await this.clientPartenaireService.create({
      clientBaseId: data.clientBaseId,
      partenaireId: data.partenaireId,
      rolePartenaireId: data.rolePartenaireId,
      validFrom: data.validFrom,
      validTo: data.validTo,
    });
    return this.mapClientPartenaire(entity);
  }

  @GrpcMethod('ClientPartenaireService', 'Update')
  async updateClientPartenaire(data: UpdateClientPartenaireRequest): Promise<ClientPartenaire> {
    const entity = await this.clientPartenaireService.update({
      id: data.id,
      partenaireId: data.partenaireId,
      rolePartenaireId: data.rolePartenaireId,
      validFrom: data.validFrom,
      validTo: data.validTo,
    });
    return this.mapClientPartenaire(entity);
  }

  @GrpcMethod('ClientPartenaireService', 'Get')
  async getClientPartenaire(data: GetClientPartenaireRequest): Promise<ClientPartenaire> {
    const entity = await this.clientPartenaireService.findById(data.id);
    return this.mapClientPartenaire(entity);
  }

  @GrpcMethod('ClientPartenaireService', 'List')
  async listClientsPartenaire(data: ListClientsPartenaireRequest): Promise<ListClientsPartenaireResponse> {
    const result = await this.clientPartenaireService.findAll(
      { clientBaseId: data.clientBaseId, partenaireId: data.partenaireId },
      data.pagination,
    );
    return {
      clients: result.clients.map((c) => this.mapClientPartenaire(c)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('ClientPartenaireService', 'Delete')
  async deleteClientPartenaire(data: DeleteClientPartenaireRequest): Promise<DeleteResponse> {
    const success = await this.clientPartenaireService.delete(data.id);
    return { success };
  }

  private mapClientPartenaire(entity: any): ClientPartenaire {
    return {
      id: entity.id,
      clientBaseId: entity.clientBaseId,
      partenaireId: entity.partenaireId,
      rolePartenaireId: entity.rolePartenaireId,
      validFrom: entity.validFrom,
      validTo: entity.validTo || '',
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }
}
