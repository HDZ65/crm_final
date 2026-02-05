import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { VersionProduitEntity } from '../../version-produit/entities/version-produit.entity';

export enum VisibilitePublication {
  CACHE = 'CACHE',
  INTERNE = 'INTERNE',
  PUBLIC = 'PUBLIC',
}

@Entity('produit_publications')
@Index(['versionProduitId', 'societeId'])
export class PublicationProduitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'version_produit_id', type: 'uuid' })
  versionProduitId: string;

  @Column({ name: 'societe_id', type: 'uuid' })
  societeId: string;

  @Column({ type: 'jsonb' })
  channels: string[];

  @Column({
    type: 'enum',
    enum: VisibilitePublication,
    default: VisibilitePublication.INTERNE,
  })
  visibilite: VisibilitePublication;

  @Column({ name: 'start_at', type: 'timestamp' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamp', nullable: true })
  endAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => VersionProduitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'version_produit_id' })
  versionProduit: VersionProduitEntity;
}
