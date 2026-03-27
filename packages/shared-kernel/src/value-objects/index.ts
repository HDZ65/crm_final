// Base classes and utilities

export { Address } from './address.vo.js';

// CRM Value Objects
export { ClientId } from './client-id.vo.js';
export { CommercialId } from './commercial-id.vo.js';
export { CommissionId } from './commission-id.vo.js';
export { ContratId } from './contrat-id.vo.js';
export { Email } from './email.vo.js';
export { ExpeditionId } from './expedition-id.vo.js';
export { FactureId } from './facture-id.vo.js';
export { Montant } from './montant.vo.js';
export { OrganisationId } from './organisation-id.vo.js';
export { Phone } from './phone.vo.js';
export { ProduitId } from './produit-id.vo.js';
export { TauxCommission } from './taux-commission.vo.js';
export { TauxTva } from './taux-tva.vo.js';
export { UtilisateurId } from './utilisateur-id.vo.js';
export {
  type NormalizedStringOptions,
  normalizeStringValue,
  StringValueObject,
  UuidValueObject,
  ValueObject,
  validateUuid,
} from './value-object.base.js';
