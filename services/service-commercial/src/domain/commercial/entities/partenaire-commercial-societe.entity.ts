import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { PartenaireCommercialEntity } from './partenaire-commercial.entity';

@Entity('partenaire_commercial_societes')
@Unique(['partenaireId', 'societeId'])
@Index(['societeId'])
export class PartenaireCommercialSocieteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'partenaire_id', type: 'uuid' })
  partenaireId: string;

  @Column({ name: 'societe_id', type: 'uuid' })
  societeId: string;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @Column({ name: 'date_activation', type: 'timestamptz', nullable: true })
  dateActivation: Date | null;

  @Column({ name: 'date_desactivation', type: 'timestamptz', nullable: true })
  dateDesactivation: Date | null;

  @ManyToOne(() => PartenaireCommercialEntity, (p) => p.societes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partenaire_id' })
  partenaire: PartenaireCommercialEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
