import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { EmerchantpayAccountRepositoryPort } from '../../core/port/emerchantpay-account-repository.port';
import type { EmerchantpayAccountEntity as EmerchantpayAccountDomainEntity } from '../../core/domain/emerchantpay-account.entity';
import { EmerchantpayAccountEntity as EmerchantpayAccountOrmEntity } from '../db/entities/emerchantpay-account.entity';
import { EmerchantpayAccountMapper } from '../../applications/mapper/emerchantpay-account.mapper';

@Injectable()
export class TypeOrmEmerchantpayAccountRepository implements EmerchantpayAccountRepositoryPort {
  constructor(
    @InjectRepository(EmerchantpayAccountOrmEntity)
    private readonly repository: Repository<EmerchantpayAccountOrmEntity>,
  ) {}

  async findById(id: string): Promise<EmerchantpayAccountDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? EmerchantpayAccountMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<EmerchantpayAccountDomainEntity[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => EmerchantpayAccountMapper.toDomain(entity));
  }

  async findBySocieteId(societeId: string): Promise<EmerchantpayAccountDomainEntity | null> {
    const entity = await this.repository.findOne({ where: { societeId } });
    return entity ? EmerchantpayAccountMapper.toDomain(entity) : null;
  }

  async findAllActive(): Promise<EmerchantpayAccountDomainEntity[]> {
    const entities = await this.repository.find({ where: { actif: true } });
    return entities.map((entity) => EmerchantpayAccountMapper.toDomain(entity));
  }

  async create(entity: EmerchantpayAccountDomainEntity): Promise<EmerchantpayAccountDomainEntity> {
    const ormEntity = this.repository.create(
      EmerchantpayAccountMapper.toPersistence(entity),
    );
    const saved = await this.repository.save(ormEntity);
    return EmerchantpayAccountMapper.toDomain(saved);
  }

  async update(
    id: string,
    entity: Partial<EmerchantpayAccountDomainEntity>,
  ): Promise<EmerchantpayAccountDomainEntity> {
    await this.repository.update(
      id,
      EmerchantpayAccountMapper.toPersistence(entity as EmerchantpayAccountDomainEntity),
    );
    const updated = await this.repository.findOne({ where: { id } });
    return EmerchantpayAccountMapper.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
