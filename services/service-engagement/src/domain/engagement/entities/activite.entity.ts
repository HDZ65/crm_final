import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TypeActiviteEntity } from './type-activite.entity';

@Entity('activite')
export class ActiviteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'type_id' })
  typeId: string;

  @ManyToOne(() => TypeActiviteEntity)
  @JoinColumn({ name: 'type_id' })
  type: TypeActiviteEntity;

  @Column({ name: 'date_activite', type: 'timestamp' })
  dateActivite: Date;

  @Column()
  sujet: string;

  @Column({ type: 'text', nullable: true })
  commentaire: string;

  @Column({ type: 'timestamp', nullable: true })
  echeance: Date;

  @Column({ name: 'client_base_id', nullable: true })
  clientBaseId: string;

  @Column({ name: 'contrat_id', nullable: true })
  contratId: string;

  @Column({ name: 'client_partenaire_id', nullable: true })
  clientPartenaireId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
