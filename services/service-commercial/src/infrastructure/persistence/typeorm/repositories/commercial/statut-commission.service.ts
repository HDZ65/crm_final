import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { StatutCommissionEntity } from '../../../../../domain/commercial/entities/statut-commission.entity';

@Injectable()
export class StatutCommissionService {
  constructor(
    @InjectRepository(StatutCommissionEntity)
    private readonly statutRepository: Repository<StatutCommissionEntity>,
  ) {}

  async create(data: Partial<StatutCommissionEntity>): Promise<StatutCommissionEntity> {
    if (data.code) {
      const existing = await this.statutRepository.findOne({ where: { code: data.code } });
      if (existing) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `Statut avec code "${data.code}" existe deja`,
        });
      }
    }
    const statut = this.statutRepository.create(data);
    return this.statutRepository.save(statut);
  }

  async update(id: string, data: Partial<StatutCommissionEntity>): Promise<StatutCommissionEntity> {
    const statut = await this.findById(id);
    Object.assign(statut, data);
    return this.statutRepository.save(statut);
  }

  async findById(id: string): Promise<StatutCommissionEntity> {
    const statut = await this.statutRepository.findOne({ where: { id } });
    if (!statut) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Statut ${id} non trouve`,
      });
    }
    return statut;
  }

  async findByCode(code: string): Promise<StatutCommissionEntity> {
    const statut = await this.statutRepository.findOne({ where: { code } });
    if (!statut) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Statut avec code "${code}" non trouve`,
      });
    }
    return statut;
  }

  async findAll(
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: StatutCommissionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await this.statutRepository.findAndCount({
      order: { ordreAffichage: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.statutRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
