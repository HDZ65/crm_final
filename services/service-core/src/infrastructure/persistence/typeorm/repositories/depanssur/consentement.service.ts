import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ConsentementEntity } from '../../../../../domain/depanssur/entities/consentement.entity';

@Injectable()
export class ConsentementService {
  private readonly logger = new Logger(ConsentementService.name);

  constructor(
    @InjectRepository(ConsentementEntity)
    private readonly repository: Repository<ConsentementEntity>,
  ) {}

  async create(input: any): Promise<ConsentementEntity> {
    const accorde = input.accorde ?? false;
    const entity = this.repository.create({
      clientBaseId: input.clientBaseId || input.client_id,
      type: input.type,
      accorde,
      dateAccord: accorde ? new Date() : (input.dateAccord || input.date_accord ? new Date(input.dateAccord || input.date_accord) : null),
      dateRetrait: null,
      source: input.source ?? null,
    });
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<ConsentementEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Consentement ${id} not found` });
    }
    return entity;
  }

  async findByClient(
    clientBaseId: string,
    filters?: { type?: string },
    pagination?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string },
  ): Promise<{
    consentements: ConsentementEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = (pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const qb = this.repository
      .createQueryBuilder('c')
      .where('c.clientBaseId = :clientBaseId', { clientBaseId });

    if (filters?.type) {
      qb.andWhere('c.type = :type', { type: filters.type });
    }

    const [consentements, total] = await qb
      .orderBy(`c.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { consentements, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async update(id: string, input: any): Promise<ConsentementEntity> {
    const entity = await this.findById(id);

    // If accorde changes from true → false, set dateRetrait
    if (input.accorde !== undefined && input.accorde !== null) {
      if (entity.accorde === true && input.accorde === false) {
        entity.dateRetrait = new Date();
      }
      entity.accorde = input.accorde;
    }

    if (input.dateRetrait ?? input.date_retrait !== undefined) {
      const dr = input.dateRetrait ?? input.date_retrait;
      entity.dateRetrait = dr ? new Date(dr) : null;
    }

    if (input.source !== undefined) {
      entity.source = input.source;
    }

    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result.affected) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Consentement ${id} not found` });
    }
  }
}
