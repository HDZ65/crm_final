import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { TvodEstPurchaseEntity } from '../../../../domain/mondial-tv/entities/tvod-est-purchase.entity';
import {
  ITvodEstPurchaseRepository,
  AggregateMetrics,
} from '../../../../domain/mondial-tv/repositories/ITvodEstPurchaseRepository';

@Injectable()
export class TvodEstPurchaseService implements ITvodEstPurchaseRepository {
  constructor(
    @InjectRepository(TvodEstPurchaseEntity)
    private readonly repository: Repository<TvodEstPurchaseEntity>,
  ) {}

  async findById(id: string): Promise<TvodEstPurchaseEntity | null> {
    try {
      return await this.repository.findOne({ where: { id } });
    } catch (error) {
      throw new RpcException({
        code: 'INTERNAL',
        message: `Failed to find purchase: ${error.message}`,
      });
    }
  }

  async findByClient(
    organisationId: string,
    clientId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<TvodEstPurchaseEntity[]> {
    try {
      return await this.repository.find({
        where: { organisationId, clientId },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      throw new RpcException({
        code: 'INTERNAL',
        message: `Failed to find purchases by client: ${error.message}`,
      });
    }
  }

  async findByContentId(
    organisationId: string,
    contentId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<TvodEstPurchaseEntity[]> {
    try {
      return await this.repository.find({
        where: { organisationId, contentId },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      throw new RpcException({
        code: 'INTERNAL',
        message: `Failed to find purchases by content: ${error.message}`,
      });
    }
  }

  async findByStatus(
    organisationId: string,
    status: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<TvodEstPurchaseEntity[]> {
    try {
      return await this.repository.find({
        where: { organisationId, status },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      throw new RpcException({
        code: 'INTERNAL',
        message: `Failed to find purchases by status: ${error.message}`,
      });
    }
  }

  async create(purchase: Partial<TvodEstPurchaseEntity>): Promise<TvodEstPurchaseEntity> {
    try {
      const entity = this.repository.create(purchase);
      return await this.repository.save(entity);
    } catch (error) {
      throw new RpcException({
        code: 'INTERNAL',
        message: `Failed to create purchase: ${error.message}`,
      });
    }
  }

  async update(id: string, purchase: Partial<TvodEstPurchaseEntity>): Promise<TvodEstPurchaseEntity> {
    try {
      await this.repository.update(id, purchase);
      const updated = await this.repository.findOne({ where: { id } });
      if (!updated) {
        throw new RpcException({
          code: 'NOT_FOUND',
          message: 'Purchase not found',
        });
      }
      return updated;
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: 'INTERNAL',
        message: `Failed to update purchase: ${error.message}`,
      });
    }
  }

  async calculateAggregates(
    organisationId: string,
    clientId: string,
  ): Promise<AggregateMetrics> {
    try {
      const result = await this.repository
        .createQueryBuilder('p')
        .select('COUNT(p.id)', 'transactionCount')
        .addSelect('SUM(p.amount)', 'totalRevenue')
        .addSelect('AVG(p.amount)', 'averageBasket')
        .where('p.organisationId = :organisationId', { organisationId })
        .andWhere('p.clientId = :clientId', { clientId })
        .andWhere('p.status = :status', { status: 'COMPLETED' })
        .getRawOne();

      return {
        totalVolume: parseInt(result.transactionCount || '0', 10),
        totalRevenue: parseFloat(result.totalRevenue || '0'),
        averageBasket: parseFloat(result.averageBasket || '0'),
        transactionCount: parseInt(result.transactionCount || '0', 10),
      };
    } catch (error) {
      throw new RpcException({
        code: 'INTERNAL',
        message: `Failed to calculate aggregates: ${error.message}`,
      });
    }
  }

  async calculateContentAggregates(
    organisationId: string,
    contentId: string,
  ): Promise<AggregateMetrics> {
    try {
      const result = await this.repository
        .createQueryBuilder('p')
        .select('COUNT(p.id)', 'transactionCount')
        .addSelect('SUM(p.amount)', 'totalRevenue')
        .addSelect('AVG(p.amount)', 'averageBasket')
        .where('p.organisationId = :organisationId', { organisationId })
        .andWhere('p.contentId = :contentId', { contentId })
        .andWhere('p.status = :status', { status: 'COMPLETED' })
        .getRawOne();

      return {
        totalVolume: parseInt(result.transactionCount || '0', 10),
        totalRevenue: parseFloat(result.totalRevenue || '0'),
        averageBasket: parseFloat(result.averageBasket || '0'),
        transactionCount: parseInt(result.transactionCount || '0', 10),
      };
    } catch (error) {
      throw new RpcException({
        code: 'INTERNAL',
        message: `Failed to calculate content aggregates: ${error.message}`,
      });
    }
  }

  async countByClient(organisationId: string, clientId: string): Promise<number> {
    try {
      return await this.repository.count({
        where: { organisationId, clientId },
      });
    } catch (error) {
      throw new RpcException({
        code: 'INTERNAL',
        message: `Failed to count purchases by client: ${error.message}`,
      });
    }
  }

  async countByContent(organisationId: string, contentId: string): Promise<number> {
    try {
      return await this.repository.count({
        where: { organisationId, contentId },
      });
    } catch (error) {
      throw new RpcException({
        code: 'INTERNAL',
        message: `Failed to count purchases by content: ${error.message}`,
      });
    }
  }
}
