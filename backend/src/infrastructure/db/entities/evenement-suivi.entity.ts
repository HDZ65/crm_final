import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('evenementsuivis')
export class EvenementSuiviEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  expeditionId: string;

  @Column()
  code: string;

  @Column()
  label: string;

  @Column()
  dateEvenement: string;

  @Column()
  lieu: string;

  @Column()
  raw: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
