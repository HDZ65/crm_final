import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('piecejointes')
export class PieceJointeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nom_fichier' })
  nomFichier: string;

  @Column()
  url: string;

  @Column({ name: 'type_mime', nullable: true })
  typeMime: string;

  @Column({ type: 'bigint', nullable: true })
  taille: number;

  @Column({ name: 'entite_type', nullable: true })
  entiteType: string;

  @Column({ name: 'entite_id', nullable: true })
  entiteId: string;

  @Column({ name: 'date_upload', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateUpload: Date;

  @Column({ name: 'uploaded_by', nullable: true })
  uploadedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'type_document', type: 'int', default: 0 })
  typeDocument: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  @Index()
  parentId: string | null;

  @Column({ name: 'hash_sha256', type: 'varchar', length: 64, nullable: true })
  hashSha256: string | null;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  keycloakGroupId: string | null;
}
