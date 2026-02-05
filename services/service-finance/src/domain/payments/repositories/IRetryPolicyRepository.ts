import { RetryPolicyEntity } from '../entities/retry-policy.entity';

export interface IRetryPolicyRepository {
  findById(id: string): Promise<RetryPolicyEntity | null>;
  findByOrganisation(organisationId: string): Promise<RetryPolicyEntity[]>;
  findDefaultByOrganisation(organisationId: string): Promise<RetryPolicyEntity | null>;
  findActiveByOrganisation(organisationId: string): Promise<RetryPolicyEntity[]>;
  save(entity: RetryPolicyEntity): Promise<RetryPolicyEntity>;
  delete(id: string): Promise<void>;
}
