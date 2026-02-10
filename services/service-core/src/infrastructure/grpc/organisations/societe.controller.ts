import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SocieteService } from '../../persistence/typeorm/repositories/organisations/societe.service';
import { SocieteEntity } from '../../../domain/organisations/entities/societe.entity';
import type {
  CreateSocieteRequest,
  UpdateSocieteRequest,
  GetSocieteRequest,
  ListSocieteByOrganisationRequest,
  ListSocieteRequest,
  ListSocieteResponse,
  DeleteSocieteRequest,
  Societe,
  DeleteResponse,
} from '@proto/organisations';

/**
 * Map SocieteEntity (camelCase) to proto Societe (snake_case).
 * Required because proto-loader uses keepCase: true.
 */
function societeToProto(entity: SocieteEntity) {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    raison_sociale: entity.raisonSociale,
    siren: entity.siren,
    numero_tva: entity.numeroTva,
    created_at: entity.createdAt?.toISOString() ?? '',
    updated_at: entity.updatedAt?.toISOString() ?? '',
    logo_url: entity.logoUrl ?? '',
    devise: entity.devise ?? 'EUR',
    ics: entity.ics ?? '',
    journal_vente: entity.journalVente ?? '',
    compte_produit_defaut: entity.compteProduitDefaut ?? '',
    plan_comptable: entity.planComptable ? JSON.stringify(entity.planComptable) : '',
    adresse_siege: entity.adresseSiege ?? '',
    telephone: entity.telephone ?? '',
    email_contact: entity.emailContact ?? '',
    parametres_fiscaux: entity.parametresFiscaux ? JSON.stringify(entity.parametresFiscaux) : '',
  };
}

@Controller()
export class SocieteController {
  constructor(private readonly societeService: SocieteService) {}

  @GrpcMethod('SocieteService', 'Create')
  async create(data: CreateSocieteRequest) {
    const entity = await this.societeService.create({
      organisationId: data.organisation_id,
      raisonSociale: data.raison_sociale,
      siren: data.siren,
      numeroTva: data.numero_tva,
      logoUrl: data.logo_url,
      devise: data.devise || 'EUR',
      ics: data.ics,
      journalVente: data.journal_vente,
      compteProduitDefaut: data.compte_produit_defaut,
      planComptable: data.plan_comptable ? JSON.parse(data.plan_comptable) : null,
      adresseSiege: data.adresse_siege,
      telephone: data.telephone,
      emailContact: data.email_contact,
      parametresFiscaux: data.parametres_fiscaux ? JSON.parse(data.parametres_fiscaux) : null,
    });
    return societeToProto(entity);
  }

  @GrpcMethod('SocieteService', 'Update')
  async update(data: UpdateSocieteRequest) {
    const entity = await this.societeService.update({
      id: data.id,
      raisonSociale: data.raison_sociale,
      siren: data.siren,
      numeroTva: data.numero_tva,
      logoUrl: data.logo_url,
      devise: data.devise,
      ics: data.ics,
      journalVente: data.journal_vente,
      compteProduitDefaut: data.compte_produit_defaut,
      planComptable: data.plan_comptable ? JSON.parse(data.plan_comptable) : null,
      adresseSiege: data.adresse_siege,
      telephone: data.telephone,
      emailContact: data.email_contact,
      parametresFiscaux: data.parametres_fiscaux ? JSON.parse(data.parametres_fiscaux) : null,
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
    const result = await this.societeService.findByOrganisation(data.organisation_id, data.pagination);
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
