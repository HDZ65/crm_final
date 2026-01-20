import { ContractOrchestrationHistoryEntity } from '../domain/contract-orchestration-history.entity';
import { BaseRepositoryPort } from './repository.port';

export interface ContractOrchestrationHistoryRepositoryPort extends BaseRepositoryPort<ContractOrchestrationHistoryEntity> {
  findByContractId(
    contractId: string,
  ): Promise<ContractOrchestrationHistoryEntity[]>;
}
