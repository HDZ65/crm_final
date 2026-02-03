import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrganisationEntity } from '../../organisation/entities/organisation.entity';

@Entity('societes')
@Index(['organisationId'])
export class SocieteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'raison_sociale', type: 'varchar', length: 255 })
  raisonSociale: string;

  @Column({ type: 'varchar', length: 20 })
  siren: string;

@Column({ name: 'numero_tva', type: 'varchar', length: 50 })
  numeroTva: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => OrganisationEntity)
  @JoinColumn({ name: 'organisation_id' })
  organisation: OrganisationEntity;
}
