import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ExpeditionService } from './modules/expedition/expedition.service.js';
import { ColisService } from './modules/colis/colis.service.js';
import { TrackingService } from './modules/tracking/tracking.service.js';
import { CarrierService } from './modules/carrier/carrier.service.js';
import { MailevaService } from './modules/maileva/maileva.service.js';
import type {
  CreateExpeditionRequest,
  ExpeditionResponse,
  GetByIdRequest,
  GetExpeditionsByClientRequest,
  GetExpeditionsByOrganisationRequest,
  ExpeditionListResponse,
  UpdateExpeditionRequest,
  DeleteResponse,
  CreateColisRequest,
  ColisResponse,
  GetByExpeditionIdRequest,
  ColisListResponse,
  UpdateColisRequest,
  CreateTrackingEventRequest,
  TrackingEventResponse,
  TrackingEventListResponse,
  CreateCarrierAccountRequest,
  CarrierAccountResponse,
  GetByOrganisationIdRequest,
  CarrierAccountListResponse,
  UpdateCarrierAccountRequest,
  GenerateLabelRequest,
  LabelResponse,
  TrackShipmentRequest,
  TrackingResponse,
  ValidateAddressRequest,
  AddressValidationResponse,
  SimulatePricingRequest,
  PricingResponse,
} from '@proto/logistics/logistics';

@Controller()
export class LogisticsController {
  private readonly logger = new Logger(LogisticsController.name);

  constructor(
    private readonly expeditionService: ExpeditionService,
    private readonly colisService: ColisService,
    private readonly trackingService: TrackingService,
    private readonly carrierService: CarrierService,
    private readonly mailevaService: MailevaService,
  ) {}

  // ==================== EXPEDITIONS ====================

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

    return this.mapExpeditionToResponse(expedition);
  }

  @GrpcMethod('LogisticsService', 'GetExpedition')
  async getExpedition(data: GetByIdRequest): Promise<ExpeditionResponse> {
    this.logger.log(`GetExpedition: ${data.id}`);

    const expedition = await this.expeditionService.findById(data.id);
    if (!expedition) {
      throw new Error('Expedition not found');
    }

    return this.mapExpeditionToResponse(expedition);
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
      expeditions: expeditions.map((e) => this.mapExpeditionToResponse(e)),
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
      expeditions: expeditions.map((e) => this.mapExpeditionToResponse(e)),
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

    return this.mapExpeditionToResponse(expedition);
  }

  @GrpcMethod('LogisticsService', 'DeleteExpedition')
  async deleteExpedition(data: GetByIdRequest): Promise<DeleteResponse> {
    this.logger.log(`DeleteExpedition: ${data.id}`);

    await this.expeditionService.delete(data.id);
    return { success: true, message: 'Expedition deleted successfully' };
  }

  // ==================== COLIS ====================

  @GrpcMethod('LogisticsService', 'CreateColis')
  async createColis(data: CreateColisRequest): Promise<ColisResponse> {
    this.logger.log(`CreateColis for expedition: ${data.expeditionId}`);

    const colis = await this.colisService.create({
      expeditionId: data.expeditionId,
      poidsGr: data.poidsGr,
      longCm: data.longCm,
      largCm: data.largCm,
      hautCm: data.hautCm,
      valeurDeclaree: data.valeurDeclaree,
      contenu: data.contenu,
    });

    return this.mapColisToResponse(colis);
  }

  @GrpcMethod('LogisticsService', 'GetColis')
  async getColis(data: GetByIdRequest): Promise<ColisResponse> {
    this.logger.log(`GetColis: ${data.id}`);

    const colis = await this.colisService.findById(data.id);
    if (!colis) {
      throw new Error('Colis not found');
    }

    return this.mapColisToResponse(colis);
  }

  @GrpcMethod('LogisticsService', 'GetColisByExpedition')
  async getColisByExpedition(data: GetByExpeditionIdRequest): Promise<ColisListResponse> {
    this.logger.log(`GetColisByExpedition: ${data.expeditionId}`);

    const colisList = await this.colisService.findByExpeditionId(data.expeditionId);

    return {
      colis: colisList.map((c) => this.mapColisToResponse(c)),
      total: colisList.length,
    };
  }

  @GrpcMethod('LogisticsService', 'UpdateColis')
  async updateColis(data: UpdateColisRequest): Promise<ColisResponse> {
    this.logger.log(`UpdateColis: ${data.id}`);

    const colis = await this.colisService.update(data.id, {
      poidsGr: data.poidsGr,
      longCm: data.longCm,
      largCm: data.largCm,
      hautCm: data.hautCm,
      valeurDeclaree: data.valeurDeclaree,
      contenu: data.contenu,
    });

    return this.mapColisToResponse(colis);
  }

  @GrpcMethod('LogisticsService', 'DeleteColis')
  async deleteColis(data: GetByIdRequest): Promise<DeleteResponse> {
    this.logger.log(`DeleteColis: ${data.id}`);

    await this.colisService.delete(data.id);
    return { success: true, message: 'Colis deleted successfully' };
  }

  // ==================== TRACKING ====================

  @GrpcMethod('LogisticsService', 'CreateTrackingEvent')
  async createTrackingEvent(data: CreateTrackingEventRequest): Promise<TrackingEventResponse> {
    this.logger.log(`CreateTrackingEvent for expedition: ${data.expeditionId}`);

    const event = await this.trackingService.create({
      expeditionId: data.expeditionId,
      code: data.code,
      label: data.label,
      dateEvenement: data.dateEvenement,
      lieu: data.lieu,
      raw: data.raw,
    });

    return this.mapTrackingEventToResponse(event);
  }

  @GrpcMethod('LogisticsService', 'GetTrackingEvents')
  async getTrackingEvents(data: GetByExpeditionIdRequest): Promise<TrackingEventListResponse> {
    this.logger.log(`GetTrackingEvents for expedition: ${data.expeditionId}`);

    const events = await this.trackingService.findByExpeditionId(data.expeditionId);

    return {
      events: events.map((e) => this.mapTrackingEventToResponse(e)),
      total: events.length,
    };
  }

  @GrpcMethod('LogisticsService', 'GetLatestTrackingEvent')
  async getLatestTrackingEvent(data: GetByExpeditionIdRequest): Promise<TrackingEventResponse> {
    this.logger.log(`GetLatestTrackingEvent for expedition: ${data.expeditionId}`);

    const event = await this.trackingService.findLatestByExpeditionId(data.expeditionId);
    if (!event) {
      throw new Error('No tracking events found');
    }

    return this.mapTrackingEventToResponse(event);
  }

  // ==================== CARRIER ACCOUNTS ====================

  @GrpcMethod('LogisticsService', 'CreateCarrierAccount')
  async createCarrierAccount(data: CreateCarrierAccountRequest): Promise<CarrierAccountResponse> {
    this.logger.log(`CreateCarrierAccount for organisation: ${data.organisationId}`);

    const account = await this.carrierService.create({
      organisationId: data.organisationId,
      type: data.type,
      contractNumber: data.contractNumber,
      password: data.password,
      labelFormat: data.labelFormat,
      actif: data.actif,
    });

    return this.mapCarrierAccountToResponse(account);
  }

  @GrpcMethod('LogisticsService', 'GetCarrierAccount')
  async getCarrierAccount(data: GetByIdRequest): Promise<CarrierAccountResponse> {
    this.logger.log(`GetCarrierAccount: ${data.id}`);

    const account = await this.carrierService.findById(data.id);
    if (!account) {
      throw new Error('Carrier account not found');
    }

    return this.mapCarrierAccountToResponse(account);
  }

  @GrpcMethod('LogisticsService', 'GetCarrierAccountsByOrganisation')
  async getCarrierAccountsByOrganisation(data: GetByOrganisationIdRequest): Promise<CarrierAccountListResponse> {
    this.logger.log(`GetCarrierAccountsByOrganisation: ${data.organisationId}`);

    const accounts = await this.carrierService.findByOrganisationId(data.organisationId);

    return {
      accounts: accounts.map((a) => this.mapCarrierAccountToResponse(a)),
      total: accounts.length,
    };
  }

  @GrpcMethod('LogisticsService', 'UpdateCarrierAccount')
  async updateCarrierAccount(data: UpdateCarrierAccountRequest): Promise<CarrierAccountResponse> {
    this.logger.log(`UpdateCarrierAccount: ${data.id}`);

    const account = await this.carrierService.update(data.id, {
      contractNumber: data.contractNumber,
      password: data.password,
      labelFormat: data.labelFormat,
      actif: data.actif,
    });

    return this.mapCarrierAccountToResponse(account);
  }

  @GrpcMethod('LogisticsService', 'DeleteCarrierAccount')
  async deleteCarrierAccount(data: GetByIdRequest): Promise<DeleteResponse> {
    this.logger.log(`DeleteCarrierAccount: ${data.id}`);

    await this.carrierService.delete(data.id);
    return { success: true, message: 'Carrier account deleted successfully' };
  }

  // ==================== MAILEVA OPERATIONS ====================

  @GrpcMethod('LogisticsService', 'GenerateLabel')
  async generateLabel(data: GenerateLabelRequest): Promise<LabelResponse> {
    this.logger.log(`GenerateLabel for organisation: ${data.organisationId}`);

    const result = await this.mailevaService.generateLabel({
      contractId: data.contractId,
      serviceLevel: data.serviceLevel,
      format: data.format,
      weightGr: data.weightGr,
      sender: {
        line1: data.sender?.line1 || '',
        line2: data.sender?.line2,
        postalCode: data.sender?.postalCode || '',
        city: data.sender?.city || '',
        country: data.sender?.country || 'FR',
      },
      recipient: {
        line1: data.recipient?.line1 || '',
        line2: data.recipient?.line2,
        postalCode: data.recipient?.postalCode || '',
        city: data.recipient?.city || '',
        country: data.recipient?.country || 'FR',
      },
    });

    return {
      trackingNumber: result.trackingNumber,
      labelUrl: result.labelUrl,
      estimatedDeliveryDate: result.estimatedDeliveryDate ?? undefined,
    };
  }

  @GrpcMethod('LogisticsService', 'TrackShipment')
  async trackShipment(data: TrackShipmentRequest): Promise<TrackingResponse> {
    this.logger.log(`TrackShipment: ${data.trackingNumber}`);

    const result = await this.mailevaService.trackShipment(data.trackingNumber);

    return {
      trackingNumber: result.trackingNumber,
      status: result.status,
      events: result.events.map((e) => ({
        code: e.code,
        label: e.label,
        date: e.date,
        location: e.location ?? undefined,
      })),
      lastUpdatedAt: result.lastUpdatedAt,
    };
  }

  @GrpcMethod('LogisticsService', 'ValidateAddress')
  async validateAddress(data: ValidateAddressRequest): Promise<AddressValidationResponse> {
    this.logger.log(`ValidateAddress`);

    const result = this.mailevaService.validateAddress({
      line1: data.address?.line1 || '',
      line2: data.address?.line2,
      postalCode: data.address?.postalCode || '',
      city: data.address?.city || '',
      country: data.address?.country || 'FR',
    });

    return {
      isValid: result.isValid,
      normalizedAddress: result.normalizedAddress
        ? {
            line1: result.normalizedAddress.line1,
            line2: result.normalizedAddress.line2 ?? undefined,
            postalCode: result.normalizedAddress.postalCode,
            city: result.normalizedAddress.city,
            country: result.normalizedAddress.country,
          }
        : undefined,
      suggestions: [],
    };
  }

  @GrpcMethod('LogisticsService', 'SimulatePricing')
  async simulatePricing(data: SimulatePricingRequest): Promise<PricingResponse> {
    this.logger.log(`SimulatePricing`);

    const result = this.mailevaService.simulatePricing({
      serviceLevel: data.serviceLevel,
      format: data.format,
      weightGr: data.weightGr,
      originCountry: data.originCountry,
      destinationCountry: data.destinationCountry,
    });

    return {
      serviceLevel: result.serviceLevel,
      totalPrice: result.totalPrice,
      currency: result.currency,
      breakdown: result.breakdown.map((b) => ({
        label: b.label,
        amount: b.amount,
      })),
      estimatedDeliveryDays: result.estimatedDeliveryDays,
    };
  }

  // ==================== MAPPERS ====================

  private mapExpeditionToResponse(expedition: any): ExpeditionResponse {
    return {
      id: expedition.id,
      organisationId: expedition.organisationId,
      clientBaseId: expedition.clientBaseId,
      transporteurCompteId: expedition.transporteurCompteId,
      contratId: expedition.contratId,
      trackingNumber: expedition.trackingNumber,
      etat: expedition.etat,
      dateCreation: expedition.dateCreation?.toISOString() ?? '',
      dateDernierStatut: expedition.dateDernierStatut?.toISOString() ?? '',
      labelUrl: expedition.labelUrl,
      referenceCommande: expedition.referenceCommande,
      produitId: expedition.produitId,
      nomProduit: expedition.nomProduit,
      poids: expedition.poids ? Number(expedition.poids) : undefined,
      adresseDestination: expedition.adresseDestination,
      villeDestination: expedition.villeDestination,
      codePostalDestination: expedition.codePostalDestination,
      dateExpedition: expedition.dateExpedition?.toISOString(),
      dateLivraisonEstimee: expedition.dateLivraisonEstimee?.toISOString(),
      dateLivraison: expedition.dateLivraison?.toISOString(),
      lieuActuel: expedition.lieuActuel,
      createdAt: expedition.createdAt?.toISOString() ?? '',
      updatedAt: expedition.updatedAt?.toISOString() ?? '',
    };
  }

  private mapColisToResponse(colis: any): ColisResponse {
    return {
      id: colis.id,
      expeditionId: colis.expeditionId,
      poidsGr: colis.poidsGr,
      longCm: colis.longCm,
      largCm: colis.largCm,
      hautCm: colis.hautCm,
      valeurDeclaree: Number(colis.valeurDeclaree),
      contenu: colis.contenu,
      createdAt: colis.createdAt?.toISOString() ?? '',
      updatedAt: colis.updatedAt?.toISOString() ?? '',
    };
  }

  private mapTrackingEventToResponse(event: any): TrackingEventResponse {
    return {
      id: event.id,
      expeditionId: event.expeditionId,
      code: event.code,
      label: event.label,
      dateEvenement: event.dateEvenement,
      lieu: event.lieu,
      raw: event.raw,
      createdAt: event.createdAt?.toISOString() ?? '',
    };
  }

  private mapCarrierAccountToResponse(account: any): CarrierAccountResponse {
    return {
      id: account.id,
      organisationId: account.organisationId,
      type: account.type,
      contractNumber: account.contractNumber,
      labelFormat: account.labelFormat,
      actif: account.actif,
      createdAt: account.createdAt?.toISOString() ?? '',
      updatedAt: account.updatedAt?.toISOString() ?? '',
    };
  }
}
