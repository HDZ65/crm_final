/**
 * Barrel Export pour tous les providers
 * Ce fichier permet d'importer tous les providers depuis un seul endroit
 */

import { AUTH_PROVIDERS } from './auth.providers';
import { CLIENT_PROVIDERS } from './client.providers';
import { CONTRACT_PROVIDERS } from './contract.providers';
import { LOGISTICS_PROVIDERS } from './logistics.providers';
import { EMAIL_PROVIDERS } from './email.providers';
import { AI_PROVIDERS } from './ai.providers';
import { PRODUCT_PROVIDERS } from './product.providers';

// Re-export individuels
export { AUTH_PROVIDERS } from './auth.providers';
export { CLIENT_PROVIDERS } from './client.providers';
export { CONTRACT_PROVIDERS } from './contract.providers';
export { LOGISTICS_PROVIDERS } from './logistics.providers';
export { EMAIL_PROVIDERS } from './email.providers';
export { AI_PROVIDERS } from './ai.providers';
export { PRODUCT_PROVIDERS } from './product.providers';

// Export groupé pour faciliter l'utilisation
export const ALL_PROVIDERS = [
  ...AUTH_PROVIDERS,
  ...CLIENT_PROVIDERS,
  ...CONTRACT_PROVIDERS,
  ...LOGISTICS_PROVIDERS,
  ...EMAIL_PROVIDERS,
  ...AI_PROVIDERS,
  ...PRODUCT_PROVIDERS,
];
