import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('evenementsuivis')
export class TrackingEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'expedition_id' })
  @Index()
  expeditionId: string;

  @Column()
  code: string;

  @Column()
  label: string;

  @Column({ name: 'date_evenement' })
  dateEvenement: string;

  @Column({ nullable: true })
  lieu: string;

  @Column({ type: 'text', nullable: true })
  raw: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
