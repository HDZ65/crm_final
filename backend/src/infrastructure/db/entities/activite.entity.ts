import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('activites')
export class ActiviteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  typeId: string;

  @Column()
  dateActivite: string;

  @Column()
  sujet: string;

  @Column()
  commentaire: string;

  @Column()
  echeance: string;

  @Column()
  clientBaseId: string;

  @Column()
  contratId: string;

  @Column()
  clientPartenaireId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
