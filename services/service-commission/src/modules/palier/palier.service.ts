import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PalierCommissionEntity } from './entities/palier-commission.entity';

@Injectable()
export class PalierService {
  private readonly logger = new Logger(PalierService.name);

  constructor(
    @InjectRepository(PalierCommissionEntity)
    private readonly palierRepository: Repository<PalierCommissionEntity>,
  ) {}

  async create(data: Partial<PalierCommissionEntity>): Promise<PalierCommissionEntity> {
    const palier = this.palierRepository.create({ ...data, actif: true });
    const saved = await this.palierRepository.save(palier);
    this.logger.log(`Created palier ${saved.id}`);
    return saved;
  }

  async findById(id: string): Promise<PalierCommissionEntity> {
    const palier = await this.palierRepository.findOne({ where: { id } });
    if (!palier) {
      throw new NotFoundException(`Palier ${id} not found`);
    }
    return palier;
  }

  async findByBareme(baremeId: string): Promise<{ paliers: PalierCommissionEntity[]; total: number }> {
    const [paliers, total] = await this.palierRepository.findAndCount({
      where: { baremeId },
      order: { ordre: 'ASC' },
    });
    return { paliers, total };
  }

  async update(id: string, data: Partial<PalierCommissionEntity>): Promise<PalierCommissionEntity> {
    const palier = await this.findById(id);
    Object.assign(palier, data);
    return this.palierRepository.save(palier);
  }

  async delete(id: string): Promise<void> {
    const palier = await this.findById(id);
    await this.palierRepository.remove(palier);
    this.logger.log(`Deleted palier ${id}`);
  }
}
