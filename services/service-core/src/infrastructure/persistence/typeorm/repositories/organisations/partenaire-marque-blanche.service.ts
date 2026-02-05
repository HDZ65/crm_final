import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PartenaireMarqueBlancheEntity } from '../../../../../domain/organisations/entities';

@Injectable()
export class PartenaireMarqueBlancheService {
  private readonly logger = new Logger(PartenaireMarqueBlancheService.name);

  constructor(
    @InjectRepository(PartenaireMarqueBlancheEntity)
    private readonly repository: Repository<PartenaireMarqueBlancheEntity>,
  ) {}

  async create(input: {
    denomination: string;
    siren: string;
    numeroTva: string;
    contactSupportEmail: string;
    telephone: string;
    statutId: string;
  }): Promise<PartenaireMarqueBlancheEntity> {
    const entity = this.repository.create({
      denomination: input.denomination,
      siren: input.siren,
      numeroTva: input.numeroTva,
      contactSupportEmail: input.contactSupportEmail,
      telephone: input.telephone,
      statutId: input.statutId,
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    denomination?: string;
    siren?: string;
    numeroTva?: string;
    contactSupportEmail?: string;
    telephone?: string;
    statutId?: string;
  }): Promise<PartenaireMarqueBlancheEntity> {
    const entity = await this.findById(input.id);

    if (input.denomination !== undefined) entity.denomination = input.denomination;
    if (input.siren !== undefined) entity.siren = input.siren;
    if (input.numeroTva !== undefined) entity.numeroTva = input.numeroTva;
    if (input.contactSupportEmail !== undefined) entity.contactSupportEmail = input.contactSupportEmail;
    if (input.telephone !== undefined) entity.telephone = input.telephone;
    if (input.statutId !== undefined) entity.statutId = input.statutId;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<PartenaireMarqueBlancheEntity> {
    const entity = await this.repository.findOne({ where: { id }, relations: ['statut'] });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Partenaire ${id} not found` });
    }
    return entity;
  }

  async findAll(
    filters?: { search?: string; statutId?: string },
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    partenaires: PartenaireMarqueBlancheEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    const where: FindOptionsWhere<PartenaireMarqueBlancheEntity> = {};
    if (filters?.statutId) where.statutId = filters.statutId;

    const queryBuilder = this.repository.createQueryBuilder('p').leftJoinAndSelect('p.statut', 'statut');

    if (filters?.search) {
      queryBuilder.where('(p.denomination ILIKE :search OR p.siren ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    if (filters?.statutId) {
      queryBuilder.andWhere('p.statut_id = :statutId', { statutId: filters.statutId });
    }

    const [partenaires, total] = await queryBuilder
      .orderBy('p.denomination', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { partenaires, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
