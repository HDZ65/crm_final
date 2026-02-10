import { UuidValueObject, validateUuid } from './value-object.base.js';

export class FactureId extends UuidValueObject {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): FactureId {
    validateUuid(value, 'FactureId');
    return new FactureId(value);
  }
}
