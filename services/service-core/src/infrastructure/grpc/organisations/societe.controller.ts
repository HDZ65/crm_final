import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  CreateSocieteRequest,
  DeleteSocieteRequest,
  GetSocieteRequest,
  ListSocieteByOrganisationRequest,
  ListSocieteRequest,
  UpdateSocieteRequest,
} from '@proto/organisations';
import { SocieteEntity } from '../../../domain/organisations/entities/societe.entity';
import { SocieteService } from '../../persistence/typeorm/repositories/organisations/societe.service';

/**
 * Map SocieteEntity (camelCase) to proto Societe (camelCase).
 * Proto-ts generates camelCase field names from snake_case proto fields.
 */
function societeToProto(entity: SocieteEntity) {
  return {
    id: entity.id,
    organisationId: entity.keycloakGroupId,
    raisonSociale: entity.raisonSociale,
    siret: entity.siret,
    numeroTva: entity.numeroTva,
    createdAt: entity.createdAt?.toISOString() ?? '',
    updatedAt: entity.updatedAt?.toISOString() ?? '',
    logoUrl: entity.logoUrl ?? '',
    devise: entity.devise ?? 'EUR',
    ics: entity.ics ?? '',
    journalVente: entity.journalVente ?? '',
    compteProduitDefaut: entity.compteProduitDefaut ?? '',
    planComptable: entity.planComptable ? JSON.stringify(entity.planComptable) : '',
    adresseSiege: entity.adresseSiege ?? '',
    telephone: entity.telephone ?? '',
    emailContact: entity.emailContact ?? '',
    parametresFiscaux: entity.parametresFiscaux ? JSON.stringify(entity.parametresFiscaux) : '',
  };
}

@Controller()
export class SocieteController {
  constructor(private readonly societeService: SocieteService) {}

  @GrpcMethod('SocieteService', 'Create')
  async create(data: CreateSocieteRequest) {
    const entity = await this.societeService.create({
      keycloakGroupId: data.organisationId,
      raisonSociale: data.raisonSociale,
      siret: data.siret,
      numeroTva: data.numeroTva,
      logoUrl: data.logoUrl,
      devise: data.devise || 'EUR',
      ics: data.ics,
      journalVente: data.journalVente,
      compteProduitDefaut: data.compteProduitDefaut,
      planComptable: data.planComptable ? JSON.parse(data.planComptable) : null,
      adresseSiege: data.adresseSiege,
      telephone: data.telephone,
      emailContact: data.emailContact,
      parametresFiscaux: data.parametresFiscaux ? JSON.parse(data.parametresFiscaux) : null,
    });
    return societeToProto(entity);
  }

  @GrpcMethod('SocieteService', 'Update')
  async update(data: UpdateSocieteRequest) {
    const entity = await this.societeService.update({
      id: data.id,
      raisonSociale: data.raisonSociale,
      siret: data.siret,
      numeroTva: data.numeroTva,
      logoUrl: data.logoUrl,
      devise: data.devise,
      ics: data.ics,
      journalVente: data.journalVente,
      compteProduitDefaut: data.compteProduitDefaut,
      planComptable: data.planComptable ? JSON.parse(data.planComptable) : null,
      adresseSiege: data.adresseSiege,
      telephone: data.telephone,
      emailContact: data.emailContact,
      parametresFiscaux: data.parametresFiscaux ? JSON.parse(data.parametresFiscaux) : null,
    });
    return societeToProto(entity);
  }

  @GrpcMethod('SocieteService', 'Get')
  async get(data: GetSocieteRequest) {
    const entity = await this.societeService.findById(data.id);
    return societeToProto(entity);
  }

  @GrpcMethod('SocieteService', 'ListByOrganisation')
  async listByOrganisation(data: ListSocieteByOrganisationRequest) {
    const result = await this.societeService.findByOrganisation(data.organisationId, data.pagination);
    return {
      societes: result.societes.map(societeToProto),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('SocieteService', 'List')
  async list(data: ListSocieteRequest) {
    const result = await this.societeService.findAll({ search: data.search }, data.pagination);
    return {
      societes: result.societes.map(societeToProto),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('SocieteService', 'Delete')
  async delete(data: DeleteSocieteRequest) {
    const success = await this.societeService.delete(data.id);
    return { success };
  }
}
