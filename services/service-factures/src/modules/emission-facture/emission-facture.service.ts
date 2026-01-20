import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { EmissionFactureEntity } from './entities/emission-facture.entity';

@Injectable()
export class EmissionFactureService {
  private readonly logger = new Logger(EmissionFactureService.name);

  constructor(
    @InjectRepository(EmissionFactureEntity)
    private readonly repository: Repository<EmissionFactureEntity>,
  ) {}

  async create(input: { code: string; nom: string; description?: string }): Promise<EmissionFactureEntity> {
    const entity = this.repository.create({
      code: input.code,
      nom: input.nom,
      description: input.description || null,
    });
    return this.repository.save(entity);
  }

  async update(input: { id: string; code?: string; nom?: string; description?: string }): Promise<EmissionFactureEntity> {
    const entity = await this.findById(input.id);
    if (input.code !== undefined) entity.code = input.code;
    if (input.nom !== undefined) entity.nom = input.nom;
    if (input.description !== undefined) entity.description = input.description || null;
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<EmissionFactureEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Emission facture ${id} not found` });
    }
    return entity;
  }

  async findAll(pagination?: { page?: number; limit?: number }): Promise<{
    emissions: EmissionFactureEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;
    const [emissions, total] = await this.repository.findAndCount({
      order: { code: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { emissions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
