import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('colis')
export class ColisEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  expeditionId: string;

  @Column()
  poidsGr: number;

  @Column()
  longCm: number;

  @Column()
  largCm: number;

  @Column()
  hautCm: number;

  @Column()
  valeurDeclaree: number;

  @Column()
  contenu: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
