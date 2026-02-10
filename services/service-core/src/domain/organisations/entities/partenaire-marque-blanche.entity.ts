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
import { StatutPartenaireEntity } from './statut-partenaire.entity';
import type { MembrePartenaireEntity } from './membre-partenaire.entity';

@Entity('partenairemarqueblanches')
export class PartenaireMarqueBlancheEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  denomination: string;

  @Column({ type: 'varchar', length: 20 })
  siren: string;

  @Column({ name: 'numero_tva', type: 'varchar', length: 50 })
  numeroTva: string;

  @Column({ name: 'contact_support_email', type: 'varchar', length: 255 })
  contactSupportEmail: string;

  @Column({ type: 'varchar', length: 50 })
  telephone: string;

   @Column({ name: 'statut_id', type: 'uuid' })
   statutId: string;

   @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
   createdBy: string | null;

   @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
   modifiedBy: string | null;

   @CreateDateColumn({ name: 'created_at' })
   createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => StatutPartenaireEntity)
  @JoinColumn({ name: 'statut_id' })
  statut: StatutPartenaireEntity;

  @OneToMany('MembrePartenaireEntity', 'partenaire')
  membres: MembrePartenaireEntity[];
}
