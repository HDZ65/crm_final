import { createHash, randomUUID } from 'node:crypto';
import type { S3StorageService } from '@crm/shared-kernel';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Metadata required for document upload.
 */
export interface DocumentUploadMetadata {
  keycloakGroupId: string;
  typeDocument: string;
  filename: string;
  contentType: string;
  /** Optional extra metadata to store alongside the file. */
  extra?: Record<string, string>;
}

/**
 * Result returned after a successful upload.
 */
export interface DocumentUploadResult {
  url: string;
  key: string;
  hash: string;
}

/**
 * High-level document storage service for the GED (Gestion Electronique de Documents).
 *
 * Wraps the shared-kernel S3StorageService with:
 * - Standardised key generation: {keycloakGroupId}/documents/{typeDocument}/{year}/{uuid}-{filename}
 * - Automatic SHA-256 hash calculation on upload
 * - Graceful degradation when S3 is not configured
 */
@Injectable()
export class DocumentStorageService {
  private readonly logger = new Logger(DocumentStorageService.name);
  private readonly storageService: S3StorageService | null;

  constructor(storageService: S3StorageService | null) {
    this.storageService = storageService;

    if (!this.storageService) {
      this.logger.warn('S3 storage is not configured. Document storage operations will return null/empty values.');
    }
  }

  /**
   * Upload a document to S3 with automatic key generation and SHA-256 hashing.
   *
   * Key pattern: {keycloakGroupId}/documents/{typeDocument}/{year}/{uuid}-{filename}
   */
  async uploadDocument(file: Buffer, metadata: DocumentUploadMetadata): Promise<DocumentUploadResult | null> {
    if (!this.storageService) {
      return null;
    }

    const hash = createHash('sha256').update(file).digest('hex');
    const key = this.buildKey(metadata);

    const s3Metadata: Record<string, string> = {
      'organisation-id': metadata.keycloakGroupId,
      'type-document': metadata.typeDocument,
      sha256: hash,
      ...(metadata.extra ?? {}),
    };

    await this.storageService.upload(key, file, metadata.contentType, s3Metadata);

    const url = await this.storageService.getPresignedUrl(key, 3600);

    return { url, key, hash };
  }

  /**
   * Download a document from S3 by its storage key.
   */
  async downloadDocument(key: string): Promise<Buffer | null> {
    if (!this.storageService) {
      return null;
    }

    return this.storageService.download(key);
  }

  /**
   * Get a pre-signed URL for temporary access to a document.
   *
   * @param key - The storage key of the document
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   */
  async getDocumentUrl(key: string, expiresIn?: number): Promise<string | null> {
    if (!this.storageService) {
      return null;
    }

    return this.storageService.getPresignedUrl(key, expiresIn ?? 3600);
  }

  /**
   * Delete a document from S3 by its storage key.
   */
  async deleteDocument(key: string): Promise<void> {
    if (!this.storageService) {
      return;
    }

    await this.storageService.delete(key);
  }

  /**
   * Build the S3 key following the convention:
   * {keycloakGroupId}/documents/{typeDocument}/{year}/{uuid}-{filename}
   */
  private buildKey(metadata: DocumentUploadMetadata): string {
    const year = new Date().getFullYear();
    const uuid = randomUUID();
    const safeFilename = metadata.filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    return `${metadata.keycloakGroupId}/documents/${metadata.typeDocument}/${year}/${uuid}-${safeFilename}`;
  }
}
