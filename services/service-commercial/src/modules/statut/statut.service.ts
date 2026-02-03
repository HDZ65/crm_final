import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatutCommissionEntity } from './entities/statut-commission.entity';

@Injectable()
export class StatutService {
  private readonly logger = new Logger(StatutService.name);

  constructor(
    @InjectRepository(StatutCommissionEntity)
    private readonly statutRepository: Repository<StatutCommissionEntity>,
  ) {}

  async create(data: Partial<StatutCommissionEntity>): Promise<StatutCommissionEntity> {
    const statut = this.statutRepository.create(data);
    const saved = await this.statutRepository.save(statut);
    this.logger.log(`Created statut ${saved.id}`);
    return saved;
  }

  async findById(id: string): Promise<StatutCommissionEntity> {
    const statut = await this.statutRepository.findOne({ where: { id } });
    if (!statut) {
      throw new NotFoundException(`Statut ${id} not found`);
    }
    return statut;
  }

  async findByCode(code: string): Promise<StatutCommissionEntity> {
    const statut = await this.statutRepository.findOne({ where: { code } });
    if (!statut) {
      throw new NotFoundException(`Statut with code ${code} not found`);
    }
    return statut;
  }

  async findAll(limit?: number, offset?: number): Promise<{ statuts: StatutCommissionEntity[]; total: number }> {
    const [statuts, total] = await this.statutRepository.findAndCount({
      take: limit || 50,
      skip: offset || 0,
      order: { ordreAffichage: 'ASC' },
    });
    return { statuts, total };
  }

  async update(id: string, data: Partial<StatutCommissionEntity>): Promise<StatutCommissionEntity> {
    const statut = await this.findById(id);
    Object.assign(statut, data);
    return this.statutRepository.save(statut);
  }

  async delete(id: string): Promise<void> {
    const statut = await this.findById(id);
    await this.statutRepository.remove(statut);
    this.logger.log(`Deleted statut ${id}`);
  }
}
