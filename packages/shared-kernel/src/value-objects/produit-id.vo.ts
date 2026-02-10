import { UuidValueObject, validateUuid } from './value-object.base.js';

export class ProduitId extends UuidValueObject {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): ProduitId {
    validateUuid(value, 'ProduitId');
    return new ProduitId(value);
  }
}
