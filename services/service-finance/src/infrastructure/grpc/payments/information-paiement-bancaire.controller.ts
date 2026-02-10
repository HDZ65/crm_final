import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InformationPaiementBancaireService } from '../../persistence/typeorm/repositories/payments/information-paiement-bancaire.service';
import {
  CreateInformationPaiementBancaireRequest,
  GetInformationPaiementBancaireByIdRequest,
  GetInformationPaiementBancaireByClientIdRequest,
  GetInformationPaiementBancaireByExternalIdRequest,
  UpdateInformationPaiementBancaireRequest,
  UpsertInformationPaiementBancaireRequest,
  DeleteInformationPaiementBancaireRequest,
  InformationPaiementBancaireResponse,
  InformationPaiementBancaireListResponse,
  DeleteResponse,
  UpsertInformationPaiementBancaireResponse,
} from '@proto/payment-info';

@Controller()
export class InformationPaiementBancaireController {
  constructor(
    private readonly informationPaiementBancaireService: InformationPaiementBancaireService,
  ) {}

  @GrpcMethod('InformationPaiementBancaireService', 'Create')
  async create(
    data: CreateInformationPaiementBancaireRequest,
  ): Promise<InformationPaiementBancaireResponse> {
    const entity = await this.informationPaiementBancaireService.create({
      organisationId: data.organisation_id,
      clientId: data.client_id,
      iban: data.iban,
      bic: data.bic,
      titulaireCompte: data.titulaire_compte || null,
      mandatSepaReference: data.mandat_sepa_reference || null,
      dateMandat: data.date_mandat ? new Date(data.date_mandat) : null,
      statut: data.statut || 'ACTIF',
      commentaire: data.commentaire || null,
      externalId: data.external_id || null,
    });

    return this.toProtoResponse(entity);
  }

  @GrpcMethod('InformationPaiementBancaireService', 'GetById')
  async getById(
    data: GetInformationPaiementBancaireByIdRequest,
  ): Promise<InformationPaiementBancaireResponse> {
    const entity = await this.informationPaiementBancaireService.findById(data.id);

    if (!entity) {
      throw new Error(`Payment information with id=${data.id} not found`);
    }

    return this.toProtoResponse(entity);
  }

  @GrpcMethod('InformationPaiementBancaireService', 'GetByClientId')
  async getByClientId(
    data: GetInformationPaiementBancaireByClientIdRequest,
  ): Promise<InformationPaiementBancaireListResponse> {
    const entities = await this.informationPaiementBancaireService.findByClientId(data.client_id);

    return {
      items: entities.map((entity) => this.toProtoResponse(entity)),
      total: entities.length,
    };
  }

  @GrpcMethod('InformationPaiementBancaireService', 'GetByExternalId')
  async getByExternalId(
    data: GetInformationPaiementBancaireByExternalIdRequest,
  ): Promise<InformationPaiementBancaireResponse> {
    const entity = await this.informationPaiementBancaireService.findByExternalId(
      data.organisation_id,
      data.external_id,
    );

    if (!entity) {
      throw new Error(
        `Payment information with external_id=${data.external_id} not found for organisation=${data.organisation_id}`,
      );
    }

    return this.toProtoResponse(entity);
  }

  @GrpcMethod('InformationPaiementBancaireService', 'Update')
  async update(
    data: UpdateInformationPaiementBancaireRequest,
  ): Promise<InformationPaiementBancaireResponse> {
    const entity = await this.informationPaiementBancaireService.update(data.id, {
      iban: data.iban || undefined,
      bic: data.bic || undefined,
      titulaireCompte: data.titulaire_compte !== undefined ? data.titulaire_compte : undefined,
      mandatSepaReference:
        data.mandat_sepa_reference !== undefined ? data.mandat_sepa_reference : undefined,
      dateMandat: data.date_mandat ? new Date(data.date_mandat) : undefined,
      statut: data.statut || undefined,
      commentaire: data.commentaire !== undefined ? data.commentaire : undefined,
    });

    return this.toProtoResponse(entity);
  }

  @GrpcMethod('InformationPaiementBancaireService', 'UpsertByExternalId')
  async upsertByExternalId(
    data: UpsertInformationPaiementBancaireRequest,
  ): Promise<UpsertInformationPaiementBancaireResponse> {
    const result = await this.informationPaiementBancaireService.upsertByExternalId({
      organisationId: data.organisation_id,
      clientId: data.client_id,
      iban: data.iban,
      bic: data.bic,
      titulaireCompte: data.titulaire_compte || null,
      mandatSepaReference: data.mandat_sepa_reference || null,
      dateMandat: data.date_mandat ? new Date(data.date_mandat) : null,
      statut: data.statut || 'ACTIF',
      commentaire: data.commentaire || null,
      externalId: data.external_id,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    });

    return {
      entity: this.toProtoResponse(result.entity),
      created: result.created,
    };
  }

  @GrpcMethod('InformationPaiementBancaireService', 'Delete')
  async delete(data: DeleteInformationPaiementBancaireRequest): Promise<DeleteResponse> {
    await this.informationPaiementBancaireService.delete(data.id);

    return {
      success: true,
      message: `Payment information with id=${data.id} deleted successfully`,
    };
  }

  private toProtoResponse(entity: any): InformationPaiementBancaireResponse {
    return {
      id: entity.id,
      organisation_id: entity.organisationId,
      client_id: entity.clientId,
      iban: entity.iban,
      bic: entity.bic,
      titulaire_compte: entity.titulaireCompte || '',
      mandat_sepa_reference: entity.mandatSepaReference || '',
      date_mandat: entity.dateMandat ? entity.dateMandat.toISOString() : '',
      statut: entity.statut,
      commentaire: entity.commentaire || '',
      external_id: entity.externalId || '',
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}
