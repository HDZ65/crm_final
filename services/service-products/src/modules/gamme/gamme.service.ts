import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import type {
  CreateGammeRequest,
  UpdateGammeRequest,
  ListGammesRequest,
  GetGammeRequest,
  DeleteGammeRequest,
} from '@proto/products/products';
import { GammeEntity } from './entities/gamme.entity';

@Injectable()
export class GammeService {
  private readonly logger = new Logger(GammeService.name);

  constructor(
    @InjectRepository(GammeEntity)
    private readonly gammeRepository: Repository<GammeEntity>,
  ) {}

  async create(input: CreateGammeRequest): Promise<GammeEntity> {
    this.logger.log(`Creating gamme: ${input.nom}`);

    const existing = await this.gammeRepository.findOne({
      where: { organisationId: input.organisationId, code: input.code },
    });

    if (existing) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Gamme with code ${input.code} already exists`,
      });
    }

    const gamme = this.gammeRepository.create({
      organisationId: input.organisationId,
      nom: input.nom,
      description: input.description || null,
      icone: input.icone || null,
      code: input.code,
      ordre: input.ordre ?? 0,
      actif: true,
    });

    return this.gammeRepository.save(gamme);
  }

  async update(input: UpdateGammeRequest): Promise<GammeEntity> {
    const gamme = await this.gammeRepository.findOne({
      where: { id: input.id },
    });

    if (!gamme) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Gamme ${input.id} not found`,
      });
    }

    if (input.nom !== undefined) gamme.nom = input.nom;
    if (input.description !== undefined) gamme.description = input.description;
    if (input.icone !== undefined) gamme.icone = input.icone;
    if (input.code !== undefined) gamme.code = input.code;
    if (input.ordre !== undefined) gamme.ordre = input.ordre;
    if (input.actif !== undefined) gamme.actif = input.actif;

    return this.gammeRepository.save(gamme);
  }

  async findById(input: GetGammeRequest): Promise<GammeEntity> {
    const gamme = await this.gammeRepository.findOne({
      where: { id: input.id },
      relations: ['produits'],
    });

    if (!gamme) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Gamme ${input.id} not found`,
      });
    }

    return gamme;
  }

  async findAll(input: ListGammesRequest): Promise<{
    gammes: GammeEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 20;
    const sortBy = input.pagination?.sortBy || 'ordre';
    const sortOrder = (input.pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'ASC';

    const queryBuilder = this.gammeRepository
      .createQueryBuilder('gamme')
      .where('gamme.organisationId = :organisationId', {
        organisationId: input.organisationId,
      });

    if (input.actif !== undefined) {
      queryBuilder.andWhere('gamme.actif = :actif', { actif: input.actif });
    }

    const [gammes, total] = await queryBuilder
      .orderBy(`gamme.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      gammes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async delete(input: DeleteGammeRequest): Promise<boolean> {
    const result = await this.gammeRepository.delete(input.id);
    return (result.affected ?? 0) > 0;
  }
}
