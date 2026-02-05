import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { randomUUID as uuid } from 'crypto';
import {
  MailevaAuthResponse,
  MailevaTrackingResponse,
  MailevaSendingRequest,
  MailevaSendingResponse,
  MailevaRecipient,
  MAILEVA_STATUS_MAPPING,
  MAILEVA_ENDPOINTS,
  MAILEVA_AUTH_ENDPOINTS,
} from './maileva-api.types';
import type {
  IMailevaService,
  LogisticsAddress,
  LabelRequest,
  LabelResponse,
  TrackingResponse,
  AddressValidationResponse,
  PricingResponse,
} from '../../../application/logistics/ports';

@Injectable()
export class MailevaService implements IMailevaService {
  private readonly logger = new Logger(MailevaService.name);
  private readonly httpClient: AxiosInstance;
  private readonly login: string;
  private readonly password: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly apiUrl: string;
  private readonly useMock: boolean;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(private readonly configService: ConfigService) {
    this.login = this.configService.get<string>('MAILEVA_LOGIN', '');
    this.password = this.configService.get<string>('MAILEVA_PASSWORD', '');
    this.clientId = this.configService.get<string>('MAILEVA_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('MAILEVA_CLIENT_SECRET', '');

    const isSandbox = this.configService.get<string>('MAILEVA_SANDBOX', 'true') === 'true';
    this.apiUrl = isSandbox
      ? 'https://api.sandbox.maileva.net/mail/v2'
      : 'https://api.maileva.com/mail/v2';
    this.useMock = this.configService.get<string>('MAILEVA_USE_MOCK', 'true') === 'true';

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });

    if ((!this.login || !this.password || !this.clientId || !this.clientSecret) && !this.useMock) {
      this.logger.warn('Maileva credentials not fully configured. Service will use mock data.');
    }
  }

  private async authenticate(): Promise<string> {
    if (this.useMock) {
      return 'mock-access-token';
    }

    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      this.logger.debug('Authenticating with Maileva API');

      const isSandbox = this.configService.get<string>('MAILEVA_SANDBOX', 'true') === 'true';
      const authUrl = isSandbox ? MAILEVA_AUTH_ENDPOINTS.SANDBOX : MAILEVA_AUTH_ENDPOINTS.PRODUCTION;

      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('username', this.login);
      params.append('password', this.password);

      const response = await axios.post<MailevaAuthResponse>(authUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        auth: { username: this.clientId, password: this.clientSecret },
        timeout: 10000,
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      this.logger.debug('Successfully authenticated with Maileva');
      return this.accessToken;
    } catch (error: any) {
      this.logger.error('Failed to authenticate with Maileva', { error: error.message });
      throw new HttpException("Échec de l'authentification Maileva", HttpStatus.UNAUTHORIZED);
    }
  }

  private async getAuthHeader(): Promise<{ Authorization: string }> {
    const token = await this.authenticate();
    return { Authorization: `Bearer ${token}` };
  }

  async generateLabel(args: LabelRequest): Promise<LabelResponse> {
    this.logger.debug('Generating label with Maileva API', args);

    if (this.useMock) {
      return this.getMockLabelResponse();
    }

    try {
      const authHeader = await this.getAuthHeader();

      const sendingRequest: MailevaSendingRequest = {
        name: `Envoi ${new Date().toISOString()}`,
        postage_type: this.getPostageType(args.serviceLevel),
        color_printing: false,
        duplex_printing: true,
        optional_address_sheet: false,
      };

      const sendingResponse = await this.httpClient.post<MailevaSendingResponse>(
        MAILEVA_ENDPOINTS.SENDINGS,
        sendingRequest,
        { headers: authHeader },
      );

      const sendingId = sendingResponse.data.id;

      const recipient: MailevaRecipient = {
        address_line_2: args.recipient.line1,
        address_line_4: args.recipient.line2 || undefined,
        address_line_6: `${args.recipient.postalCode} ${args.recipient.city}`,
        country_code: args.recipient.country,
      };

      await this.httpClient.post(MAILEVA_ENDPOINTS.RECIPIENTS(sendingId), recipient, { headers: authHeader });
      await this.httpClient.post(MAILEVA_ENDPOINTS.SUBMIT(sendingId), {}, { headers: authHeader });

      return {
        trackingNumber: sendingId,
        labelUrl: `${this.apiUrl}/sendings/${sendingId}/label`,
        estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error: any) {
      this.logger.error('Error generating label with Maileva', { error: error.message });
      throw this.handleMailevaError(error);
    }
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    this.logger.debug('Fetching tracking from Maileva API', { trackingNumber, useMock: this.useMock });

    if (this.useMock) {
      return this.getMockTrackingData(trackingNumber);
    }

    try {
      const authHeader = await this.getAuthHeader();

      await this.httpClient.get<MailevaSendingResponse>(
        `${MAILEVA_ENDPOINTS.SENDINGS}/${trackingNumber}`,
        { headers: authHeader },
      );

      const recipientsResponse = await this.httpClient.get(
        MAILEVA_ENDPOINTS.RECIPIENTS(trackingNumber),
        { headers: authHeader },
      );

      const recipients = recipientsResponse.data;
      if (!recipients || recipients.length === 0) {
        throw new HttpException('Aucun destinataire trouvé pour cet envoi', HttpStatus.NOT_FOUND);
      }

      const recipientId = recipients[0].id;
      const trackingResponse = await this.httpClient.get<MailevaTrackingResponse>(
        MAILEVA_ENDPOINTS.TRACKING(trackingNumber, recipientId),
        { headers: authHeader },
      );

      return this.mapMailevaResponseToTracking(trackingResponse.data);
    } catch (error: any) {
      this.logger.error('Error fetching tracking from Maileva', { trackingNumber, error: error.message });
      throw this.handleMailevaError(error);
    }
  }

  private mapMailevaResponseToTracking(trackingData: MailevaTrackingResponse): TrackingResponse {
    const statusInfo = MAILEVA_STATUS_MAPPING[trackingData.status] || {
      normalizedStatus: 'unknown',
      isFinal: false,
      description: 'Statut inconnu',
    };

    return {
      trackingNumber: trackingData.tracking_number || trackingData.sending_id,
      status: statusInfo.normalizedStatus,
      events: trackingData.events.map((event) => ({
        code: event.code,
        label: event.label,
        date: event.date,
        location: event.location || null,
      })),
      lastUpdatedAt: trackingData.last_update,
    };
  }

  validateAddress(address: LogisticsAddress): AddressValidationResponse {
    this.logger.debug('Validating address', address);

    return {
      isValid: true,
      normalizedAddress: {
        line1: address.line1.toUpperCase(),
        line2: address.line2 ?? null,
        postalCode: address.postalCode,
        city: address.city.toUpperCase(),
        country: address.country.toUpperCase(),
      },
    };
  }

  simulatePricing(args: {
    serviceLevel: string;
    format: string;
    weightGr: number;
    originCountry: string;
    destinationCountry: string;
  }): PricingResponse {
    this.logger.debug('Simulating pricing with Maileva', args);

    const basePrice = 1.5;
    const international = args.originCountry !== args.destinationCountry;
    const postageType = this.getPostageType(args.serviceLevel);

    let totalPrice = basePrice;
    if (postageType === 'URGENT') totalPrice *= 1.8;
    else if (postageType === 'FAST') totalPrice *= 1.3;

    if (international) totalPrice *= 2.5;

    let estimatedDays = 4;
    if (postageType === 'URGENT') estimatedDays = 2;
    else if (postageType === 'FAST') estimatedDays = 3;
    if (international) estimatedDays += 2;

    return {
      serviceLevel: args.serviceLevel,
      totalPrice: Number(totalPrice.toFixed(2)),
      currency: 'EUR',
      breakdown: [
        { label: 'Affranchissement', amount: Number((totalPrice * 0.85).toFixed(2)) },
        { label: 'Traitement', amount: Number((totalPrice * 0.15).toFixed(2)) },
      ],
      estimatedDeliveryDays: estimatedDays,
    };
  }

  private getPostageType(serviceLevel: string): 'URGENT' | 'FAST' | 'ECONOMIC' {
    const levelLower = serviceLevel.toLowerCase();
    if (levelLower.includes('urgent') || levelLower.includes('prioritaire') || levelLower.includes('priority')) {
      return 'URGENT';
    }
    if (levelLower.includes('fast') || levelLower.includes('courant') || levelLower.includes('normal')) {
      return 'FAST';
    }
    return 'ECONOMIC';
  }

  private getMockLabelResponse(): LabelResponse {
    const trackingNumber = `MV${uuid().replace(/-/g, '').slice(0, 18)}`;
    return {
      trackingNumber,
      labelUrl: `https://api.maileva.com/sendings/${trackingNumber}/label`,
      estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  private getMockTrackingData(trackingNumber: string): TrackingResponse {
    this.logger.debug('Using mock data for tracking', { trackingNumber });

    const now = new Date();
    return {
      trackingNumber,
      status: 'in_transit',
      events: [
        {
          code: 'CREATED',
          label: 'Envoi créé sur la plateforme Maileva',
          date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          code: 'IN_PRODUCTION',
          label: 'Courrier en cours de production',
          date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Centre de production Maileva',
        },
        {
          code: 'POSTED',
          label: 'Courrier posté et pris en charge par La Poste',
          date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          location: null,
        },
        {
          code: 'IN_TRANSIT',
          label: "Courrier en cours d'acheminement",
          date: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
          location: null,
        },
      ],
      lastUpdatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    };
  }

  private handleMailevaError(error: any): HttpException {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      switch (status) {
        case 400:
          return new HttpException(data?.error_description || 'Requête invalide', HttpStatus.BAD_REQUEST);
        case 401:
          return new HttpException('Authentification Maileva invalide', HttpStatus.UNAUTHORIZED);
        case 404:
          return new HttpException('Ressource Maileva non trouvée', HttpStatus.NOT_FOUND);
        case 429:
          return new HttpException("Limite de taux d'API Maileva dépassée", HttpStatus.TOO_MANY_REQUESTS);
        case 500:
        case 503:
          return new HttpException('Service Maileva temporairement indisponible', HttpStatus.SERVICE_UNAVAILABLE);
        default:
          return new HttpException(
            data?.message || 'Erreur lors de la communication avec Maileva',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    }

    return new HttpException(
      'Erreur inconnue lors de la communication avec Maileva',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
