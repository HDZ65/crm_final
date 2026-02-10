import { UuidValueObject, validateUuid } from './value-object.base.js';

export class UtilisateurId extends UuidValueObject {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): UtilisateurId {
    validateUuid(value, 'UtilisateurId');
    return new UtilisateurId(value);
  }
}
