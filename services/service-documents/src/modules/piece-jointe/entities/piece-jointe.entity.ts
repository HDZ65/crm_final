import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('piecejointes')
export class PieceJointe {
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
}
