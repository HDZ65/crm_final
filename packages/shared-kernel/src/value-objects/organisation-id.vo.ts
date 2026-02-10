import { UuidValueObject, validateUuid } from './value-object.base.js';

export class OrganisationId extends UuidValueObject {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): OrganisationId {
    validateUuid(value, 'OrganisationId');
    return new OrganisationId(value);
  }
}
