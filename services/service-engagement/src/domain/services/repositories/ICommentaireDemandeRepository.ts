import { CommentaireDemande } from '../entities/commentaire-demande.entity';

export interface ICommentaireDemandeRepository {
  findById(id: string): Promise<CommentaireDemande | null>;
  findByDemandeId(demandeId: string): Promise<CommentaireDemande[]>;
  save(entity: CommentaireDemande): Promise<CommentaireDemande>;
  delete(id: string): Promise<boolean>;
}
