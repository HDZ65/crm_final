import { ValueTransformer } from 'typeorm';
import { EncryptionService } from './encryption.service';

export class EncryptedColumnTransformer implements ValueTransformer {
  constructor(private readonly encryptionService: EncryptionService) {}

  to(value: string | null): string | null {
    if (!value) {
      return null;
    }

    if (this.encryptionService.isEncrypted(value)) {
      return value;
    }

    return this.encryptionService.encrypt(value);
  }

  from(value: string | null): string | null {
    if (!value) {
      return null;
    }

    try {
      return this.encryptionService.decrypt(value);
    } catch {
      return value;
    }
  }
}
