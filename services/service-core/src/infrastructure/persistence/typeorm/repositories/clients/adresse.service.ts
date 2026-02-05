import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { AdresseEntity } from '../../../../../domain/clients/entities';

@Injectable()
export class AdresseService {
  private readonly logger = new Logger(AdresseService.name);

  constructor(
    @InjectRepository(AdresseEntity)
    private readonly repository: Repository<AdresseEntity>,
  ) {}

  async create(input: {
    clientBaseId: string;
    ligne1: string;
    ligne2?: string;
    codePostal: string;
    ville: string;
    pays?: string;
    type: string;
  }): Promise<AdresseEntity> {
    const entity = this.repository.create({
      clientBaseId: input.clientBaseId,
      ligne1: input.ligne1,
      ligne2: input.ligne2 || null,
      codePostal: input.codePostal,
      ville: input.ville,
      pays: input.pays || 'France',
      type: input.type,
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    ligne1?: string;
    ligne2?: string;
    codePostal?: string;
    ville?: string;
    pays?: string;
    type?: string;
  }): Promise<AdresseEntity> {
    const entity = await this.findById(input.id);

    if (input.ligne1 !== undefined) entity.ligne1 = input.ligne1;
    if (input.ligne2 !== undefined) entity.ligne2 = input.ligne2 || null;
    if (input.codePostal !== undefined) entity.codePostal = input.codePostal;
    if (input.ville !== undefined) entity.ville = input.ville;
    if (input.pays !== undefined) entity.pays = input.pays;
    if (input.type !== undefined) entity.type = input.type;

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<AdresseEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Adresse ${id} not found` });
    }
    return entity;
  }

  async findByClient(clientBaseId: string, pagination?: { page?: number; limit?: number }): Promise<{
    adresses: AdresseEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    const [adresses, total] = await this.repository.findAndCount({
      where: { clientBaseId },
      order: { type: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { adresses, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
