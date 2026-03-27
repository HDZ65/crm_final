import * as crypto from 'node:crypto';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CatalogueWebhookEventEntity,
  CatalogueWebhookProcessingStatus,
} from '../../../domain/catalogue-webhook/entities/catalogue-webhook-event.entity';
import {
  WebhookEndpointEntity,
  WebhookEndpointStatus,
} from '../../../domain/catalogue-webhook/entities/webhook-endpoint.entity';
import { WebhookEventDispatchService } from '../../../domain/catalogue-webhook/services/webhook-event-dispatch.service';

function encryptSecret(secret: string): string {
  const key = Buffer.from(process.env.WEBHOOK_ENCRYPTION_KEY || 'default-key-32-chars-padded!!!!!').slice(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptSecret(encrypted: string): string {
  const key = Buffer.from(process.env.WEBHOOK_ENCRYPTION_KEY || 'default-key-32-chars-padded!!!!!').slice(0, 32);
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0] ?? '', 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(Buffer.from(parts[1] ?? '', 'hex')), decipher.final()]).toString('utf8');
}

type RegisterEndpointRequest = {
  partner_id: string;
  event_type: string;
  secret: string;
  allowed_ips?: string[];
};

type ListEndpointsRequest = { partner_id?: string };
type GetByIdRequest = { id: string };

type GetPartnerSecretRequest = {
  partner_id: string;
  event_type: string;
};

type LogWebhookEventRequest = {
  partner_id: string;
  event_type: string;
  event_id: string;
  payload_json: string;
  signature: string;
  signature_valid: boolean;
  endpoint_id?: string;
};

type ListWebhookEventsRequest = {
  partner_id: string;
  status?: string;
  limit?: number;
};

@Controller()
export class WebhookGrpcController {
  private readonly logger = new Logger(WebhookGrpcController.name);

  constructor(
    @InjectRepository(WebhookEndpointEntity)
    private readonly endpointRepository: Repository<WebhookEndpointEntity>,
    @InjectRepository(CatalogueWebhookEventEntity)
    private readonly eventRepository: Repository<CatalogueWebhookEventEntity>,
    private readonly webhookDispatchService: WebhookEventDispatchService,
  ) {}

  @GrpcMethod('WebhookService', 'RegisterEndpoint')
  async registerEndpoint(request: RegisterEndpointRequest): Promise<{ id: string; success: boolean }> {
    const endpoint = this.endpointRepository.create({
      partnerId: request.partner_id,
      eventType: request.event_type,
      secretEncrypted: encryptSecret(request.secret),
      allowedIps: request.allowed_ips?.length ? request.allowed_ips : null,
      isActive: true,
      status: WebhookEndpointStatus.ACTIVE,
    });

    const created = await this.endpointRepository.save(endpoint);
    return { id: created.id, success: true };
  }

  @GrpcMethod('WebhookService', 'ListEndpoints')
  async listEndpoints(request: ListEndpointsRequest): Promise<{ endpoints: Array<Record<string, string>> }> {
    const where = request.partner_id ? { partnerId: request.partner_id } : {};
    const endpoints = await this.endpointRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return {
      endpoints: endpoints.map((endpoint) => ({
        id: endpoint.id,
        partner_id: endpoint.partnerId,
        event_type: endpoint.eventType,
        status: endpoint.status,
        created_at: endpoint.createdAt?.toISOString() || '',
      })),
    };
  }

  @GrpcMethod('WebhookService', 'GetEndpoint')
  async getEndpoint(request: GetByIdRequest): Promise<Record<string, string>> {
    const endpoint = await this.endpointRepository.findOne({ where: { id: request.id } });

    if (!endpoint) {
      return {
        id: '',
        partner_id: '',
        event_type: '',
        status: '',
        created_at: '',
      };
    }

    return {
      id: endpoint.id,
      partner_id: endpoint.partnerId,
      event_type: endpoint.eventType,
      status: endpoint.status,
      created_at: endpoint.createdAt?.toISOString() || '',
    };
  }

  @GrpcMethod('WebhookService', 'DeleteEndpoint')
  async deleteEndpoint(request: GetByIdRequest): Promise<{ success: boolean }> {
    const result = await this.endpointRepository.delete(request.id);
    return { success: Boolean(result.affected) };
  }

  @GrpcMethod('WebhookService', 'GetPartnerSecret')
  async getPartnerSecret(
    request: GetPartnerSecretRequest,
  ): Promise<{ secret: string; allowed_ips: string[]; found: boolean }> {
    const endpoint = await this.endpointRepository.findOne({
      where: {
        partnerId: request.partner_id,
        eventType: request.event_type,
        isActive: true,
        status: WebhookEndpointStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });

    if (!endpoint) {
      return { secret: '', allowed_ips: [], found: false };
    }

    try {
      const secret = decryptSecret(endpoint.secretEncrypted);
      return {
        secret,
        allowed_ips: endpoint.allowedIps || [],
        found: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to decrypt webhook secret for endpoint ${endpoint.id}: ${message}`);
      return { secret: '', allowed_ips: [], found: false };
    }
  }

  @GrpcMethod('WebhookService', 'LogWebhookEvent')
  async logWebhookEvent(request: LogWebhookEventRequest): Promise<{ id: string; success: boolean }> {
    const event = this.eventRepository.create({
      keycloakGroupId: request.partner_id,
      eventId: request.event_id,
      eventType: request.event_type,
      payload: this.sanitizePayload(request.payload_json),
      apiKeyValid: request.signature_valid,
      signature: request.signature || null,
      endpointId: request.endpoint_id || null,
      processingStatus: CatalogueWebhookProcessingStatus.RECEIVED,
      retryCount: 0,
      errorMessage: null,
      processedAt: null,
    });

    const saved = await this.eventRepository.save(event);
    await this.webhookDispatchService.dispatchEvent(saved.id);

    return { id: saved.id, success: true };
  }

  @GrpcMethod('WebhookService', 'ListWebhookEvents')
  async listWebhookEvents(
    request: ListWebhookEventsRequest,
  ): Promise<{ events: Array<Record<string, string | number>> }> {
    const where: {
      keycloakGroupId: string;
      processingStatus?: CatalogueWebhookProcessingStatus;
    } = {
      keycloakGroupId: request.partner_id,
    };

    const normalizedStatus = this.normalizeStatus(request.status);
    if (normalizedStatus) {
      where.processingStatus = normalizedStatus;
    }

    const events = await this.eventRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: request.limit && request.limit > 0 ? request.limit : 100,
    });

    return {
      events: events.map((event) => ({
        id: event.id,
        event_type: event.eventType,
        status: event.processingStatus,
        retry_count: event.retryCount,
        error_message: event.errorMessage || '',
        created_at: event.createdAt?.toISOString() || '',
      })),
    };
  }

  @GrpcMethod('WebhookService', 'RetryWebhookEvent')
  async retryWebhookEvent(request: GetByIdRequest): Promise<{ success: boolean; status: string }> {
    return this.webhookDispatchService.retryEvent(request.id);
  }

  private normalizeStatus(status?: string): CatalogueWebhookProcessingStatus | undefined {
    if (!status) {
      return undefined;
    }

    const upper = status.toUpperCase();
    if (upper in CatalogueWebhookProcessingStatus) {
      return CatalogueWebhookProcessingStatus[upper as keyof typeof CatalogueWebhookProcessingStatus];
    }

    return undefined;
  }

  private sanitizePayload(payloadJson: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(payloadJson) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return {
          keys: Object.keys(parsed as Record<string, unknown>),
          size: payloadJson.length,
        };
      }

      if (Array.isArray(parsed)) {
        return {
          keys: ['array'],
          size: payloadJson.length,
          count: parsed.length,
        };
      }

      return { keys: ['scalar'], size: payloadJson.length };
    } catch {
      return { keys: ['invalid_json'], size: payloadJson.length };
    }
  }
}
