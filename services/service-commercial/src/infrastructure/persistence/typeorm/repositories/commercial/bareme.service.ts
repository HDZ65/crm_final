import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { BaremeCommissionEntity } from '../../../../../domain/commercial/entities/bareme-commission.entity';

@Injectable()
export class BaremeService {
  constructor(
    @InjectRepository(BaremeCommissionEntity)
    private readonly baremeRepository: Repository<BaremeCommissionEntity>,
  ) {}

  async create(data: Partial<BaremeCommissionEntity>): Promise<BaremeCommissionEntity> {
    if (data.code) {
      const existing = await this.baremeRepository.findOne({ where: { code: data.code } });
      if (existing) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: `Bareme avec code "${data.code}" existe deja`,
        });
      }
    }
    const bareme = this.baremeRepository.create(data);
    return this.baremeRepository.save(bareme);
  }

  async update(id: string, data: Partial<BaremeCommissionEntity>): Promise<BaremeCommissionEntity> {
    const bareme = await this.findById(id);
    Object.assign(bareme, data);
    return this.baremeRepository.save(bareme);
  }

  async findById(id: string): Promise<BaremeCommissionEntity> {
    const bareme = await this.baremeRepository.findOne({
      where: { id },
      relations: ['paliers'],
    });
    if (!bareme) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Bareme ${id} non trouve`,
      });
    }
    return bareme;
  }

  async findByCode(code: string): Promise<BaremeCommissionEntity> {
    const bareme = await this.baremeRepository.findOne({
      where: { code },
      relations: ['paliers'],
    });
    if (!bareme) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Bareme avec code "${code}" non trouve`,
      });
    }
    return bareme;
  }

  async findApplicable(
    organisationId: string,
    typeProduit: string,
    dateEffet: string,
  ): Promise<BaremeCommissionEntity> {
    const qb = this.baremeRepository.createQueryBuilder('b');
    qb.leftJoinAndSelect('b.paliers', 'paliers');
    qb.where('b.organisationId = :orgId', { orgId: organisationId });
    qb.andWhere('b.actif = true');
    if (typeProduit) {
      qb.andWhere('(b.typeProduit = :typeProduit OR b.typeProduit IS NULL)', { typeProduit });
    }
    if (dateEffet) {
      qb.andWhere('b.dateEffet <= :dateEffet', { dateEffet });
      qb.andWhere('(b.dateFin IS NULL OR b.dateFin >= :dateEffet)', { dateEffet });
    }
    qb.orderBy('b.version', 'DESC');

    const bareme = await qb.getOne();
    if (!bareme) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Aucun bareme applicable trouve`,
      });
    }
    return bareme;
  }

  async findAll(
    filters?: { organisationId?: string; typeProduit?: string; actif?: boolean },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: BaremeCommissionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.baremeRepository.createQueryBuilder('b');
    qb.leftJoinAndSelect('b.paliers', 'paliers');

    if (filters?.organisationId) {
      qb.andWhere('b.organisationId = :orgId', { orgId: filters.organisationId });
    }
    if (filters?.typeProduit) {
      qb.andWhere('b.typeProduit = :typeProduit', { typeProduit: filters.typeProduit });
    }
    if (filters?.actif !== undefined) {
      qb.andWhere('b.actif = :actif', { actif: filters.actif });
    }

    qb.orderBy('b.nom', 'ASC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.baremeRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
