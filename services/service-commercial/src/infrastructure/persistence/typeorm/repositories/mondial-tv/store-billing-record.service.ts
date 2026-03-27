import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { StoreBillingRecordEntity, StoreBillingStatus, StoreSource } from '../../../../../domain/mondial-tv/entities/store-billing-record.entity';
import { IStoreBillingRecordRepository } from '../../../../../domain/mondial-tv/repositories/IStoreBillingRecordRepository';

@Injectable()
export class StoreBillingRecordService implements IStoreBillingRecordRepository {
  private readonly logger = new Logger(StoreBillingRecordService.name);

  constructor(
    @InjectRepository(StoreBillingRecordEntity)
    private readonly repository: Repository<StoreBillingRecordEntity>,
  ) {}

  async findById(id: string): Promise<StoreBillingRecordEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findBySubscription(organisationId: string, subscriptionId: string): Promise<StoreBillingRecordEntity[]> {
    return this.repository.find({
      where: { organisationId, subscriptionId },
      order: { eventDate: 'DESC' },
    });
  }

  async findByStoreTransaction(storeSource: StoreSource, storeTransactionId: string): Promise<StoreBillingRecordEntity | null> {
    return this.repository.findOne({
      where: { storeSource, storeTransactionId },
    });
  }

  async findByStatus(organisationId: string, status: StoreBillingStatus): Promise<StoreBillingRecordEntity[]> {
    return this.repository.find({
      where: { organisationId, status },
      order: { createdAt: 'DESC' },
    });
  }

  async aggregateRevenueByStore(organisationId: string, storeSource: StoreSource): Promise<{ totalAmount: number; count: number }> {
    const result = await this.repository
      .createQueryBuilder('sbr')
      .select('SUM(sbr.amount)', 'totalAmount')
      .addSelect('COUNT(sbr.id)', 'count')
      .where('sbr.organisation_id = :organisationId', { organisationId })
      .andWhere('sbr.store_source = :storeSource', { storeSource })
      .andWhere('sbr.status = :status', { status: StoreBillingStatus.PAID })
      .getRawOne();

    return {
      totalAmount: result?.totalAmount ? parseInt(result.totalAmount, 10) : 0,
      count: result?.count ? parseInt(result.count, 10) : 0,
    };
  }

  async save(entity: StoreBillingRecordEntity): Promise<StoreBillingRecordEntity> {
    try {
      return await this.repository.save(entity);
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation on store_transaction_id
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `Store billing record with transaction_id ${entity.storeTransactionId} already exists`,
        });
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findAll(filters?: {
    organisationId?: string;
    subscriptionId?: string;
    clientId?: string;
    storeSource?: StoreSource;
    status?: StoreBillingStatus;
  }): Promise<StoreBillingRecordEntity[]> {
    const where: FindOptionsWhere<StoreBillingRecordEntity> = {};
    if (filters?.organisationId) where.organisationId = filters.organisationId;
    if (filters?.subscriptionId) where.subscriptionId = filters.subscriptionId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.storeSource) where.storeSource = filters.storeSource;
    if (filters?.status) where.status = filters.status;

    return this.repository.find({
      where,
      order: { eventDate: 'DESC' },
    });
  }
}
