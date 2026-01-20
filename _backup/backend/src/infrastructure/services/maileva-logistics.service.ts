import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  LogisticsProviderPort,
  LogisticsLabelRequest,
  LogisticsLabelResponse,
  LogisticsTrackingResponse,
  LogisticsAddress,
  LogisticsAddressValidationResponse,
  LogisticsPricingSimulationResponse,
} from '../../core/port/logistics-provider.port';
import { v4 as uuid } from 'uuid';
import axios, { AxiosInstance } from 'axios';
import type {
  MailevaAuthResponse,
  MailevaTrackingResponse,
  MailevaSendingRequest,
  MailevaSendingResponse,
  MailevaRecipient,
  MailevaApiError,
} from './maileva-api.types';
import {
  MAILEVA_STATUS_MAPPING,
  MAILEVA_ENDPOINTS,
  MAILEVA_AUTH_ENDPOINTS,
} from './maileva-api.types';

@Injectable()
export class MailevaLogisticsService implements LogisticsProviderPort {
  private readonly logger = new Logger(MailevaLogisticsService.name);
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
    this.clientSecret = this.configService.get<string>(
      'MAILEVA_CLIENT_SECRET',
      '',
    );
    const isSandbox =
      this.configService.get<string>('MAILEVA_SANDBOX', 'true') === 'true';
    this.apiUrl = isSandbox
      ? 'https://api.sandbox.maileva.net/mail/v2'
      : 'https://api.maileva.com/mail/v2';
    this.useMock =
      this.configService.get<string>('MAILEVA_USE_MOCK', 'true') === 'true';

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });

    if (
      (!this.login || !this.password || !this.clientId || !this.clientSecret) &&
      !this.useMock
    ) {
      this.logger.warn(
        'Maileva credentials not fully configured. Service will use mock data.',
      );
    }
  }

  /**
   * Authenticate with Maileva API and get access token
   * Uses OAuth2 password flow
   */
  private async authenticate(): Promise<string> {
    if (this.useMock) {
      return 'mock-access-token';
    }

    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      this.logger.debug('Authenticating with Maileva API');

      const isSandbox =
        this.configService.get<string>('MAILEVA_SANDBOX', 'true') === 'true';
      const authUrl = isSandbox
        ? MAILEVA_AUTH_ENDPOINTS.SANDBOX
        : MAILEVA_AUTH_ENDPOINTS.PRODUCTION;

      // OAuth2 password flow with form-urlencoded
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('username', this.login);
      params.append('password', this.password);

      const response = await axios.post<MailevaAuthResponse>(authUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: this.clientId,
          password: this.clientSecret,
        },
        timeout: 10000,
      });

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry to avoid edge cases
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      this.logger.debug('Successfully authenticated with Maileva');
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to authenticate with Maileva', {
        error: error.message,
      });
      throw new HttpException(
        "Échec de l'authentification Maileva",
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Get authorization header with bearer token
   */
  private async getAuthHeader(): Promise<{ Authorization: string }> {
    const token = await this.authenticate();
    return { Authorization: `Bearer ${token}` };
  }

  async generateLabel(
    args: LogisticsLabelRequest,
  ): Promise<LogisticsLabelResponse> {
    this.logger.debug('Generating label with Maileva API', args);

    if (this.useMock) {
      return this.getMockLabelResponse();
    }

    try {
      const authHeader = await this.getAuthHeader();

      // Create sending
      const sendingRequest: MailevaSendingRequest = {
        name: `Envoi ${new Date().toISOString()}`,
        postage_type: this.getPostageType(args.serviceLevel),
        color_printing: false,
        duplex_printing: true,
        optional_address_sheet: false,
      };

      const sendingResponse =
        await this.httpClient.post<MailevaSendingResponse>(
          MAILEVA_ENDPOINTS.SENDINGS,
          sendingRequest,
          { headers: authHeader },
        );

      const sendingId = sendingResponse.data.id;

      // Add recipient - address_line_6 and country_code are required
      const recipient: MailevaRecipient = {
        address_line_2: args.recipient.line1, // Ligne 2: Civilité, Prénom, Nom
        address_line_4: args.recipient.line2 || undefined, // Ligne 4: N° et libellé de la voie
        address_line_6: `${args.recipient.postalCode} ${args.recipient.city}`, // Required: Code postal + ville
        country_code: args.recipient.country, // Required
      };

      await this.httpClient.post(
        MAILEVA_ENDPOINTS.RECIPIENTS(sendingId),
        recipient,
        { headers: authHeader },
      );

      // Submit sending
      await this.httpClient.post(
        MAILEVA_ENDPOINTS.SUBMIT(sendingId),
        {},
        { headers: authHeader },
      );

      return {
        trackingNumber: sendingId,
        labelUrl: `${this.apiUrl}/sendings/${sendingId}/label`,
        estimatedDeliveryDate: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    } catch (error) {
      this.logger.error('Error generating label with Maileva', {
        error: error.message,
      });
      throw this.handleMailevaError(error);
    }
  }

  async trackShipment(
    trackingNumber: string,
  ): Promise<LogisticsTrackingResponse> {
    this.logger.debug('Fetching tracking from Maileva API', {
      trackingNumber,
      useMock: this.useMock,
    });

    if (this.useMock) {
      return this.getMockTrackingData(trackingNumber);
    }

    try {
      const authHeader = await this.getAuthHeader();

      // In Maileva, trackingNumber is the sending_id
      // We need to get the first recipient for tracking
      const response = await this.httpClient.get<MailevaSendingResponse>(
        `${MAILEVA_ENDPOINTS.SENDINGS}/${trackingNumber}`,
        { headers: authHeader },
      );

      // Get recipients
      const recipientsResponse = await this.httpClient.get(
        MAILEVA_ENDPOINTS.RECIPIENTS(trackingNumber),
        { headers: authHeader },
      );

      const recipients = recipientsResponse.data;
      if (!recipients || recipients.length === 0) {
        throw new HttpException(
          'Aucun destinataire trouvé pour cet envoi',
          HttpStatus.NOT_FOUND,
        );
      }

      // Get tracking for first recipient
      const recipientId = recipients[0].id;
      const trackingResponse =
        await this.httpClient.get<MailevaTrackingResponse>(
          MAILEVA_ENDPOINTS.TRACKING(trackingNumber, recipientId),
          { headers: authHeader },
        );

      return this.mapMailevaResponseToTracking(trackingResponse.data);
    } catch (error) {
      this.logger.error('Error fetching tracking from Maileva', {
        trackingNumber,
        error: error.message,
      });
      throw this.handleMailevaError(error);
    }
  }

  private mapMailevaResponseToTracking(
    trackingData: MailevaTrackingResponse,
  ): LogisticsTrackingResponse {
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

  validateAddress(
    address: LogisticsAddress,
  ): Promise<LogisticsAddressValidationResponse> {
    this.logger.debug('Validating address with Maileva API', address);

    // Maileva has built-in address validation, for now return simple validation
    return Promise.resolve({
      isValid: true,
      normalizedAddress: {
        line1: address.line1.toUpperCase(),
        line2: address.line2 ?? null,
        postalCode: address.postalCode,
        city: address.city.toUpperCase(),
        country: address.country.toUpperCase(),
      },
    });
  }

  simulatePricing(args: {
    serviceLevel: string;
    format: string;
    weightGr: number;
    originCountry: string;
    destinationCountry: string;
  }): Promise<LogisticsPricingSimulationResponse> {
    this.logger.debug('Simulating pricing with Maileva', args);

    const basePrice = 1.5;
    const international = args.originCountry !== args.destinationCountry;
    const postageType = this.getPostageType(args.serviceLevel);

    let totalPrice = basePrice;
    if (postageType === 'URGENT')
      totalPrice *= 1.8; // J+2 - More expensive
    else if (postageType === 'FAST') totalPrice *= 1.3; // J+3 - Standard
    // ECONOMIC: no multiplier, base price

    if (international) totalPrice *= 2.5;

    let estimatedDays = 4; // ECONOMIC default
    if (postageType === 'URGENT') estimatedDays = 2;
    else if (postageType === 'FAST') estimatedDays = 3;
    if (international) estimatedDays += 2;

    return Promise.resolve({
      serviceLevel: args.serviceLevel,
      totalPrice: Number(totalPrice.toFixed(2)),
      currency: 'EUR',
      breakdown: [
        {
          label: 'Affranchissement',
          amount: Number((totalPrice * 0.85).toFixed(2)),
        },
        { label: 'Traitement', amount: Number((totalPrice * 0.15).toFixed(2)) },
      ],
      estimatedDeliveryDays: estimatedDays,
    });
  }

  private getPostageType(serviceLevel: string): 'URGENT' | 'FAST' | 'ECONOMIC' {
    const levelLower = serviceLevel.toLowerCase();
    if (
      levelLower.includes('urgent') ||
      levelLower.includes('prioritaire') ||
      levelLower.includes('priority') ||
      levelLower.includes('important')
    )
      return 'URGENT'; // J+2
    if (
      levelLower.includes('fast') ||
      levelLower.includes('courant') ||
      levelLower.includes('normal')
    )
      return 'FAST'; // J+3
    return 'ECONOMIC'; // J+4 - Default
  }

  private getMockLabelResponse(): LogisticsLabelResponse {
    const trackingNumber = `MV${uuid().replace(/-/g, '').slice(0, 18)}`;
    return {
      trackingNumber,
      labelUrl: `https://api.maileva.com/sendings/${trackingNumber}/label`,
      estimatedDeliveryDate: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };
  }

  private getMockTrackingData(
    trackingNumber: string,
  ): Promise<LogisticsTrackingResponse> {
    this.logger.debug('Using mock data for tracking', { trackingNumber });

    const now = new Date();
    return Promise.resolve({
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
    });
  }

  private handleMailevaError(error: any): HttpException {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as MailevaApiError | undefined;

      switch (status) {
        case 400:
          return new HttpException(
            data?.error_description || 'Requête invalide',
            HttpStatus.BAD_REQUEST,
          );
        case 401:
          return new HttpException(
            'Authentification Maileva invalide',
            HttpStatus.UNAUTHORIZED,
          );
        case 404:
          return new HttpException(
            'Ressource Maileva non trouvée',
            HttpStatus.NOT_FOUND,
          );
        case 429:
          return new HttpException(
            "Limite de taux d'API Maileva dépassée",
            HttpStatus.TOO_MANY_REQUESTS,
          );
        case 500:
        case 503:
          return new HttpException(
            'Service Maileva temporairement indisponible',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
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
