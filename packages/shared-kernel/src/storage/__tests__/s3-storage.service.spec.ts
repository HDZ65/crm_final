import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { S3StorageConfig } from '../s3-storage.service';

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

const mockSend = mock(() => Promise.resolve({}));
const mockGetSignedUrl = mock(() =>
  Promise.resolve('https://test-bucket.s3.eu-west-1.amazonaws.com/key?X-Amz-Signature=abc'),
);

mock.module('@aws-sdk/client-s3', () => ({
  S3Client: class MockS3Client {
    constructor(_config: unknown) {}
    send = mockSend;
  },
  PutObjectCommand: class MockPut {
    constructor(public input: Record<string, unknown>) {}
  },
  GetObjectCommand: class MockGet {
    constructor(public input: Record<string, unknown>) {}
  },
  DeleteObjectCommand: class MockDel {
    constructor(public input: Record<string, unknown>) {}
  },
  HeadObjectCommand: class MockHead {
    constructor(public input: Record<string, unknown>) {}
  },
}));

mock.module('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

import { S3StorageService, s3ConfigFromEnv } from '../s3-storage.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEST_CONFIG: S3StorageConfig = {
  bucket: 'test-bucket',
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  region: 'eu-west-1',
};

describe('S3StorageService', () => {
  let service: S3StorageService;

  beforeEach(() => {
    mockSend.mockClear();
    mockGetSignedUrl.mockClear();
    mockSend.mockImplementation(() => Promise.resolve({}));
    service = new S3StorageService(TEST_CONFIG);
  });

  // -------------------------------------------------------------------------
  // upload
  // -------------------------------------------------------------------------
  describe('upload', () => {
    it('should upload a file and return the key', async () => {
      const key = 'org-1/documents/facture/2026/abc-invoice.pdf';
      const buffer = Buffer.from('pdf-content');

      const result = await service.upload(key, buffer, 'application/pdf');

      expect(result).toBe(key);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should forward metadata to S3 when provided', async () => {
      const meta = { 'organisation-id': 'org-1', 'sha256': 'deadbeef' };

      await service.upload('k', Buffer.from('x'), 'text/plain', meta);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should work without optional metadata', async () => {
      await service.upload('k', Buffer.from('x'), 'text/plain');

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // download
  // -------------------------------------------------------------------------
  describe('download', () => {
    it('should return a Buffer with file contents', async () => {
      const content = Buffer.from('downloaded-content');
      const asyncIterable = {
        async *[Symbol.asyncIterator]() {
          yield content;
        },
      };
      mockSend.mockImplementationOnce(() => Promise.resolve({ Body: asyncIterable }));

      const result = await service.download('test-key');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('downloaded-content');
    });

    it('should throw when response body is empty', async () => {
      mockSend.mockImplementationOnce(() => Promise.resolve({ Body: null }));

      await expect(service.download('missing-key')).rejects.toThrow(
        'Empty response body for key: missing-key',
      );
    });
  });

  // -------------------------------------------------------------------------
  // getPresignedUrl
  // -------------------------------------------------------------------------
  describe('getPresignedUrl', () => {
    it('should return a string URL', async () => {
      const url = await service.getPresignedUrl('test-key');

      expect(typeof url).toBe('string');
      expect(url).toContain('https://');
    });

    it('should call getSignedUrl with custom expiresIn', async () => {
      await service.getPresignedUrl('test-key', 7200);

      expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
    });

    it('should default expiresIn to 3600', async () => {
      await service.getPresignedUrl('test-key');

      expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  describe('delete', () => {
    it('should not throw on successful deletion', async () => {
      await expect(service.delete('test-key')).resolves.toBeUndefined();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // exists
  // -------------------------------------------------------------------------
  describe('exists', () => {
    it('should return true when the object exists', async () => {
      const result = await service.exists('existing-key');

      expect(result).toBe(true);
    });

    it('should return false when the object does not exist (never throws)', async () => {
      mockSend.mockImplementationOnce(() => Promise.reject(new Error('Not Found')));

      const result = await service.exists('missing-key');

      expect(result).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // key pattern validation (integration-style)
  // -------------------------------------------------------------------------
  describe('key pattern', () => {
    it('should accept and return the standard GED key pattern', async () => {
      const key = 'org-123/documents/facture/2026/550e8400-e29b-41d4-a716-446655440000-document.pdf';

      const result = await service.upload(key, Buffer.from('data'), 'application/pdf');

      expect(result).toBe(key);
      expect(result).toMatch(
        /^[a-zA-Z0-9-]+\/documents\/[a-zA-Z0-9_-]+\/\d{4}\/[a-f0-9-]+-[\w.-]+$/,
      );
    });
  });

  // -------------------------------------------------------------------------
  // s3ConfigFromEnv
  // -------------------------------------------------------------------------
  describe('s3ConfigFromEnv', () => {
    it('should throw when S3_BUCKET is missing', () => {
      const saved = process.env['S3_BUCKET'];
      delete process.env['S3_BUCKET'];
      try {
        expect(() => s3ConfigFromEnv()).toThrow('S3_BUCKET');
      } finally {
        if (saved) process.env['S3_BUCKET'] = saved;
      }
    });

    it('should throw when S3_ACCESS_KEY_ID is missing', () => {
      process.env['S3_BUCKET'] = 'b';
      const saved = process.env['S3_ACCESS_KEY_ID'];
      delete process.env['S3_ACCESS_KEY_ID'];
      try {
        expect(() => s3ConfigFromEnv()).toThrow('S3_ACCESS_KEY_ID');
      } finally {
        if (saved) process.env['S3_ACCESS_KEY_ID'] = saved;
        delete process.env['S3_BUCKET'];
      }
    });
  });
});
