import { UuidValueObject, validateUuid } from './value-object.base.js';

export class ExpeditionId extends UuidValueObject {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): ExpeditionId {
    validateUuid(value, 'ExpeditionId');
    return new ExpeditionId(value);
  }
}
