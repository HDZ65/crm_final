import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RegleCQEntity } from './regle-cq.entity';
import { CritereCQEntity } from './critere-cq.entity';

@Entity('regles_cq_criteres')
export class RegleCQCritereEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'regle_id', type: 'varchar' })
  regleId: string;

  @Column({ name: 'critere_id', type: 'varchar' })
  critereId: string;

  @ManyToOne(() => RegleCQEntity)
  @JoinColumn({ name: 'regle_id' })
  regle: RegleCQEntity;

  @ManyToOne(() => CritereCQEntity)
  @JoinColumn({ name: 'critere_id' })
  critere: CritereCQEntity;
}
