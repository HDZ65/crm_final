import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CommentaireDemande,
  CommentaireType,
} from '../../../../../domain/services/entities/commentaire-demande.entity';
import { ICommentaireDemandeRepository } from '../../../../../domain/services/repositories/ICommentaireDemandeRepository';

export interface CreateCommentaireInput {
  demandeId: string;
  auteurId: string;
  contenu: string;
  type?: CommentaireType;
}

@Injectable()
export class CommentaireDemandeService implements ICommentaireDemandeRepository {
  private readonly logger = new Logger(CommentaireDemandeService.name);

  constructor(
    @InjectRepository(CommentaireDemande)
    private readonly repository: Repository<CommentaireDemande>,
  ) {}

  async findById(id: string): Promise<CommentaireDemande | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByDemandeId(demandeId: string): Promise<CommentaireDemande[]> {
    return this.repository.find({
      where: { demandeId },
      order: { createdAt: 'ASC' },
    });
  }

  async create(input: CreateCommentaireInput): Promise<CommentaireDemande> {
    const entity = this.repository.create({
      demandeId: input.demandeId,
      auteurId: input.auteurId,
      contenu: input.contenu,
      type: input.type ?? CommentaireType.INTERNE,
    } as Partial<CommentaireDemande>) as CommentaireDemande;

    const saved = await this.repository.save(entity);
    this.logger.log(`Created CommentaireDemande ${saved.id} for demande ${saved.demandeId}`);
    return saved;
  }

  async save(entity: CommentaireDemande): Promise<CommentaireDemande> {
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const entity = await this.findById(id);
    if (!entity) {
      return false;
    }
    await this.repository.remove(entity);
    this.logger.log(`Deleted CommentaireDemande ${id}`);
    return true;
  }
}
