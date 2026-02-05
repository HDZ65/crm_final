import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { HistoriqueStatutContratEntity } from './entities/historique-statut-contrat.entity';

@Injectable()
export class HistoriqueStatutContratService {
  private readonly logger = new Logger(HistoriqueStatutContratService.name);

  constructor(
    @InjectRepository(HistoriqueStatutContratEntity)
    private readonly repository: Repository<HistoriqueStatutContratEntity>,
  ) {}

  async create(input: {
    contratId: string;
    ancienStatutId: string;
    nouveauStatutId: string;
    dateChangement: string;
  }): Promise<HistoriqueStatutContratEntity> {
    const entity = this.repository.create({
      contratId: input.contratId,
      ancienStatutId: input.ancienStatutId,
      nouveauStatutId: input.nouveauStatutId,
      dateChangement: input.dateChangement,
    });
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<HistoriqueStatutContratEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Historique ${id} not found` });
    }
    return entity;
  }

  async findByContrat(
    contratId: string,
    pagination?: { page?: number; limit?: number },
  ): Promise<{
    historique: HistoriqueStatutContratEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    const [historique, total] = await this.repository.findAndCount({
      where: { contratId },
      order: { dateChangement: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { historique, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
