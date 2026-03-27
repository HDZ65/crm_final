import { ProvisioningLifecycleEntity } from '../entities';

export interface IProvisioningLifecycleRepository {
  findByContratId(contratId: string): Promise<ProvisioningLifecycleEntity | null>;
  findReadyForRetractionDeadline(now: Date, limit?: number): Promise<ProvisioningLifecycleEntity[]>;
  save(entity: ProvisioningLifecycleEntity): Promise<ProvisioningLifecycleEntity>;

  findByOrganisationId(
    orgId: string,
    options: { stateFilter?: string; search?: string; page: number; limit: number },
  ): Promise<{ items: ProvisioningLifecycleEntity[]; total: number }>;

  countByState(orgId: string): Promise<Record<string, number>>;

  findById(id: string): Promise<ProvisioningLifecycleEntity | null>;
}
