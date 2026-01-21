import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { StatutClientService } from './modules/statut-client/statut-client.service';
import { AdresseService } from './modules/adresse/adresse.service';
import { ClientBaseService } from './modules/client-base/client-base.service';
import { ClientEntrepriseService } from './modules/client-entreprise/client-entreprise.service';
import { ClientPartenaireService } from './modules/client-partenaire/client-partenaire.service';

import type {
  CreateStatutClientRequest,
  UpdateStatutClientRequest,
  GetStatutClientRequest,
  GetStatutClientByCodeRequest,
  ListStatutsClientRequest,
  DeleteStatutClientRequest,
  CreateAdresseRequest,
  UpdateAdresseRequest,
  GetAdresseRequest,
  ListAdressesRequest,
  DeleteAdresseRequest,
  CreateClientBaseRequest,
  UpdateClientBaseRequest,
  GetClientBaseRequest,
  ListClientsBaseRequest,
  DeleteClientBaseRequest,
  SearchClientRequest,
  CreateClientEntrepriseRequest,
  UpdateClientEntrepriseRequest,
  GetClientEntrepriseRequest,
  ListClientsEntrepriseRequest,
  DeleteClientEntrepriseRequest,
  CreateClientPartenaireRequest,
  UpdateClientPartenaireRequest,
  GetClientPartenaireRequest,
  ListClientsPartenaireRequest,
  DeleteClientPartenaireRequest,
} from '@proto/clients/clients';

import { ClientEntrepriseEntity } from './modules/client-entreprise/entities/client-entreprise.entity';

function mapClientEntreprise(entity: ClientEntrepriseEntity) {
  return {
    ...entity,
    numeroTva: entity.numeroTVA,
  };
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

  @GrpcMethod('StatutClientService', 'Create')
  async createStatut(data: CreateStatutClientRequest) {
    return this.statutService.create({
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordreAffichage,
    });
  }

  @GrpcMethod('StatutClientService', 'Update')
  async updateStatut(data: UpdateStatutClientRequest) {
    return this.statutService.update({
      id: data.id,
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordreAffichage,
    });
  }

  @GrpcMethod('StatutClientService', 'Get')
  async getStatut(data: GetStatutClientRequest) {
    return this.statutService.findById(data.id);
  }

  @GrpcMethod('StatutClientService', 'GetByCode')
  async getStatutByCode(data: GetStatutClientByCodeRequest) {
    return this.statutService.findByCode(data.code);
  }

  @GrpcMethod('StatutClientService', 'List')
  async listStatuts(data: ListStatutsClientRequest) {
    return this.statutService.findAll(data.pagination);
  }

  @GrpcMethod('StatutClientService', 'Delete')
  async deleteStatut(data: DeleteStatutClientRequest) {
    const success = await this.statutService.delete(data.id);
    return { success };
  }

  @GrpcMethod('AdresseService', 'Create')
  async createAdresse(data: CreateAdresseRequest) {
    return this.adresseService.create({
      clientBaseId: data.clientBaseId,
      ligne1: data.ligne1,
      ligne2: data.ligne2,
      codePostal: data.codePostal,
      ville: data.ville,
      pays: data.pays,
      type: data.type,
    });
  }

  @GrpcMethod('AdresseService', 'Update')
  async updateAdresse(data: UpdateAdresseRequest) {
    return this.adresseService.update({
      id: data.id,
      ligne1: data.ligne1,
      ligne2: data.ligne2,
      codePostal: data.codePostal,
      ville: data.ville,
      pays: data.pays,
      type: data.type,
    });
  }

  @GrpcMethod('AdresseService', 'Get')
  async getAdresse(data: GetAdresseRequest) {
    return this.adresseService.findById(data.id);
  }

  @GrpcMethod('AdresseService', 'ListByClient')
  async listAdressesByClient(data: ListAdressesRequest) {
    return this.adresseService.findByClient(data.clientBaseId, data.pagination);
  }

  @GrpcMethod('AdresseService', 'Delete')
  async deleteAdresse(data: DeleteAdresseRequest) {
    const success = await this.adresseService.delete(data.id);
    return { success };
  }

  @GrpcMethod('ClientBaseService', 'Create')
  async createClientBase(data: CreateClientBaseRequest) {
    return this.clientBaseService.create(data);
  }

  @GrpcMethod('ClientBaseService', 'Update')
  async updateClientBase(data: UpdateClientBaseRequest) {
    return this.clientBaseService.update(data);
  }

  @GrpcMethod('ClientBaseService', 'Get')
  async getClientBase(data: GetClientBaseRequest) {
    return this.clientBaseService.findById(data.id);
  }

  @GrpcMethod('ClientBaseService', 'List')
  async listClientsBase(data: ListClientsBaseRequest) {
    return this.clientBaseService.findAll(data);
  }

  @GrpcMethod('ClientBaseService', 'Delete')
  async deleteClientBase(data: DeleteClientBaseRequest) {
    const success = await this.clientBaseService.delete(data.id);
    return { success };
  }

  @GrpcMethod('ClientBaseService', 'Search')
  async searchClient(data: SearchClientRequest) {
    return this.clientBaseService.search(data.organisationId, data.telephone, data.nom);
  }

  @GrpcMethod('ClientEntrepriseService', 'Create')
  async createClientEntreprise(data: CreateClientEntrepriseRequest) {
    const entity = await this.clientEntrepriseService.create({
      raisonSociale: data.raisonSociale,
      numeroTVA: data.numeroTva,
      siren: data.siren,
    });
    return mapClientEntreprise(entity);
  }

  @GrpcMethod('ClientEntrepriseService', 'Update')
  async updateClientEntreprise(data: UpdateClientEntrepriseRequest) {
    const entity = await this.clientEntrepriseService.update({
      id: data.id,
      raisonSociale: data.raisonSociale,
      numeroTVA: data.numeroTva,
      siren: data.siren,
    });
    return mapClientEntreprise(entity);
  }

  @GrpcMethod('ClientEntrepriseService', 'Get')
  async getClientEntreprise(data: GetClientEntrepriseRequest) {
    const entity = await this.clientEntrepriseService.findById(data.id);
    return mapClientEntreprise(entity);
  }

  @GrpcMethod('ClientEntrepriseService', 'List')
  async listClientsEntreprise(data: ListClientsEntrepriseRequest) {
    const result = await this.clientEntrepriseService.findAll(data.pagination);
    return {
      clients: result.clients.map(mapClientEntreprise),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('ClientEntrepriseService', 'Delete')
  async deleteClientEntreprise(data: DeleteClientEntrepriseRequest) {
    const success = await this.clientEntrepriseService.delete(data.id);
    return { success };
  }

  @GrpcMethod('ClientPartenaireService', 'Create')
  async createClientPartenaire(data: CreateClientPartenaireRequest) {
    return this.clientPartenaireService.create({
      clientBaseId: data.clientBaseId,
      partenaireId: data.partenaireId,
      rolePartenaireId: data.rolePartenaireId,
      validFrom: data.validFrom,
      validTo: data.validTo,
    });
  }

  @GrpcMethod('ClientPartenaireService', 'Update')
  async updateClientPartenaire(data: UpdateClientPartenaireRequest) {
    return this.clientPartenaireService.update({
      id: data.id,
      partenaireId: data.partenaireId,
      rolePartenaireId: data.rolePartenaireId,
      validFrom: data.validFrom,
      validTo: data.validTo,
    });
  }

  @GrpcMethod('ClientPartenaireService', 'Get')
  async getClientPartenaire(data: GetClientPartenaireRequest) {
    return this.clientPartenaireService.findById(data.id);
  }

  @GrpcMethod('ClientPartenaireService', 'List')
  async listClientsPartenaire(data: ListClientsPartenaireRequest) {
    return this.clientPartenaireService.findAll(
      { clientBaseId: data.clientBaseId, partenaireId: data.partenaireId },
      data.pagination,
    );
  }

  @GrpcMethod('ClientPartenaireService', 'Delete')
  async deleteClientPartenaire(data: DeleteClientPartenaireRequest) {
    const success = await this.clientPartenaireService.delete(data.id);
    return { success };
  }
}
