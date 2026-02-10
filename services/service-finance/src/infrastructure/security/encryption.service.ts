import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 12;
  private readonly authTagLength = 16;
  private readonly key: Buffer;

  constructor() {
    const keyStr = process.env.ENCRYPTION_KEY;

    if (!keyStr) {
      this.key = crypto.randomBytes(32);
      this.logger.warn(
        'ENCRYPTION_KEY not set, using random key (data will be lost on restart)',
      );
      return;
    }

    this.key = this.parseKey(keyStr);
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, ciphertext, authTag]).toString('base64');
  }

  decrypt(encrypted: string): string {
    if (!this.isEncrypted(encrypted)) {
      throw new Error('Invalid encrypted payload format');
    }

    const payload = Buffer.from(encrypted, 'base64');
    const iv = payload.subarray(0, this.ivLength);
    const authTag = payload.subarray(payload.length - this.authTagLength);
    const ciphertext = payload.subarray(this.ivLength, payload.length - this.authTagLength);

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
  }

  isEncrypted(value: string): boolean {
    if (!value || value.length % 4 !== 0) {
      return false;
    }

    if (!/^[A-Za-z0-9+/=]+$/.test(value)) {
      return false;
    }

    const payload = Buffer.from(value, 'base64');
    return payload.length > this.ivLength + this.authTagLength;
  }

  private parseKey(rawKey: string): Buffer {
    const trimmedKey = rawKey.trim();

    if (/^[0-9a-fA-F]{64}$/.test(trimmedKey)) {
      return Buffer.from(trimmedKey, 'hex');
    }

    const decodedBase64 = Buffer.from(trimmedKey, 'base64');
    if (decodedBase64.length === 32) {
      return decodedBase64;
    }

    throw new Error('ENCRYPTION_KEY must be 64-char hex or 32-byte base64');
  }
}
