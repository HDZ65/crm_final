/**
 * Storage service abstraction for file storage operations.
 * Implementations can target S3, MinIO, local filesystem, etc.
 */
export interface IStorageService {
  /**
   * Upload a file to storage.
   * @param key - The storage key (path) for the file
   * @param buffer - The file content as a Buffer
   * @param contentType - MIME type of the file
   * @param metadata - Optional metadata key-value pairs
   * @returns The storage key of the uploaded file
   */
  upload(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<string>;

  /**
   * Download a file from storage.
   * @param key - The storage key of the file to download
   * @returns The file content as a Buffer
   */
  download(key: string): Promise<Buffer>;

  /**
   * Generate a pre-signed URL for temporary access to a file.
   * @param key - The storage key of the file
   * @param expiresIn - URL expiration time in seconds (default: 3600)
   * @returns A pre-signed URL string
   */
  getPresignedUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Delete a file from storage.
   * @param key - The storage key of the file to delete
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists in storage.
   * @param key - The storage key to check
   * @returns true if the file exists, false otherwise (never throws)
   */
  exists(key: string): Promise<boolean>;
}

/**
 * Injection token for IStorageService implementations.
 */
export const STORAGE_SERVICE = Symbol('IStorageService');
