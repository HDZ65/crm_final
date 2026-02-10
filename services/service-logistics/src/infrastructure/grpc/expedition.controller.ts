import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ExpeditionService } from '../persistence/typeorm/repositories/logistics';
import { MailevaService } from '../external/maileva';
import type {
  CreateExpeditionRequest,
  ExpeditionResponse,
  GetByIdRequest,
  GetExpeditionsByClientRequest,
  GetExpeditionsByOrganisationRequest,
  ExpeditionListResponse,
  UpdateExpeditionRequest,
  DeleteResponse,
} from '@proto/logistics';

@Controller()
export class ExpeditionController {
  private readonly logger = new Logger(ExpeditionController.name);

  constructor(
    private readonly expeditionService: ExpeditionService,
    private readonly mailevaService: MailevaService,
  ) {}

  @GrpcMethod('LogisticsService', 'CreateExpedition')
  async createExpedition(data: CreateExpeditionRequest): Promise<ExpeditionResponse> {
    this.logger.log(`CreateExpedition for organisation: ${data.organisation_id}`);

    // First generate label via Maileva
    const labelResult = await this.mailevaService.generateLabel({
      serviceLevel: 'standard',
      format: 'A4',
      weightGr: data.poids ? data.poids * 1000 : 100,
      sender: {
        line1: 'CRM Sender',
        postalCode: '75001',
        city: 'Paris',
        country: 'FR',
      },
      recipient: {
        line1: data.destination?.line1 || '',
        line2: data.destination?.line2,
        postalCode: data.destination?.postal_code || '',
        city: data.destination?.city || '',
        country: data.destination?.country || 'FR',
      },
    });

    const expedition = await this.expeditionService.create({
      organisationId: data.organisation_id,
      clientBaseId: data.client_base_id,
      transporteurCompteId: data.transporteur_compte_id,
      contratId: data.contrat_id,
      trackingNumber: labelResult.trackingNumber,
      labelUrl: labelResult.labelUrl,
      referenceCommande: data.reference_commande,
      produitId: data.produit_id,
      nomProduit: data.nom_produit,
      poids: data.poids,
      adresseDestination: data.destination?.line1,
      villeDestination: data.destination?.city,
      codePostalDestination: data.destination?.postal_code,
      dateExpedition: data.date_expedition ? new Date(data.date_expedition) : undefined,
      dateLivraisonEstimee: labelResult.estimatedDeliveryDate
        ? new Date(labelResult.estimatedDeliveryDate)
        : undefined,
    });

    return this.toExpeditionResponse(expedition);
  }

  @GrpcMethod('LogisticsService', 'GetExpedition')
  async getExpedition(data: GetByIdRequest): Promise<ExpeditionResponse> {
    this.logger.log(`GetExpedition: ${data.id}`);

    const expedition = await this.expeditionService.findById(data.id);
    if (!expedition) {
      throw new RpcException({ code: status.NOT_FOUND, message: 'Expedition not found' });
    }

    return this.toExpeditionResponse(expedition);
  }

  @GrpcMethod('LogisticsService', 'GetExpeditionsByClient')
  async getExpeditionsByClient(data: GetExpeditionsByClientRequest): Promise<ExpeditionListResponse> {
    this.logger.log(`GetExpeditionsByClient: ${data.client_base_id}`);

    const { expeditions, total } = await this.expeditionService.findByClientId(
      data.client_base_id,
      data.limit || 50,
      data.offset || 0,
    );

    return {
      expeditions: expeditions.map((e) => this.toExpeditionResponse(e)),
      total,
    };
  }

  @GrpcMethod('LogisticsService', 'GetExpeditionsByOrganisation')
  async getExpeditionsByOrganisation(data: GetExpeditionsByOrganisationRequest): Promise<ExpeditionListResponse> {
    this.logger.log(`GetExpeditionsByOrganisation: ${data.organisation_id}`);

    const { expeditions, total } = await this.expeditionService.findByOrganisationId(
      data.organisation_id,
      data.etat,
      data.limit || 50,
      data.offset || 0,
    );

    return {
      expeditions: expeditions.map((e) => this.toExpeditionResponse(e)),
      total,
    };
  }

  @GrpcMethod('LogisticsService', 'UpdateExpedition')
  async updateExpedition(data: UpdateExpeditionRequest): Promise<ExpeditionResponse> {
    this.logger.log(`UpdateExpedition: ${data.id}`);

    const expedition = await this.expeditionService.update(data.id, {
      etat: data.etat,
      lieuActuel: data.lieu_actuel,
      dateLivraison: data.date_livraison ? new Date(data.date_livraison) : undefined,
    });

    return this.toExpeditionResponse(expedition);
  }

  @GrpcMethod('LogisticsService', 'DeleteExpedition')
  async deleteExpedition(data: GetByIdRequest): Promise<DeleteResponse> {
    this.logger.log(`DeleteExpedition: ${data.id}`);

    await this.expeditionService.delete(data.id);
    return { success: true, message: 'Expedition deleted successfully' };
  }

  private toExpeditionResponse(expedition: { id: string; organisationId: string; clientBaseId: string; transporteurCompteId: string; contratId?: string | null; trackingNumber: string; etat: string; dateCreation?: Date | null; dateDernierStatut?: Date | null; labelUrl: string; referenceCommande: string; produitId?: string | null; nomProduit?: string | null; poids?: number | null; adresseDestination?: string | null; villeDestination?: string | null; codePostalDestination?: string | null; dateExpedition?: Date | null; dateLivraisonEstimee?: Date | null; dateLivraison?: Date | null; lieuActuel?: string | null; createdAt?: Date | null; updatedAt?: Date | null }): ExpeditionResponse {
    return {
      id: expedition.id,
      organisation_id: expedition.organisationId,
      client_base_id: expedition.clientBaseId,
      transporteur_compte_id: expedition.transporteurCompteId,
      contrat_id: expedition.contratId ?? undefined,
      tracking_number: expedition.trackingNumber,
      etat: expedition.etat,
      date_creation: expedition.dateCreation?.toISOString() ?? '',
      date_dernier_statut: expedition.dateDernierStatut?.toISOString() ?? '',
      label_url: expedition.labelUrl,
      reference_commande: expedition.referenceCommande,
      produit_id: expedition.produitId ?? undefined,
      nom_produit: expedition.nomProduit ?? undefined,
      poids: expedition.poids ? Number(expedition.poids) : undefined,
      adresse_destination: expedition.adresseDestination ?? undefined,
      ville_destination: expedition.villeDestination ?? undefined,
      code_postal_destination: expedition.codePostalDestination ?? undefined,
      date_expedition: expedition.dateExpedition?.toISOString(),
      date_livraison_estimee: expedition.dateLivraisonEstimee?.toISOString(),
      date_livraison: expedition.dateLivraison?.toISOString(),
      lieu_actuel: expedition.lieuActuel ?? undefined,
      created_at: expedition.createdAt?.toISOString() ?? '',
      updated_at: expedition.updatedAt?.toISOString() ?? '',
    };
  }
}
