import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { LigneBordereauEntity } from '../../../../../domain/commercial/entities/ligne-bordereau.entity';

@Injectable()
export class LigneBordereauService {
  constructor(
    @InjectRepository(LigneBordereauEntity)
    private readonly ligneRepository: Repository<LigneBordereauEntity>,
  ) {}

  async create(data: Partial<LigneBordereauEntity>): Promise<LigneBordereauEntity> {
    const ligne = this.ligneRepository.create(data);
    return this.ligneRepository.save(ligne);
  }

  async update(id: string, data: Partial<LigneBordereauEntity>): Promise<LigneBordereauEntity> {
    const ligne = await this.findById(id);
    Object.assign(ligne, data);
    return this.ligneRepository.save(ligne);
  }

  async findById(id: string): Promise<LigneBordereauEntity> {
    const ligne = await this.ligneRepository.findOne({ where: { id } });
    if (!ligne) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Ligne bordereau ${id} non trouvee`,
      });
    }
    return ligne;
  }

  async findByBordereau(bordereauId: string): Promise<LigneBordereauEntity[]> {
    return this.ligneRepository.find({
      where: { bordereauId },
      order: { ordre: 'ASC' },
    });
  }

  async validate(id: string, validateurId: string): Promise<LigneBordereauEntity> {
    const ligne = await this.findById(id);
    ligne.statutLigne = 'validee' as any;
    ligne.validateurId = validateurId;
    ligne.dateValidation = new Date();
    return this.ligneRepository.save(ligne);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ligneRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
