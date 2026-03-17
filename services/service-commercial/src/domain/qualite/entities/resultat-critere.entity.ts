import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { ControleQualiteEntity } from './controle-qualite.entity';
import { CritereCQEntity } from './critere-cq.entity';

@Entity('resultats_criteres')
export class ResultatCritereEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'controle_qualite_id', type: 'varchar' })
  controleQualiteId: string;

  @Column({ name: 'critere_id', type: 'varchar' })
  critereId: string;

  @Column({ type: 'boolean', nullable: true })
  conforme: boolean | null;

  @Column({ type: 'text', nullable: true })
  commentaire: string | null;

  @Column({ name: 'verifie_par', type: 'varchar', nullable: true })
  verifiePar: string | null;

  @Column({ name: 'date_verification', type: 'timestamp', nullable: true })
  dateVerification: Date | null;

  @ManyToOne(() => ControleQualiteEntity, (cq) => cq.resultats)
  @JoinColumn({ name: 'controle_qualite_id' })
  controleQualite: Relation<ControleQualiteEntity>;

  @ManyToOne(() => CritereCQEntity)
  @JoinColumn({ name: 'critere_id' })
  critere: Relation<CritereCQEntity>;
}
