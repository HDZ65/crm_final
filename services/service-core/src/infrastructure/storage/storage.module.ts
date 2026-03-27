import { S3StorageService, s3ConfigFromEnv } from '@crm/shared-kernel';
import { Logger, Module } from '@nestjs/common';
import { DocumentStorageService } from './document-storage.service';

const S3_STORAGE_PROVIDER = {
  provide: S3StorageService,
  useFactory: (): S3StorageService | null => {
    const logger = new Logger('StorageModule');

    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      logger.warn('S3_BUCKET env var is not set. S3 storage will be disabled (graceful degradation).');
      return null;
    }

    try {
      const config = s3ConfigFromEnv();
      return new S3StorageService(config);
    } catch (error) {
      logger.error(`Failed to initialise S3StorageService: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  },
};

const DOCUMENT_STORAGE_PROVIDER = {
  provide: DocumentStorageService,
  useFactory: (s3: S3StorageService | null): DocumentStorageService => {
    return new DocumentStorageService(s3);
  },
  inject: [S3StorageService],
};

/**
 * NestJS module providing document storage services backed by S3.
 *
 * Gracefully degrades when S3 environment variables are not configured:
 * DocumentStorageService methods will return null instead of throwing.
 */
@Module({
  providers: [S3_STORAGE_PROVIDER, DOCUMENT_STORAGE_PROVIDER],
  exports: [DocumentStorageService],
})
export class StorageModule {}
