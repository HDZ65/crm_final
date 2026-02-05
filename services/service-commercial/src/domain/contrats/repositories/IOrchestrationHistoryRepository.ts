import { OrchestrationHistoryEntity } from '../entities/orchestration-history.entity';

export interface IOrchestrationHistoryRepository {
  findById(id: string): Promise<OrchestrationHistoryEntity | null>;
  findByContract(contractId: string): Promise<OrchestrationHistoryEntity[]>;
  save(entity: OrchestrationHistoryEntity): Promise<OrchestrationHistoryEntity>;
  delete(id: string): Promise<void>;
}
