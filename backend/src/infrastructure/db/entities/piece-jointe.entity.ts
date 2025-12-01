import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('piecejointes')
export class PieceJointeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nomFichier: string;

  @Column()
  url: string;

  @Column()
  dateUpload: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
