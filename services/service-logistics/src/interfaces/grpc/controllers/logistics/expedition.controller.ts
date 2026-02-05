import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ExpeditionService } from '../../../../infrastructure/persistence/typeorm/repositories/logistics';
import { MailevaService } from '../../../../infrastructure/external/maileva';
import { ExpeditionEntity } from '../../../../domain/logistics/entities';
import type {
  CreateExpeditionRequest,
  ExpeditionResponse,
  GetByIdRequest,
  GetExpeditionsByClientRequest,
  GetExpeditionsByOrganisationRequest,
  ExpeditionListResponse,
  UpdateExpeditionRequest,
  DeleteResponse,
} from '@crm/proto/logistics';

@Controller()
export class ExpeditionController {
  private readonly logger = new Logger(ExpeditionController.name);

  constructor(
    private readonly expeditionService: ExpeditionService,
    private readonly mailevaService: MailevaService,
  ) {}

  @GrpcMethod('LogisticsService', 'CreateExpedition')
  async createExpedition(data: CreateExpeditionRequest): Promise<ExpeditionResponse> {
    this.logger.log(`CreateExpedition for organisation: ${data.organisationId}`);

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
        postalCode: data.destination?.postalCode || '',
        city: data.destination?.city || '',
        country: data.destination?.country || 'FR',
      },
    });

    const expedition = await this.expeditionService.create({
      organisationId: data.organisationId,
      clientBaseId: data.clientBaseId,
      transporteurCompteId: data.transporteurCompteId,
      contratId: data.contratId,
      trackingNumber: labelResult.trackingNumber,
      labelUrl: labelResult.labelUrl,
      referenceCommande: data.referenceCommande,
      produitId: data.produitId,
      nomProduit: data.nomProduit,
      poids: data.poids,
      adresseDestination: data.destination?.line1,
      villeDestination: data.destination?.city,
      codePostalDestination: data.destination?.postalCode,
      dateExpedition: data.dateExpedition ? new Date(data.dateExpedition) : undefined,
      dateLivraisonEstimee: labelResult.estimatedDeliveryDate
        ? new Date(labelResult.estimatedDeliveryDate)
        : undefined,
    });

    return this.mapToResponse(expedition);
  }

  @GrpcMethod('LogisticsService', 'GetExpedition')
  async getExpedition(data: GetByIdRequest): Promise<ExpeditionResponse> {
    this.logger.log(`GetExpedition: ${data.id}`);

    const expedition = await this.expeditionService.findById(data.id);
    if (!expedition) {
      throw new Error('Expedition not found');
    }

    return this.mapToResponse(expedition);
  }

  @GrpcMethod('LogisticsService', 'GetExpeditionsByClient')
  async getExpeditionsByClient(data: GetExpeditionsByClientRequest): Promise<ExpeditionListResponse> {
    this.logger.log(`GetExpeditionsByClient: ${data.clientBaseId}`);

    const { expeditions, total } = await this.expeditionService.findByClientId(
      data.clientBaseId,
      data.limit || 50,
      data.offset || 0,
    );

    return {
      expeditions: expeditions.map((e) => this.mapToResponse(e)),
      total,
    };
  }

  @GrpcMethod('LogisticsService', 'GetExpeditionsByOrganisation')
  async getExpeditionsByOrganisation(data: GetExpeditionsByOrganisationRequest): Promise<ExpeditionListResponse> {
    this.logger.log(`GetExpeditionsByOrganisation: ${data.organisationId}`);

    const { expeditions, total } = await this.expeditionService.findByOrganisationId(
      data.organisationId,
      data.etat,
      data.limit || 50,
      data.offset || 0,
    );

    return {
      expeditions: expeditions.map((e) => this.mapToResponse(e)),
      total,
    };
  }

  @GrpcMethod('LogisticsService', 'UpdateExpedition')
  async updateExpedition(data: UpdateExpeditionRequest): Promise<ExpeditionResponse> {
    this.logger.log(`UpdateExpedition: ${data.id}`);

    const expedition = await this.expeditionService.update(data.id, {
      etat: data.etat,
      lieuActuel: data.lieuActuel,
      dateLivraison: data.dateLivraison ? new Date(data.dateLivraison) : undefined,
    });

    return this.mapToResponse(expedition);
  }

  @GrpcMethod('LogisticsService', 'DeleteExpedition')
  async deleteExpedition(data: GetByIdRequest): Promise<DeleteResponse> {
    this.logger.log(`DeleteExpedition: ${data.id}`);

    await this.expeditionService.delete(data.id);
    return { success: true, message: 'Expedition deleted successfully' };
  }

  private mapToResponse(expedition: ExpeditionEntity): ExpeditionResponse {
    return {
      id: expedition.id,
      organisationId: expedition.organisationId,
      clientBaseId: expedition.clientBaseId,
      transporteurCompteId: expedition.transporteurCompteId,
      contratId: expedition.contratId ?? undefined,
      trackingNumber: expedition.trackingNumber,
      etat: expedition.etat,
      dateCreation: expedition.dateCreation?.toISOString() ?? '',
      dateDernierStatut: expedition.dateDernierStatut?.toISOString() ?? '',
      labelUrl: expedition.labelUrl,
      referenceCommande: expedition.referenceCommande,
      produitId: expedition.produitId ?? undefined,
      nomProduit: expedition.nomProduit ?? undefined,
      poids: expedition.poids ? Number(expedition.poids) : undefined,
      adresseDestination: expedition.adresseDestination ?? undefined,
      villeDestination: expedition.villeDestination ?? undefined,
      codePostalDestination: expedition.codePostalDestination ?? undefined,
      dateExpedition: expedition.dateExpedition?.toISOString(),
      dateLivraisonEstimee: expedition.dateLivraisonEstimee?.toISOString(),
      dateLivraison: expedition.dateLivraison?.toISOString(),
      lieuActuel: expedition.lieuActuel ?? undefined,
      createdAt: expedition.createdAt?.toISOString() ?? '',
      updatedAt: expedition.updatedAt?.toISOString() ?? '',
    };
  }
}
