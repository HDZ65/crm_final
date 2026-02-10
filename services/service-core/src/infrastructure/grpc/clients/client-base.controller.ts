import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ClientBaseService } from '../../persistence/typeorm/repositories/clients/client-base.service';
import { ClientBaseEntity } from '../../../domain/clients/entities/client-base.entity';
import type {
  CreateClientBaseRequest,
  UpdateClientBaseRequest,
  GetClientBaseRequest,
  ListClientsBaseRequest,
  ListClientsBaseResponse,
  DeleteClientBaseRequest,
  SearchClientRequest,
  SearchClientResponse,
  ClientBase,
  DeleteResponse,
} from '@proto/clients';

/**
 * Map ClientBaseEntity (camelCase) to proto ClientBase (snake_case).
 * Required because proto-loader uses keepCase: true.
 */
function clientBaseToProto(entity: ClientBaseEntity) {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    type_client: entity.typeClient ?? '',
    nom: entity.nom,
    prenom: entity.prenom,
    date_naissance: entity.dateNaissance?.toISOString?.() ?? '',
    compte_code: entity.compteCode ?? '',
    partenaire_id: entity.partenaireId ?? '',
    date_creation: entity.dateCreation?.toISOString?.() ?? '',
    telephone: entity.telephone,
    email: entity.email ?? '',
    statut: entity.statut,
    created_at: entity.createdAt?.toISOString?.() ?? '',
    updated_at: entity.updatedAt?.toISOString?.() ?? '',
    adresses: entity.adresses?.map(a => ({
      id: a.id,
      client_base_id: a.clientBaseId ?? '',
      type: a.type ?? '',
      type_adresse: a.typeAdresse ?? '',
      ligne1: a.ligne1 ?? '',
      ligne2: a.ligne2 ?? '',
      code_postal: a.codePostal ?? '',
      ville: a.ville ?? '',
      pays: a.pays ?? '',
      created_at: a.createdAt?.toISOString?.() ?? '',
      updated_at: a.updatedAt?.toISOString?.() ?? '',
    })) ?? [],
    societe_id: entity.societeId ?? '',
    has_conciergerie: entity.hasConciergerie ?? false,
    has_justi_plus: entity.hasJustiPlus ?? false,
    has_wincash: entity.hasWincash ?? false,
    uuid_wincash: entity.uuidWincash ?? '',
    uuid_justi_plus: entity.uuidJustiPlus ?? '',
    date_premiere_souscription: entity.datePremiereSouscription?.toISOString?.() ?? '',
    canal_acquisition: entity.canalAcquisition ?? '',
  };
}

@Controller()
export class ClientBaseController {
  constructor(
    private readonly clientBaseService: ClientBaseService,
  ) {}

  @GrpcMethod('ClientBaseService', 'Create')
  async createClientBase(data: CreateClientBaseRequest) {
    const entity = await this.clientBaseService.create(data);
    return clientBaseToProto(entity);
  }

  @GrpcMethod('ClientBaseService', 'Update')
  async updateClientBase(data: UpdateClientBaseRequest) {
    const entity = await this.clientBaseService.update(data);
    return clientBaseToProto(entity);
  }

  @GrpcMethod('ClientBaseService', 'Get')
  async getClientBase(data: GetClientBaseRequest) {
    const entity = await this.clientBaseService.findById(data.id);
    return clientBaseToProto(entity);
  }

  @GrpcMethod('ClientBaseService', 'List')
  async listClientsBase(data: ListClientsBaseRequest) {
    const result = await this.clientBaseService.findAll(data);
    return {
      clients: result.clients.map(clientBaseToProto),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('ClientBaseService', 'Delete')
  async deleteClientBase(data: DeleteClientBaseRequest) {
    const success = await this.clientBaseService.delete(data.id);
    return { success };
  }

  @GrpcMethod('ClientBaseService', 'Search')
  async searchClient(data: SearchClientRequest) {
    const result = await this.clientBaseService.search(data.organisation_id, data.telephone, data.nom);
    return {
      found: result.found,
      client: result.client ? clientBaseToProto(result.client) : undefined,
    };
  }
}
