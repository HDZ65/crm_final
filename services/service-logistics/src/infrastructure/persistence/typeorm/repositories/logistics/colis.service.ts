import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ColisEntity } from '../../../../../domain/logistics/entities';

@Injectable()
export class ColisService {
  private readonly logger = new Logger(ColisService.name);

  constructor(
    @InjectRepository(ColisEntity)
    private readonly colisRepository: Repository<ColisEntity>,
  ) {}

  async create(params: {
    expeditionId: string;
    poidsGr: number;
    longCm: number;
    largCm: number;
    hautCm: number;
    valeurDeclaree: number;
    contenu: string;
  }): Promise<ColisEntity> {
    const colis = this.colisRepository.create(params);
    return this.colisRepository.save(colis);
  }

  async findById(id: string): Promise<ColisEntity | null> {
    return this.colisRepository.findOne({ where: { id } });
  }

  async findByExpeditionId(expeditionId: string): Promise<ColisEntity[]> {
    return this.colisRepository.find({
      where: { expeditionId },
      order: { createdAt: 'ASC' },
    });
  }

  async update(
    id: string,
    params: {
      poidsGr?: number;
      longCm?: number;
      largCm?: number;
      hautCm?: number;
      valeurDeclaree?: number;
      contenu?: string;
    },
  ): Promise<ColisEntity> {
    const colis = await this.findById(id);
    if (!colis) {
      throw new NotFoundException('Colis not found');
    }

    Object.assign(colis, params);
    return this.colisRepository.save(colis);
  }

  async delete(id: string): Promise<void> {
    const result = await this.colisRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Colis not found');
    }
  }
}
