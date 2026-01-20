import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PalierCommission } from './entities/palier-commission.entity';

@Injectable()
export class PalierCommissionService {
  constructor(
    @InjectRepository(PalierCommission)
    private readonly palierRepository: Repository<PalierCommission>,
  ) {}

  async create(data: Partial<PalierCommission>): Promise<PalierCommission> {
    const palier = this.palierRepository.create(data);
    return this.palierRepository.save(palier);
  }

  async update(id: string, data: Partial<PalierCommission>): Promise<PalierCommission> {
    const palier = await this.findById(id);
    Object.assign(palier, data);
    return this.palierRepository.save(palier);
  }

  async findById(id: string): Promise<PalierCommission> {
    const palier = await this.palierRepository.findOne({ where: { id } });
    if (!palier) {
      throw new NotFoundException(`PalierCommission ${id} non trouvé`);
    }
    return palier;
  }

  async findByBareme(
    baremeId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: PalierCommission[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.palierRepository.findAndCount({
      where: { baremeId },
      skip,
      take: limit,
      order: { ordre: 'ASC', seuilMin: 'ASC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async activer(id: string): Promise<PalierCommission> {
    const palier = await this.findById(id);
    palier.actif = true;
    return this.palierRepository.save(palier);
  }

  async desactiver(id: string): Promise<PalierCommission> {
    const palier = await this.findById(id);
    palier.actif = false;
    return this.palierRepository.save(palier);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.palierRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
