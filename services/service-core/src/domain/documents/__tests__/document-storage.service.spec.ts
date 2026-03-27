import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createHash } from 'node:crypto';
import {
  DocumentStorageService,
  type DocumentUploadMetadata,
} from '../../../infrastructure/storage/document-storage.service';

// ---------------------------------------------------------------------------
// Mock S3StorageService (plain object — no module mocking needed)
// ---------------------------------------------------------------------------

function createMockS3() {
  return {
    upload: mock(() => Promise.resolve('mocked-key')),
    download: mock(() => Promise.resolve(Buffer.from('file-content'))),
    getPresignedUrl: mock(() => Promise.resolve('https://bucket.s3.amazonaws.com/signed?token=abc')),
    delete: mock(() => Promise.resolve()),
    exists: mock(() => Promise.resolve(true)),
  };
}

type MockS3 = ReturnType<typeof createMockS3>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEST_FILE = Buffer.from('hello-world-document-content');
const TEST_METADATA: DocumentUploadMetadata = {
  keycloakGroupId: 'org-42',
  typeDocument: 'facture',
  filename: 'invoice 2026.pdf',
  contentType: 'application/pdf',
};

describe('DocumentStorageService', () => {
  let mockS3: MockS3;
  let service: DocumentStorageService;

  beforeEach(() => {
    mockS3 = createMockS3();
    // DocumentStorageService constructor accepts S3StorageService | null.
    // Our mock structurally satisfies the methods actually called.
    service = new DocumentStorageService(mockS3 as unknown as import('@crm/shared-kernel').S3StorageService);
  });

  // -------------------------------------------------------------------------
  // uploadDocument
  // -------------------------------------------------------------------------
  describe('uploadDocument', () => {
    it('should calculate SHA-256 hash of the uploaded file', async () => {
      const expectedHash = createHash('sha256').update(TEST_FILE).digest('hex');

      const result = await service.uploadDocument(TEST_FILE, TEST_METADATA);

      expect(result).not.toBeNull();
      expect(result?.hash).toBe(expectedHash);
    });

    it('should generate key matching pattern {orgId}/documents/{type}/{year}/{uuid}-{filename}', async () => {
      const result = await service.uploadDocument(TEST_FILE, TEST_METADATA);

      expect(result).not.toBeNull();
      const key = result?.key;
      // Pattern: org-42/documents/facture/YYYY/uuid-invoice_2026.pdf
      expect(key).toMatch(/^org-42\/documents\/facture\/\d{4}\/[a-f0-9-]+-invoice_2026\.pdf$/);
    });

    it('should sanitise unsafe characters in filename', async () => {
      const meta: DocumentUploadMetadata = {
        ...TEST_METADATA,
        filename: 'file name (copy).pdf',
      };

      const result = await service.uploadDocument(TEST_FILE, meta);

      expect(result).not.toBeNull();
      // Spaces and parens should be replaced with underscores
      expect(result?.key).toContain('file_name__copy_.pdf');
    });

    it('should call S3 upload with the correct metadata', async () => {
      await service.uploadDocument(TEST_FILE, TEST_METADATA);

      expect(mockS3.upload).toHaveBeenCalledTimes(1);
      const args = (mockS3.upload as ReturnType<typeof mock>).mock.calls[0];
      // args: [key, buffer, contentType, metadata]
      expect(args[2]).toBe('application/pdf');
      const s3Meta = args[3] as Record<string, string>;
      expect(s3Meta['organisation-id']).toBe('org-42');
      expect(s3Meta['type-document']).toBe('facture');
      expect(s3Meta.sha256).toBeDefined();
    });

    it('should return url, key, and hash', async () => {
      const result = await service.uploadDocument(TEST_FILE, TEST_METADATA);

      expect(result).not.toBeNull();
      expect(typeof result?.url).toBe('string');
      expect(typeof result?.key).toBe('string');
      expect(typeof result?.hash).toBe('string');
      expect(result?.hash).toHaveLength(64); // SHA-256 hex = 64 chars
    });

    it('should merge extra metadata when provided', async () => {
      const meta: DocumentUploadMetadata = {
        ...TEST_METADATA,
        extra: { 'contrat-id': 'ctr-99' },
      };

      await service.uploadDocument(TEST_FILE, meta);

      const args = (mockS3.upload as ReturnType<typeof mock>).mock.calls[0];
      const s3Meta = args[3] as Record<string, string>;
      expect(s3Meta['contrat-id']).toBe('ctr-99');
    });
  });

  // -------------------------------------------------------------------------
  // downloadDocument
  // -------------------------------------------------------------------------
  describe('downloadDocument', () => {
    it('should delegate to S3 and return a Buffer', async () => {
      const result = await service.downloadDocument('org/documents/facture/2026/uuid-file.pdf');

      expect(result).toBeInstanceOf(Buffer);
      expect(mockS3.download).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // getDocumentUrl
  // -------------------------------------------------------------------------
  describe('getDocumentUrl', () => {
    it('should delegate to S3 getPresignedUrl', async () => {
      const result = await service.getDocumentUrl('some-key');

      expect(typeof result).toBe('string');
      expect(mockS3.getPresignedUrl).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // deleteDocument
  // -------------------------------------------------------------------------
  describe('deleteDocument', () => {
    it('should delegate to S3 delete', async () => {
      await service.deleteDocument('some-key');

      expect(mockS3.delete).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Graceful degradation when S3 is not configured
  // -------------------------------------------------------------------------
  describe('graceful degradation (S3 = null)', () => {
    let nullService: DocumentStorageService;

    beforeEach(() => {
      nullService = new DocumentStorageService(null);
    });

    it('uploadDocument should return null', async () => {
      const result = await nullService.uploadDocument(TEST_FILE, TEST_METADATA);
      expect(result).toBeNull();
    });

    it('downloadDocument should return null', async () => {
      const result = await nullService.downloadDocument('any-key');
      expect(result).toBeNull();
    });

    it('getDocumentUrl should return null', async () => {
      const result = await nullService.getDocumentUrl('any-key');
      expect(result).toBeNull();
    });

    it('deleteDocument should not throw', async () => {
      await expect(nullService.deleteDocument('any-key')).resolves.toBeUndefined();
    });
  });
});
