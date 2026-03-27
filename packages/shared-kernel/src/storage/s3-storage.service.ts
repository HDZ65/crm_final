import type { Readable } from 'node:stream';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { IStorageService } from './storage.interface.js';

export interface S3StorageConfig {
  /** S3-compatible endpoint URL (e.g. http://localhost:9000 for MinIO). Optional for real AWS. */
  endpoint?: string;
  /** AWS region. Defaults to 'eu-west-1'. */
  region?: string;
  /** S3 bucket name. Required. */
  bucket: string;
  /** AWS access key ID. Required. */
  accessKeyId: string;
  /** AWS secret access key. Required. */
  secretAccessKey: string;
}

/**
 * Read S3 storage configuration from environment variables.
 * Throws if required variables are missing.
 */
export function s3ConfigFromEnv(): S3StorageConfig {
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket) {
    throw new Error('S3_BUCKET environment variable is required');
  }
  if (!accessKeyId) {
    throw new Error('S3_ACCESS_KEY_ID environment variable is required');
  }
  if (!secretAccessKey) {
    throw new Error('S3_SECRET_ACCESS_KEY environment variable is required');
  }

  return {
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION || 'eu-west-1',
    bucket,
    accessKeyId,
    secretAccessKey,
  };
}

/**
 * S3-compatible storage service implementing IStorageService.
 * Works with AWS S3 and S3-compatible services (MinIO, LocalStack).
 *
 * This is a plain class — not a NestJS injectable.
 * NestJS services can wrap or extend this class and register it with DI.
 */
export class S3StorageService implements IStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;

    const isCustomEndpoint = !!config.endpoint;

    this.client = new S3Client({
      region: config.region ?? 'eu-west-1',
      ...(config.endpoint ? { endpoint: config.endpoint } : {}),
      forcePathStyle: isCustomEndpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Create an S3StorageService from environment variables.
   */
  static fromEnv(): S3StorageService {
    return new S3StorageService(s3ConfigFromEnv());
  }

  async upload(key: string, buffer: Buffer, contentType: string, metadata?: Record<string, string>): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ...(metadata ? { Metadata: metadata } : {}),
    });

    await this.client.send(command);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`Empty response body for key: ${key}`);
    }

    return this.streamToBuffer(response.Body as Readable);
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Uint8Array[] = [];

    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }

    return Buffer.concat(chunks);
  }
}
