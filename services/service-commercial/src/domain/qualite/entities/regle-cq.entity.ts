import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('regles_cq')
@Index(['organisationId'])
export class RegleCQEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'varchar' })
  organisationId: string;

  @Column({ name: 'type_produit', type: 'varchar' })
  typeProduit: string;

  @Column({ name: 'score_minimum', type: 'decimal', precision: 5, scale: 2, default: 80 })
  scoreMinimum: number;

  @Column({ name: 'auto_validation', type: 'boolean', default: false })
  autoValidation: boolean;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
