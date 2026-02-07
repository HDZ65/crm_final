import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PalierCommissionEntity } from '../../../../../domain/commercial/entities/palier-commission.entity';

@Injectable()
export class PalierService {
  constructor(
    @InjectRepository(PalierCommissionEntity)
    private readonly palierRepository: Repository<PalierCommissionEntity>,
  ) {}

  async create(data: Partial<PalierCommissionEntity>): Promise<PalierCommissionEntity> {
    const palier = this.palierRepository.create(data);
    return this.palierRepository.save(palier);
  }

  async update(id: string, data: Partial<PalierCommissionEntity>): Promise<PalierCommissionEntity> {
    const palier = await this.findById(id);
    Object.assign(palier, data);
    return this.palierRepository.save(palier);
  }

  async findById(id: string): Promise<PalierCommissionEntity> {
    const palier = await this.palierRepository.findOne({ where: { id } });
    if (!palier) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Palier ${id} non trouve`,
      });
    }
    return palier;
  }

  async findByBareme(baremeId: string): Promise<PalierCommissionEntity[]> {
    return this.palierRepository.find({
      where: { baremeId },
      order: { ordre: 'ASC' },
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.palierRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
