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
import { VersionProduitEntity } from './version-produit.entity';

export enum TypeDocumentProduit {
  DIPA = 'DIPA',
  CG = 'CG',
  CP = 'CP',
  TARIF = 'TARIF',
  SCRIPT = 'SCRIPT',
  MEDIA = 'MEDIA',
}

@Entity('produit_documents')
@Index(['versionProduitId', 'type'])
export class DocumentProduitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'version_produit_id', type: 'uuid' })
  versionProduitId: string;

  @Column({ type: 'enum', enum: TypeDocumentProduit })
  type: TypeDocumentProduit;

  @Column({ length: 160 })
  title: string;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl: string;

  @Column({ name: 'file_hash', type: 'varchar', length: 96 })
  fileHash: string;

  @Column({ default: false })
  mandatory: boolean;

   @Column({ name: 'published_at', type: 'timestamp', nullable: true })
   publishedAt: Date | null;

   @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
   createdBy: string | null;

   @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
   modifiedBy: string | null;

   @CreateDateColumn({ name: 'created_at' })
   createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => VersionProduitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'version_produit_id' })
  versionProduit: VersionProduitEntity;
}
