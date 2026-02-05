import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('evenement_suivi')
export class EvenementSuivi {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'expedition_id' })
  expeditionId: string;

  @Column()
  code: string;

  @Column()
  label: string;

  @Column({ name: 'date_evenement', type: 'timestamp' })
  dateEvenement: Date;

  @Column({ nullable: true })
  lieu: string;

  @Column({ type: 'jsonb', nullable: true })
  raw: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
