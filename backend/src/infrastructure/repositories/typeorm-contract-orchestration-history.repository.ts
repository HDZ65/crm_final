import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import type { ContractOrchestrationHistoryRepositoryPort } from '../../core/port/contract-orchestration-history-repository.port';
import type { ContractOrchestrationHistoryEntity as ContractOrchestrationHistoryDomain } from '../../core/domain/contract-orchestration-history.entity';
import { ContractOrchestrationHistoryEntity as ContractOrchestrationHistoryOrm } from '../db/entities/contract-orchestration-history.entity';
import { ContractOrchestrationHistoryMapper } from '../../applications/mapper/contract-orchestration-history.mapper';

@Injectable()
export class TypeOrmContractOrchestrationHistoryRepository
  implements ContractOrchestrationHistoryRepositoryPort
{
  constructor(
    @InjectRepository(ContractOrchestrationHistoryOrm)
    private readonly repository: Repository<ContractOrchestrationHistoryOrm>,
  ) {}

  async findById(
    id: string,
  ): Promise<ContractOrchestrationHistoryDomain | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ContractOrchestrationHistoryMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<ContractOrchestrationHistoryDomain[]> {
    const entities = await this.repository.find();
    return entities.map((entity) =>
      ContractOrchestrationHistoryMapper.toDomain(entity),
    );
  }

  async findByContractId(
    contractId: string,
  ): Promise<ContractOrchestrationHistoryDomain[]> {
    const entities = await this.repository.find({
      where: { contractId },
      order: { startedAt: 'DESC' },
    });
    return entities.map((entity) =>
      ContractOrchestrationHistoryMapper.toDomain(entity),
    );
  }

  async create(
    entity: ContractOrchestrationHistoryDomain,
  ): Promise<ContractOrchestrationHistoryDomain> {
    const ormEntity = this.repository.create(
      ContractOrchestrationHistoryMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return ContractOrchestrationHistoryMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<ContractOrchestrationHistoryDomain>,
  ): Promise<ContractOrchestrationHistoryDomain> {
    const partial = ContractOrchestrationHistoryMapper.toPersistence(
      entity as ContractOrchestrationHistoryDomain,
    ) as QueryDeepPartialEntity<ContractOrchestrationHistoryOrm>;

    await this.repository.update(id, partial);
    const updated = await this.repository.findOne({ where: { id } });
    return ContractOrchestrationHistoryMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
