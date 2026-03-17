import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { YousignWebhookController } from '../yousign-webhook.controller';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = 'test-webhook-secret-32bytes-long!';

function makePayload(eventName: string, overrides: Record<string, unknown> = {}) {
  return {
    event_name: eventName,
    event_time: '2026-03-15T12:00:00Z',
    data: {
      signature_request: {
        id: 'sr-001',
        status: 'done',
        external_id: 'contrat-42',
        signers: [
          {
            id: 'signer-1',
            info: {
              first_name: 'Jean',
              last_name: 'Dupont',
              email: 'jean@example.com',
            },
            status: 'signed',
          },
        ],
        documents: [
          { id: 'doc-1', filename: 'contract.pdf', nature: 'signable_document' },
        ],
        ...overrides,
      },
    },
  };
}

function hmacSign(body: Buffer, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

function createMockConfigService() {
  return {
    get: mock((key: string) => {
      if (key === 'YOUSIGN_WEBHOOK_SECRET') return WEBHOOK_SECRET;
      return undefined;
    }),
  };
}

function createMockNatsPublisher() {
  return {
    publish: mock(() => Promise.resolve()),
  };
}

function createMockYousignClient() {
  return {
    downloadSignedDocument: mock(() => Promise.resolve(Buffer.from('signed-pdf'))),
  };
}

function createRequest(body: unknown): { rawBody: Buffer } {
  const rawBody = Buffer.from(JSON.stringify(body));
  return { rawBody };
}

describe('YousignWebhookController', () => {
  let controller: YousignWebhookController;
  let mockNats: ReturnType<typeof createMockNatsPublisher>;
  let mockYousign: ReturnType<typeof createMockYousignClient>;

  beforeEach(() => {
    const configService = createMockConfigService();
    mockNats = createMockNatsPublisher();
    mockYousign = createMockYousignClient();

    controller = new YousignWebhookController(
      configService as unknown as import('@nestjs/config').ConfigService,
      mockNats as unknown as import('../../../nats/nats-publisher.service').NatsPublisherService,
      mockYousign as unknown as import('../yousign-api.client').YousignApiClient,
    );
  });

  // -------------------------------------------------------------------------
  // HMAC Validation
  // -------------------------------------------------------------------------
  describe('HMAC validation', () => {
    it('should accept a request with a valid HMAC signature', async () => {
      const payload = makePayload('signature_request.done');
      const rawBody = Buffer.from(JSON.stringify(payload));
      const signature = hmacSign(rawBody, WEBHOOK_SECRET);
      const req = { rawBody } as unknown as import('express').Request & { rawBody: Buffer };

      const result = await controller.handleWebhook(signature, req as never);

      expect(result).toEqual({ received: true });
    });

    it('should reject a request with an invalid HMAC signature', async () => {
      const payload = makePayload('signature_request.done');
      const rawBody = Buffer.from(JSON.stringify(payload));
      const badSignature = hmacSign(rawBody, 'wrong-secret');
      const req = { rawBody } as unknown as import('express').Request & { rawBody: Buffer };

      await expect(
        controller.handleWebhook(badSignature, req as never),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject when signature header is missing', async () => {
      const payload = makePayload('signature_request.done');
      const rawBody = Buffer.from(JSON.stringify(payload));
      const req = { rawBody } as unknown as import('express').Request & { rawBody: Buffer };

      await expect(
        controller.handleWebhook(undefined, req as never),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject when raw body is missing', async () => {
      const req = { rawBody: undefined } as unknown as import('express').Request & { rawBody: Buffer };

      await expect(
        controller.handleWebhook('some-sig', req as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject all requests when webhook secret is not configured', async () => {
      const noSecretConfig = {
        get: mock(() => undefined),
      };
      const ctrl = new YousignWebhookController(
        noSecretConfig as unknown as import('@nestjs/config').ConfigService,
        mockNats as unknown as import('../../../nats/nats-publisher.service').NatsPublisherService,
        mockYousign as unknown as import('../yousign-api.client').YousignApiClient,
      );

      const payload = makePayload('signature_request.done');
      const rawBody = Buffer.from(JSON.stringify(payload));
      const req = { rawBody } as unknown as import('express').Request & { rawBody: Buffer };

      await expect(
        ctrl.handleWebhook('any-sig', req as never),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------------------
  // Event handling: signature_request.done
  // -------------------------------------------------------------------------
  describe('event: signature_request.done', () => {
    it('should download signed documents and publish NATS event', async () => {
      const payload = makePayload('signature_request.done');
      const rawBody = Buffer.from(JSON.stringify(payload));
      const signature = hmacSign(rawBody, WEBHOOK_SECRET);
      const req = { rawBody } as unknown as import('express').Request & { rawBody: Buffer };

      await controller.handleWebhook(signature, req as never);

      expect(mockYousign.downloadSignedDocument).toHaveBeenCalledTimes(1);
      expect(mockNats.publish).toHaveBeenCalledTimes(1);

      const [subject, data] = mockNats.publish.mock.calls[0] as [string, Record<string, unknown>];
      expect(subject).toBe('crm.document.signed');
      expect(data.signature_request_id).toBe('sr-001');
      expect(data.contrat_id).toBe('contrat-42');
      expect(data.signer_email).toBe('jean@example.com');
    });
  });

  // -------------------------------------------------------------------------
  // Event handling: signature_request.expired
  // -------------------------------------------------------------------------
  describe('event: signature_request.expired', () => {
    it('should publish signature failed event with reason expired', async () => {
      const payload = makePayload('signature_request.expired');
      const rawBody = Buffer.from(JSON.stringify(payload));
      const signature = hmacSign(rawBody, WEBHOOK_SECRET);
      const req = { rawBody } as unknown as import('express').Request & { rawBody: Buffer };

      await controller.handleWebhook(signature, req as never);

      expect(mockNats.publish).toHaveBeenCalledTimes(1);

      const [subject, data] = mockNats.publish.mock.calls[0] as [string, Record<string, unknown>];
      expect(subject).toBe('crm.document.signature.failed');
      expect(data.reason).toBe('expired');
      expect(data.signature_request_id).toBe('sr-001');
    });
  });

  // -------------------------------------------------------------------------
  // Event handling: signature_request.declined
  // -------------------------------------------------------------------------
  describe('event: signature_request.declined', () => {
    it('should publish signature failed event with reason declined', async () => {
      const payload = makePayload('signature_request.declined');
      const rawBody = Buffer.from(JSON.stringify(payload));
      const signature = hmacSign(rawBody, WEBHOOK_SECRET);
      const req = { rawBody } as unknown as import('express').Request & { rawBody: Buffer };

      await controller.handleWebhook(signature, req as never);

      expect(mockNats.publish).toHaveBeenCalledTimes(1);

      const [subject, data] = mockNats.publish.mock.calls[0] as [string, Record<string, unknown>];
      expect(subject).toBe('crm.document.signature.failed');
      expect(data.reason).toBe('declined');
    });
  });

  // -------------------------------------------------------------------------
  // Event handling: unknown event
  // -------------------------------------------------------------------------
  describe('event: unknown', () => {
    it('should return received:true without publishing for unknown events', async () => {
      const payload = makePayload('signer.notified');
      const rawBody = Buffer.from(JSON.stringify(payload));
      const signature = hmacSign(rawBody, WEBHOOK_SECRET);
      const req = { rawBody } as unknown as import('express').Request & { rawBody: Buffer };

      const result = await controller.handleWebhook(signature, req as never);

      expect(result).toEqual({ received: true });
      expect(mockNats.publish).not.toHaveBeenCalled();
    });
  });
});
