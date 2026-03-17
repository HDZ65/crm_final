import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { TypeCritere } from '../enums/statut-cq.enum';

@Entity('criteres_cq')
@Index(['organisationId'])
@Unique(['organisationId', 'code'])
export class CritereCQEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'varchar' })
  organisationId: string;

  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'varchar' })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'type_critere', type: 'varchar', enum: TypeCritere })
  typeCritere: TypeCritere;

  @Column({ type: 'boolean', default: true })
  obligatoire: boolean;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @Column({ type: 'integer', default: 0 })
  ordre: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
