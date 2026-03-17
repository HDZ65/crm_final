import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  CreateSignatureRequestPayload,
  UploadDocumentPayload,
  YousignDocument,
  YousignSignatureRequest,
} from './yousign.types';

const YOUSIGN_SANDBOX_URL = 'https://api-sandbox.yousign.app/v3';

@Injectable()
export class YousignApiClient {
  private readonly logger = new Logger(YousignApiClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'YOUSIGN_BASE_URL',
      YOUSIGN_SANDBOX_URL,
    );
    const key = this.configService.get<string>('YOUSIGN_API_KEY');
    if (!key) {
      this.logger.warn('YOUSIGN_API_KEY is not set — Yousign calls will fail');
    }
    this.apiKey = key ?? '';
  }

  // --------------------------------------------------------------------------
  // Public API Methods
  // --------------------------------------------------------------------------

  /** POST /signature_requests — Create a new signature request (draft) */
  async createSignatureRequest(
    payload: CreateSignatureRequestPayload,
  ): Promise<YousignSignatureRequest> {
    return this.request<YousignSignatureRequest>(
      'POST',
      '/signature_requests',
      { body: JSON.stringify(payload), contentType: 'application/json' },
    );
  }

  /** POST /signature_requests/{id}/documents — Upload document (multipart) */
  async uploadDocument(
    signatureRequestId: string,
    payload: UploadDocumentPayload,
  ): Promise<YousignDocument> {
    const formData = new FormData();
    const arrayBuffer = payload.file.buffer.slice(
      payload.file.byteOffset,
      payload.file.byteOffset + payload.file.byteLength,
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
    formData.append('file', blob, payload.filename);
    formData.append('nature', payload.nature ?? 'signable_document');

    return this.request<YousignDocument>(
      'POST',
      `/signature_requests/${signatureRequestId}/documents`,
      { formData },
    );
  }

  /** POST /signature_requests/{id}/activate — Activate (send to signers) */
  async activateSignatureRequest(
    signatureRequestId: string,
  ): Promise<YousignSignatureRequest> {
    return this.request<YousignSignatureRequest>(
      'POST',
      `/signature_requests/${signatureRequestId}/activate`,
    );
  }

  /** GET /signature_requests/{id} — Get signature request status */
  async getSignatureRequest(
    signatureRequestId: string,
  ): Promise<YousignSignatureRequest> {
    return this.request<YousignSignatureRequest>(
      'GET',
      `/signature_requests/${signatureRequestId}`,
    );
  }

  /** GET /signature_requests/{id}/documents/{docId}/download — Download signed PDF */
  async downloadSignedDocument(
    signatureRequestId: string,
    documentId: string,
  ): Promise<Buffer> {
    const url = `${this.baseUrl}/signature_requests/${signatureRequestId}/documents/${documentId}/download`;

    const response = await this.fetchWithErrorHandling(url, {
      method: 'GET',
      headers: this.authHeaders(),
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /** DELETE /signature_requests/{id} — Cancel a signature request */
  async cancelSignatureRequest(
    signatureRequestId: string,
  ): Promise<void> {
    const url = `${this.baseUrl}/signature_requests/${signatureRequestId}`;

    await this.fetchWithErrorHandling(url, {
      method: 'DELETE',
      headers: this.authHeaders(),
    });
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: string;
      contentType?: string;
      formData?: FormData;
    },
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = this.authHeaders();

    let fetchBody: string | FormData | undefined;

    if (options?.formData) {
      // Let fetch set Content-Type with boundary for multipart
      fetchBody = options.formData;
    } else if (options?.body) {
      headers['Content-Type'] = options.contentType ?? 'application/json';
      fetchBody = options.body;
    }

    const response = await this.fetchWithErrorHandling(url, {
      method,
      headers,
      body: fetchBody,
    });

    return response.json() as Promise<T>;
  }

  private async fetchWithErrorHandling(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    let response: Response;

    try {
      response = await fetch(url, init);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Network error';
      this.logger.error(`Yousign API network error: ${message}`);
      throw new HttpException(
        `Yousign API unreachable: ${message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!response.ok) {
      let errorBody: string;
      try {
        errorBody = await response.text();
      } catch {
        errorBody = 'Unable to read error body';
      }

      this.logger.error(
        `Yousign API error: ${response.status} ${response.statusText} — ${errorBody}`,
      );

      const status =
        response.status >= 400 && response.status < 500
          ? response.status
          : HttpStatus.BAD_GATEWAY;

      throw new HttpException(
        {
          message: `Yousign API error: ${response.statusText}`,
          statusCode: status,
          yousignStatus: response.status,
          detail: errorBody,
        },
        status,
      );
    }

    return response;
  }
}
