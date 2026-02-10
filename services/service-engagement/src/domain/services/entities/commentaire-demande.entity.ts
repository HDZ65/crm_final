import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum CommentaireType {
  INTERNE = 'interne',
  CLIENT = 'client',
  SYSTEME = 'systeme',
}

@Entity('commentaire_demande')
export class CommentaireDemande {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'demande_id' })
  demandeId: string;

  @Column({ name: 'auteur_id' })
  auteurId: string;

  @Column({ type: 'text' })
  contenu: string;

  @Column({
    type: 'enum',
    enum: CommentaireType,
    default: CommentaireType.INTERNE,
  })
  type: CommentaireType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
