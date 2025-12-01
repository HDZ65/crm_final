import { ContractOrchestrationHistoryEntity } from '../../core/domain/contract-orchestration-history.entity';
import { ContractOrchestrationHistoryEntity as ContractOrchestrationHistoryOrmEntity } from '../../infrastructure/db/entities/contract-orchestration-history.entity';

export class ContractOrchestrationHistoryMapper {
  static toDomain(
    ormEntity: ContractOrchestrationHistoryOrmEntity,
  ): ContractOrchestrationHistoryEntity {
    return new ContractOrchestrationHistoryEntity({
      id: ormEntity.id,
      contractId: ormEntity.contractId,
      operation: ormEntity.operation,
      status: ormEntity.status,
      payload: ormEntity.payload,
      responsePayload: ormEntity.responsePayload,
      errorMessage: ormEntity.errorMessage,
      startedAt: ormEntity.startedAt,
      finishedAt: ormEntity.finishedAt,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    entity: ContractOrchestrationHistoryEntity,
  ): Partial<ContractOrchestrationHistoryOrmEntity> {
    return {
      id: entity.id,
      contractId: entity.contractId,
      operation: entity.operation,
      status: entity.status,
      payload: entity.payload ?? null,
      responsePayload: entity.responsePayload ?? null,
      errorMessage: entity.errorMessage ?? null,
      startedAt: entity.startedAt,
      finishedAt: entity.finishedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
