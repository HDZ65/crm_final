import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PartenaireCommercialService } from '../../persistence/typeorm/repositories/commercial/partenaire-commercial.service';
import {
  PartenaireCommercialEntity,
  TypePartenaire,
  StatutPartenaire,
} from '../../../domain/commercial/entities/partenaire-commercial.entity';
import { PartenaireCommercialSocieteEntity } from '../../../domain/commercial/entities/partenaire-commercial-societe.entity';
import type {
  CreatePartenaireCommercialRequest,
  UpdatePartenaireCommercialRequest,
  GetPartenaireCommercialRequest,
  ListPartenaireCommercialRequest,
  SearchPartenaireCommercialRequest,
  ActivatePartenaireCommercialRequest,
  DeletePartenaireCommercialRequest,
  PartenaireCommercialSocieteRequest,
  ListPartenairesBySocieteRequest,
} from '@proto/partenaires';

function partenaireToProto(entity: PartenaireCommercialEntity) {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    denomination: entity.denomination,
    type: entity.type || '',
    siren: entity.siren || '',
    siret: entity.siret || '',
    numero_tva: entity.numeroTva || '',
    adresses: entity.adresses ? JSON.stringify(entity.adresses) : '',
    iban: entity.iban || '',
    bic: entity.bic || '',
    code_extranet: entity.codeExtranet || '',
    api_base_url: entity.apiBaseUrl || '',
    api_credentials: entity.apiCredentials ? JSON.stringify(entity.apiCredentials) : '',
    sla_delai_traitement_heures: entity.slaDelaiTraitementHeures || 0,
    sla_taux_disponibilite: entity.slaTauxDisponibilite ? Number(entity.slaTauxDisponibilite) : 0,
    sla_contact_urgence: entity.slaContactUrgence || '',
    contacts: entity.contacts ? JSON.stringify(entity.contacts) : '',
    statut: entity.statut || '',
    date_debut_contrat: entity.dateDebutContrat ? entity.dateDebutContrat.toISOString() : '',
    date_fin_contrat: entity.dateFinContrat ? entity.dateFinContrat.toISOString() : '',
    notes: entity.notes || '',
    metadata: entity.metadata ? JSON.stringify(entity.metadata) : '',
    created_by: entity.createdBy || '',
    modified_by: entity.modifiedBy || '',
    created_at: entity.createdAt ? entity.createdAt.toISOString() : '',
    updated_at: entity.updatedAt ? entity.updatedAt.toISOString() : '',
    societes: (entity.societes || []).map(societeToProto),
  };
}

function societeToProto(entity: PartenaireCommercialSocieteEntity) {
  return {
    id: entity.id,
    partenaire_id: entity.partenaireId,
    societe_id: entity.societeId,
    actif: entity.actif,
    date_activation: entity.dateActivation ? entity.dateActivation.toISOString() : '',
    date_desactivation: entity.dateDesactivation ? entity.dateDesactivation.toISOString() : '',
    created_at: entity.createdAt ? entity.createdAt.toISOString() : '',
  };
}

function parseJsonSafe(value: string | undefined): any | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

@Controller()
export class PartenaireCommercialController {
  constructor(private readonly partenaireService: PartenaireCommercialService) {}

  @GrpcMethod('PartenaireCommercialService', 'Create')
  async create(data: CreatePartenaireCommercialRequest) {
    const entity = await this.partenaireService.save({
      organisationId: data.organisation_id,
      denomination: data.denomination,
      type: (data.type as TypePartenaire) || TypePartenaire.AUTRE,
      siren: data.siren || null,
      siret: data.siret || null,
      numeroTva: data.numero_tva || null,
      adresses: parseJsonSafe(data.adresses),
      iban: data.iban || null,
      bic: data.bic || null,
      codeExtranet: data.code_extranet || null,
      apiBaseUrl: data.api_base_url || null,
      apiCredentials: parseJsonSafe(data.api_credentials),
      slaDelaiTraitementHeures: data.sla_delai_traitement_heures || null,
      slaTauxDisponibilite: data.sla_taux_disponibilite || null,
      slaContactUrgence: data.sla_contact_urgence || null,
      contacts: parseJsonSafe(data.contacts),
      statut: (data.statut as StatutPartenaire) || StatutPartenaire.PROSPECT,
      dateDebutContrat: data.date_debut_contrat ? new Date(data.date_debut_contrat) : null,
      dateFinContrat: data.date_fin_contrat ? new Date(data.date_fin_contrat) : null,
      notes: data.notes || null,
      metadata: parseJsonSafe(data.metadata),
      createdBy: data.created_by || null,
    });
    return partenaireToProto(entity);
  }

  @GrpcMethod('PartenaireCommercialService', 'Update')
  async update(data: UpdatePartenaireCommercialRequest) {
    const updateData: Partial<PartenaireCommercialEntity> = {};

    if (data.denomination) updateData.denomination = data.denomination;
    if (data.type) updateData.type = data.type as TypePartenaire;
    if (data.siren !== undefined) updateData.siren = data.siren || null;
    if (data.siret !== undefined) updateData.siret = data.siret || null;
    if (data.numero_tva !== undefined) updateData.numeroTva = data.numero_tva || null;
    if (data.adresses !== undefined) updateData.adresses = parseJsonSafe(data.adresses);
    if (data.iban !== undefined) updateData.iban = data.iban || null;
    if (data.bic !== undefined) updateData.bic = data.bic || null;
    if (data.code_extranet !== undefined) updateData.codeExtranet = data.code_extranet || null;
    if (data.api_base_url !== undefined) updateData.apiBaseUrl = data.api_base_url || null;
    if (data.api_credentials !== undefined) updateData.apiCredentials = parseJsonSafe(data.api_credentials);
    if (data.sla_delai_traitement_heures !== undefined) updateData.slaDelaiTraitementHeures = data.sla_delai_traitement_heures || null;
    if (data.sla_taux_disponibilite !== undefined) updateData.slaTauxDisponibilite = data.sla_taux_disponibilite || null;
    if (data.sla_contact_urgence !== undefined) updateData.slaContactUrgence = data.sla_contact_urgence || null;
    if (data.contacts !== undefined) updateData.contacts = parseJsonSafe(data.contacts);
    if (data.statut) updateData.statut = data.statut as StatutPartenaire;
    if (data.date_debut_contrat !== undefined) updateData.dateDebutContrat = data.date_debut_contrat ? new Date(data.date_debut_contrat) : null;
    if (data.date_fin_contrat !== undefined) updateData.dateFinContrat = data.date_fin_contrat ? new Date(data.date_fin_contrat) : null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.metadata !== undefined) updateData.metadata = parseJsonSafe(data.metadata);
    if (data.modified_by) updateData.modifiedBy = data.modified_by;

    const entity = await this.partenaireService.update(data.id, updateData);
    return partenaireToProto(entity);
  }

  @GrpcMethod('PartenaireCommercialService', 'Get')
  async get(data: GetPartenaireCommercialRequest) {
    const entity = await this.partenaireService.findById(data.id);
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Partenaire commercial ${data.id} non trouve` });
    }
    return partenaireToProto(entity);
  }

  @GrpcMethod('PartenaireCommercialService', 'List')
  async list(data: ListPartenaireCommercialRequest) {
    const filters: { type?: TypePartenaire; statut?: StatutPartenaire; search?: string } = {};
    if (data.type) filters.type = data.type as TypePartenaire;
    if (data.statut) filters.statut = data.statut as StatutPartenaire;

    const result = await this.partenaireService.findByOrganisation(
      data.organisation_id,
      filters,
      data.pagination,
    );

    return {
      partenaires: result.data.map(partenaireToProto),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('PartenaireCommercialService', 'Search')
  async search(data: SearchPartenaireCommercialRequest) {
    const filters: { type?: TypePartenaire; statut?: StatutPartenaire; search?: string } = {};
    if (data.search) filters.search = data.search;
    if (data.type) filters.type = data.type as TypePartenaire;
    if (data.statut) filters.statut = data.statut as StatutPartenaire;

    const result = await this.partenaireService.findByOrganisation(
      data.organisation_id,
      filters,
      data.pagination,
    );

    return {
      partenaires: result.data.map(partenaireToProto),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('PartenaireCommercialService', 'Activer')
  async activer(data: ActivatePartenaireCommercialRequest) {
    const entity = await this.partenaireService.update(data.id, {
      statut: StatutPartenaire.ACTIF,
    });
    return partenaireToProto(entity);
  }

  @GrpcMethod('PartenaireCommercialService', 'Desactiver')
  async desactiver(data: ActivatePartenaireCommercialRequest) {
    const entity = await this.partenaireService.update(data.id, {
      statut: StatutPartenaire.SUSPENDU,
    });
    return partenaireToProto(entity);
  }

  @GrpcMethod('PartenaireCommercialService', 'Delete')
  async delete(data: DeletePartenaireCommercialRequest) {
    const success = await this.partenaireService.delete(data.id);
    return { success };
  }

  @GrpcMethod('PartenaireCommercialService', 'ActiverPourSociete')
  async activerPourSociete(data: PartenaireCommercialSocieteRequest) {
    const entity = await this.partenaireService.activerSociete(
      data.partenaire_id,
      data.societe_id,
    );
    return societeToProto(entity);
  }

  @GrpcMethod('PartenaireCommercialService', 'DesactiverPourSociete')
  async desactiverPourSociete(data: PartenaireCommercialSocieteRequest) {
    const entity = await this.partenaireService.desactiverSociete(
      data.partenaire_id,
      data.societe_id,
    );
    return societeToProto(entity);
  }

  @GrpcMethod('PartenaireCommercialService', 'ListBySociete')
  async listBySociete(data: ListPartenairesBySocieteRequest) {
    const societeLinks = await this.partenaireService.findSocietesByPartenaire(data.societe_id);

    // Filter active only if requested
    const filteredLinks = data.actif_only
      ? societeLinks.filter((l) => l.actif)
      : societeLinks;

    // Load full partenaire for each link
    const partenaires: PartenaireCommercialEntity[] = [];
    for (const link of filteredLinks) {
      const partenaire = await this.partenaireService.findById(link.partenaireId);
      if (partenaire) {
        partenaires.push(partenaire);
      }
    }

    return {
      partenaires: partenaires.map(partenaireToProto),
      pagination: {
        total: partenaires.length,
        page: 1,
        limit: partenaires.length,
        total_pages: 1,
      },
    };
  }
}
