import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContratEntity } from './contrat.entity';

@Entity('historiquestatutcontrats')
export class HistoriqueStatutContratEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  contratId: string;

  @ManyToOne(() => ContratEntity, (contrat) => contrat.historiquesStatut)
  @JoinColumn({ name: 'contratId' })
  contrat: ContratEntity;

  @Column()
  ancienStatutId: string;

  @Column()
  nouveauStatutId: string;

  @Column()
  dateChangement: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
