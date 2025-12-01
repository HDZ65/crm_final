import * as crypto from 'crypto';

/**
 * TypeORM Column Transformer pour chiffrer/déchiffrer automatiquement les colonnes sensibles
 *
 * Utilise AES-256-GCM pour un chiffrement authentifié (confidentialité + intégrité)
 *
 * IMPORTANT: En production, utilisez une clé stockée dans un service de gestion de secrets
 * (AWS KMS, Azure Key Vault, HashiCorp Vault, etc.)
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Récupère la clé de chiffrement depuis les variables d'environnement
 * La clé doit être de 32 bytes (256 bits) encodée en hex ou base64
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    // En développement, utiliser une clé par défaut (NE PAS UTILISER EN PRODUCTION!)
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required in production',
      );
    }
    // Clé de développement - 32 bytes
    return Buffer.from(
      'dev_key_32_bytes_do_not_use_prod',
      'utf-8',
    );
  }

  // Essayer de décoder la clé (hex ou base64)
  try {
    if (key.length === 64) {
      // Hex encoded 32 bytes
      return Buffer.from(key, 'hex');
    } else if (key.length === 44) {
      // Base64 encoded 32 bytes
      return Buffer.from(key, 'base64');
    } else {
      // Utiliser directement si c'est déjà 32 bytes
      const keyBuffer = Buffer.from(key, 'utf-8');
      if (keyBuffer.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be exactly 32 bytes');
      }
      return keyBuffer;
    }
  } catch {
    throw new Error('Invalid ENCRYPTION_KEY format');
  }
}

/**
 * Chiffre une valeur avec AES-256-GCM
 */
function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData (tout en hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Déchiffre une valeur avec AES-256-GCM
 */
function decrypt(encryptedData: string): string {
  if (!encryptedData) return encryptedData;

  // Si la donnée ne semble pas chiffrée (ancien format), la retourner telle quelle
  // Cela permet une migration progressive des données existantes
  if (!encryptedData.includes(':')) {
    return encryptedData;
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    // Format invalide, retourner tel quel (données legacy)
    return encryptedData;
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    // Si le déchiffrement échoue, c'est peut-être une donnée legacy non chiffrée
    // ou une clé différente a été utilisée
    console.warn(
      'Failed to decrypt value, returning as-is (might be legacy unencrypted data)',
    );
    return encryptedData;
  }
}

/**
 * TypeORM Column Transformer pour chiffrer automatiquement les colonnes
 *
 * Usage:
 * @Column({
 *   type: 'varchar',
 *   nullable: true,
 *   transformer: EncryptedColumnTransformer
 * })
 * refreshToken?: string | null;
 */
export const EncryptedColumnTransformer = {
  /**
   * Appelé lors de l'écriture en base (chiffrement)
   */
  to: (value: string | null | undefined): string | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return encrypt(value);
  },

  /**
   * Appelé lors de la lecture depuis la base (déchiffrement)
   */
  from: (value: string | null | undefined): string | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return decrypt(value);
  },
};

/**
 * Utilitaire pour chiffrer manuellement une valeur
 * (utile pour les migrations de données existantes)
 */
export function encryptValue(value: string): string {
  return encrypt(value);
}

/**
 * Utilitaire pour déchiffrer manuellement une valeur
 */
export function decryptValue(value: string): string {
  return decrypt(value);
}
