import { UuidValueObject, validateUuid } from './value-object.base.js';

export class CommercialId extends UuidValueObject {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): CommercialId {
    validateUuid(value, 'CommercialId');
    return new CommercialId(value);
  }
}
