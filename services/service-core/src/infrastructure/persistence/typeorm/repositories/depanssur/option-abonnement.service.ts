import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { OptionAbonnementEntity } from '../../../../../domain/depanssur/entities/option-abonnement.entity';
import type { IOptionAbonnementRepository } from '../../../../../domain/depanssur/repositories/IOptionAbonnementRepository';

@Injectable()
export class OptionAbonnementService implements IOptionAbonnementRepository {
  private readonly logger = new Logger(OptionAbonnementService.name);

  constructor(
    @InjectRepository(OptionAbonnementEntity)
    private readonly repository: Repository<OptionAbonnementEntity>,
  ) {}

  async create(input: any): Promise<OptionAbonnementEntity> {
    const entity = this.repository.create({
      abonnementId: input.abonnementId || input.abonnement_id,
      type: input.type,
      label: input.label,
      prixTtc: String(input.prixTtc ?? input.prix_ttc),
      actif: input.actif ?? true,
    });
    return this.repository.save(entity);
  }

  async update(input: any): Promise<OptionAbonnementEntity> {
    const entity = await this.findById(input.id);
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Option ${input.id} not found` });
    }

    if (input.label !== undefined) entity.label = input.label;
    if (input.prixTtc ?? input.prix_ttc !== undefined) entity.prixTtc = String(input.prixTtc ?? input.prix_ttc);
    if (input.actif !== undefined) entity.actif = input.actif;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<OptionAbonnementEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByAbonnementId(abonnementId: string, actif?: boolean): Promise<OptionAbonnementEntity[]> {
    const where: any = { abonnementId };
    if (actif !== undefined) where.actif = actif;
    return this.repository.find({ where });
  }

  async findAll(
    abonnementId: string,
    filters?: { actif?: boolean },
    pagination?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string },
  ): Promise<{
    options: OptionAbonnementEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = (pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const qb = this.repository
      .createQueryBuilder('o')
      .where('o.abonnementId = :abonnementId', { abonnementId });

    if (filters?.actif !== undefined) {
      qb.andWhere('o.actif = :actif', { actif: filters.actif });
    }

    const [options, total] = await qb
      .orderBy(`o.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { options, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result.affected) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Option ${id} not found` });
    }
  }

  async save(entity: OptionAbonnementEntity): Promise<OptionAbonnementEntity> {
    return this.repository.save(entity);
  }
}
