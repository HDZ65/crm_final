import { UuidValueObject, validateUuid } from './value-object.base.js';

export class ContratId extends UuidValueObject {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): ContratId {
    validateUuid(value, 'ContratId');
    return new ContratId(value);
  }
}
