import { UuidValueObject, validateUuid } from './value-object.base.js';

export class CommissionId extends UuidValueObject {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): CommissionId {
    validateUuid(value, 'CommissionId');
    return new CommissionId(value);
  }
}
