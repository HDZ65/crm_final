import { UuidValueObject, validateUuid } from './value-object.base.js';

export class ClientId extends UuidValueObject {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): ClientId {
    validateUuid(value, 'ClientId');
    return new ClientId(value);
  }
}
