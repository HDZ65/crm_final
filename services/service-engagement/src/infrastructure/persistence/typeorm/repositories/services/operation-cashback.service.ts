import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OperationCashback,
  CashbackStatut,
  CashbackType,
} from '../../../../../domain/services/entities/operation-cashback.entity';
import { IOperationCashbackRepository } from '../../../../../domain/services/repositories/IOperationCashbackRepository';

@Injectable()
export class OperationCashbackService implements IOperationCashbackRepository {
  constructor(
    @InjectRepository(OperationCashback)
    private readonly operationCashbackRepository: Repository<OperationCashback>,
  ) {}

  async findById(id: string): Promise<OperationCashback | null> {
    return this.operationCashbackRepository.findOne({ where: { id } });
  }

  async findByReference(reference: string): Promise<OperationCashback | null> {
    return this.operationCashbackRepository.findOne({ where: { reference } });
  }

  async findAll(
    filters?: {
      organisationId?: string;
      clientId?: string;
      statut?: CashbackStatut;
      type?: CashbackType;
      search?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: OperationCashback[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.operationCashbackRepository.createQueryBuilder('op');

    if (filters?.organisationId) {
      queryBuilder.andWhere('op.organisationId = :organisationId', {
        organisationId: filters.organisationId,
      });
    }

    if (filters?.clientId) {
      queryBuilder.andWhere('op.clientId = :clientId', {
        clientId: filters.clientId,
      });
    }

    if (filters?.statut) {
      queryBuilder.andWhere('op.statut = :statut', { statut: filters.statut });
    }

    if (filters?.type) {
      queryBuilder.andWhere('op.type = :type', { type: filters.type });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(op.reference ILIKE :search OR op.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    queryBuilder.orderBy('op.createdAt', 'DESC');
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByClient(
    clientId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: OperationCashback[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.findAll({ clientId }, pagination);
  }

  async save(entity: OperationCashback): Promise<OperationCashback> {
    return this.operationCashbackRepository.save(entity);
  }

  async create(data: Partial<OperationCashback>): Promise<OperationCashback> {
    const operation = this.operationCashbackRepository.create(data);
    return this.operationCashbackRepository.save(operation);
  }

  async update(id: string, data: Partial<OperationCashback>): Promise<OperationCashback> {
    const operation = await this.findById(id);
    if (!operation) {
      throw new NotFoundException(`OperationCashback ${id} non trouvée`);
    }
    Object.assign(operation, data);
    return this.operationCashbackRepository.save(operation);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.operationCashbackRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async getSummaryByClient(clientId: string): Promise<{
    totalGains: number;
    totalUtilise: number;
    soldeDisponible: number;
    operationsCount: number;
  }> {
    const result = await this.operationCashbackRepository
      .createQueryBuilder('op')
      .select('SUM(op.montantCashback)', 'totalGains')
      .addSelect('COUNT(*)', 'operationsCount')
      .where('op.clientId = :clientId', { clientId })
      .andWhere('op.statut IN (:...statuts)', {
        statuts: [CashbackStatut.VALIDEE, CashbackStatut.VERSEE],
      })
      .getRawOne();

    return {
      totalGains: Number(result?.totalGains ?? 0),
      totalUtilise: 0,
      soldeDisponible: Number(result?.totalGains ?? 0),
      operationsCount: Number(result?.operationsCount ?? 0),
    };
  }
}
