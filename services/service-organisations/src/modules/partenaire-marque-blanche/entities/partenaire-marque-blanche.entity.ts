import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { StatutPartenaireEntity } from '../../statut-partenaire/entities/statut-partenaire.entity';
import { MembrePartenaireEntity } from '../../membre-partenaire/entities/membre-partenaire.entity';

@Entity('partenairemarqueblanches')
export class PartenaireMarqueBlancheEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  denomination: string;

  @Column({ type: 'varchar', length: 20 })
  siren: string;

  @Column({ name: 'numero_tva', type: 'varchar', length: 50 })
  numeroTVA: string;

  @Column({ name: 'contact_support_email', type: 'varchar', length: 255 })
  contactSupportEmail: string;

  @Column({ type: 'varchar', length: 50 })
  telephone: string;

  @Column({ name: 'statut_id', type: 'uuid' })
  statutId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => StatutPartenaireEntity)
  @JoinColumn({ name: 'statut_id' })
  statut: StatutPartenaireEntity;

  @OneToMany(() => MembrePartenaireEntity, (membre) => membre.partenaire)
  membres: MembrePartenaireEntity[];
}
