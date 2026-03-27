import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  CreateClientBaseRequest,
  DeleteClientBaseRequest,
  GetClientBaseRequest,
  ListClientsBaseRequest,
  SearchClientRequest,
  UpdateClientBaseRequest,
} from '@proto/clients';
import { ClientBaseEntity } from '../../../domain/clients/entities/client-base.entity';
import { ClientBaseService } from '../../persistence/typeorm/repositories/clients/client-base.service';

/**
 * Map ClientBaseEntity (camelCase) to proto ClientBase (camelCase).
 * Proto-ts generates camelCase field names from snake_case proto fields.
 */
function clientBaseToProto(entity: ClientBaseEntity) {
  return {
    id: entity.id,
    organisationId: entity.keycloakGroupId,
    typeClient: entity.typeClient ?? '',
    nom: entity.nom,
    prenom: entity.prenom,
    dateNaissance: entity.dateNaissance?.toISOString?.() ?? '',
    compteCode: entity.compteCode ?? '',
    partenaireId: entity.partenaireId ?? '',
    dateCreation: entity.dateCreation?.toISOString?.() ?? '',
    telephone: entity.telephone,
    email: entity.email ?? '',
    statut: entity.statut,
    createdAt: entity.createdAt?.toISOString?.() ?? '',
    updatedAt: entity.updatedAt?.toISOString?.() ?? '',
    adresses:
      entity.adresses?.map((a) => ({
        id: a.id,
        clientBaseId: a.clientBaseId ?? '',
        type: a.type ?? '',
        typeAdresse: a.typeAdresse ?? '',
        ligne1: a.ligne1 ?? '',
        ligne2: a.ligne2 ?? '',
        codePostal: a.codePostal ?? '',
        ville: a.ville ?? '',
        pays: a.pays ?? '',
        createdAt: a.createdAt?.toISOString?.() ?? '',
        updatedAt: a.updatedAt?.toISOString?.() ?? '',
      })) ?? [],
    societeId: '',
    hasConciergerie: entity.hasConciergerie ?? false,
    hasJustiPlus: entity.hasJustiPlus ?? false,
    hasWincash: entity.hasWincash ?? false,
    uuidWincash: entity.uuidWincash ?? '',
    uuidJustiPlus: entity.uuidJustiPlus ?? '',
    datePremiereSouscription: entity.datePremiereSouscription?.toISOString?.() ?? '',
    canalAcquisition: entity.canalAcquisition ?? '',
  };
}

@Controller()
export class ClientBaseController {
  constructor(private readonly clientBaseService: ClientBaseService) {}

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
    const result = await this.clientBaseService.search(data.organisationId, data.telephone, data.nom);
    return {
      found: result.found,
      client: result.client ? clientBaseToProto(result.client) : undefined,
    };
  }
}
