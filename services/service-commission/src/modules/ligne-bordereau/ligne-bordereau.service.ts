import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LigneBordereauEntity, StatutLigne } from './entities/ligne-bordereau.entity';

@Injectable()
export class LigneBordereauService {
  private readonly logger = new Logger(LigneBordereauService.name);

  constructor(
    @InjectRepository(LigneBordereauEntity)
    private readonly ligneRepository: Repository<LigneBordereauEntity>,
  ) {}

  async create(data: Partial<LigneBordereauEntity>): Promise<LigneBordereauEntity> {
    const ligne = this.ligneRepository.create(data);
    const saved = await this.ligneRepository.save(ligne);
    this.logger.log(`Created ligne bordereau ${saved.id}`);
    return saved;
  }

  async findById(id: string): Promise<LigneBordereauEntity> {
    const ligne = await this.ligneRepository.findOne({ where: { id } });
    if (!ligne) {
      throw new NotFoundException(`Ligne ${id} not found`);
    }
    return ligne;
  }

  async findByBordereau(bordereauId: string): Promise<{ lignes: LigneBordereauEntity[]; total: number }> {
    const [lignes, total] = await this.ligneRepository.findAndCount({
      where: { bordereauId },
      order: { ordre: 'ASC' },
    });
    return { lignes, total };
  }

  async update(id: string, data: Partial<LigneBordereauEntity>): Promise<LigneBordereauEntity> {
    const ligne = await this.findById(id);
    Object.assign(ligne, data);
    return this.ligneRepository.save(ligne);
  }

  async validate(id: string, validateurId: string, statut: StatutLigne, motif?: string): Promise<LigneBordereauEntity> {
    const ligne = await this.findById(id);
    ligne.statutLigne = statut;
    ligne.validateurId = validateurId;
    ligne.dateValidation = new Date();
    if (motif) ligne.motifDeselection = motif;
    if (statut === StatutLigne.REJETEE || statut === StatutLigne.DESELECTIONNEE) {
      ligne.selectionne = false;
    }
    return this.ligneRepository.save(ligne);
  }

  async deleteByBordereau(bordereauId: string): Promise<void> {
    await this.ligneRepository.delete({ bordereauId });
    this.logger.log(`Deleted all lignes for bordereau ${bordereauId}`);
  }

  async delete(id: string): Promise<void> {
    const ligne = await this.findById(id);
    await this.ligneRepository.remove(ligne);
    this.logger.log(`Deleted ligne ${id}`);
  }
}
