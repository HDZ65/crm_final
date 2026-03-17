import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { HttpException, HttpStatus } from '@nestjs/common';
import { YousignApiClient } from '../yousign-api.client';
import type {
  CreateSignatureRequestPayload,
  UploadDocumentPayload,
  YousignSignatureRequest,
  YousignDocument,
} from '../yousign.types';

// ---------------------------------------------------------------------------
// Mock ConfigService
// ---------------------------------------------------------------------------

function createMockConfigService(overrides: Record<string, string> = {}) {
  const defaults: Record<string, string> = {
    YOUSIGN_BASE_URL: 'https://api-sandbox.yousign.app/v3',
    YOUSIGN_API_KEY: 'test-api-key-12345',
    ...overrides,
  };
  return {
    get: mock((key: string, fallback?: string) => defaults[key] ?? fallback ?? ''),
  };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status === 200 ? 'OK' : `Error ${status}`,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(status: number, body = 'Error'): Response {
  return new Response(body, {
    status,
    statusText: `Error ${status}`,
  });
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SIGNATURE_REQUEST: Partial<YousignSignatureRequest> = {
  id: 'sr-001',
  status: 'draft' as YousignSignatureRequest['status'],
  name: 'Test Signature',
  delivery_mode: 'email',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  signers: [],
  documents: [],
};

const MOCK_DOCUMENT: Partial<YousignDocument> = {
  id: 'doc-001',
  nature: 'signable_document',
  filename: 'contract.pdf',
  content_type: 'application/pdf',
  sha256: 'abc123',
  is_signed: false,
  total_pages: 3,
};

describe('YousignApiClient', () => {
  let client: YousignApiClient;
  let mockFetch: ReturnType<typeof mock>;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockFetch = mock(() => Promise.resolve(jsonResponse(MOCK_SIGNATURE_REQUEST)));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    const configService = createMockConfigService();
    client = new YousignApiClient(configService as unknown as import('@nestjs/config').ConfigService);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // -------------------------------------------------------------------------
  // createSignatureRequest
  // -------------------------------------------------------------------------
  describe('createSignatureRequest', () => {
    it('should POST to /signature_requests and return the response', async () => {
      const payload: CreateSignatureRequestPayload = {
        name: 'Contract Signing',
        delivery_mode: 'email',
        signers: [
          {
            info: {
              first_name: 'Jean',
              last_name: 'Dupont',
              email: 'jean@example.com',
            },
          },
        ],
      };

      const result = await client.createSignatureRequest(payload);

      expect(result.id).toBe('sr-001');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api-sandbox.yousign.app/v3/signature_requests');
      expect(options.method).toBe('POST');
      expect(options.headers).toHaveProperty('Authorization', 'Bearer test-api-key-12345');
    });
  });

  // -------------------------------------------------------------------------
  // uploadDocument
  // -------------------------------------------------------------------------
  describe('uploadDocument', () => {
    it('should POST multipart form data to /signature_requests/{id}/documents', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(jsonResponse(MOCK_DOCUMENT)),
      );

      const payload: UploadDocumentPayload = {
        file: Buffer.from('pdf-binary-content'),
        filename: 'contract.pdf',
        nature: 'signable_document',
      };

      const result = await client.uploadDocument('sr-001', payload);

      expect(result.id).toBe('doc-001');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        'https://api-sandbox.yousign.app/v3/signature_requests/sr-001/documents',
      );
    });
  });

  // -------------------------------------------------------------------------
  // activateSignatureRequest
  // -------------------------------------------------------------------------
  describe('activateSignatureRequest', () => {
    it('should POST to /signature_requests/{id}/activate', async () => {
      const activated = { ...MOCK_SIGNATURE_REQUEST, status: 'ongoing' };
      mockFetch.mockImplementationOnce(() => Promise.resolve(jsonResponse(activated)));

      const result = await client.activateSignatureRequest('sr-001');

      expect(result.id).toBe('sr-001');
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/signature_requests/sr-001/activate');
      expect(options.method).toBe('POST');
    });
  });

  // -------------------------------------------------------------------------
  // getSignatureRequest
  // -------------------------------------------------------------------------
  describe('getSignatureRequest', () => {
    it('should GET /signature_requests/{id}', async () => {
      const result = await client.getSignatureRequest('sr-001');

      expect(result.id).toBe('sr-001');
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/signature_requests/sr-001');
      expect(options.method).toBe('GET');
    });
  });

  // -------------------------------------------------------------------------
  // downloadSignedDocument
  // -------------------------------------------------------------------------
  describe('downloadSignedDocument', () => {
    it('should GET download endpoint and return a Buffer', async () => {
      const pdfContent = Buffer.from('signed-pdf-bytes');
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(
          new Response(pdfContent, {
            status: 200,
            headers: { 'Content-Type': 'application/pdf' },
          }),
        ),
      );

      const result = await client.downloadSignedDocument('sr-001', 'doc-001');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('signed-pdf-bytes');
      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/signature_requests/sr-001/documents/doc-001/download');
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------
  describe('error handling', () => {
    it('should throw HttpException with status 401 on unauthorized', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(errorResponse(401, 'Unauthorized')),
      );

      try {
        await client.getSignatureRequest('sr-001');
        expect(true).toBe(false); // Should not reach here
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        const httpErr = err as HttpException;
        expect(httpErr.getStatus()).toBe(401);
      }
    });

    it('should throw HttpException with status 404 on not found', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(errorResponse(404, 'Not Found')),
      );

      try {
        await client.getSignatureRequest('sr-nonexistent');
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        const httpErr = err as HttpException;
        expect(httpErr.getStatus()).toBe(404);
      }
    });

    it('should throw BAD_GATEWAY on 500 server error', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(errorResponse(500, 'Internal Server Error')),
      );

      try {
        await client.getSignatureRequest('sr-001');
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        const httpErr = err as HttpException;
        expect(httpErr.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
      }
    });

    it('should throw BAD_GATEWAY on network error', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.reject(new Error('ECONNREFUSED')),
      );

      try {
        await client.getSignatureRequest('sr-001');
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        const httpErr = err as HttpException;
        expect(httpErr.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
        const body = httpErr.getResponse() as string;
        expect(body).toContain('ECONNREFUSED');
      }
    });
  });
});
