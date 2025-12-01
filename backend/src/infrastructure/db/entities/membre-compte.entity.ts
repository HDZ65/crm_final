import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UtilisateurEntity } from './utilisateur.entity';
import { OrganisationEntity } from './organisation.entity';

@Entity('membreorganisations')
export class MembreOrganisationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;

  @ManyToOne(() => OrganisationEntity)
  @JoinColumn({ name: 'organisationId' })
  organisation: OrganisationEntity;

  @Column()
  utilisateurId: string;

  @ManyToOne(() => UtilisateurEntity)
  @JoinColumn({ name: 'utilisateurId' })
  utilisateur: UtilisateurEntity;

  @Column()
  roleId: string;

  @Column({ default: 'actif' })
  etat: string;

  @Column({ type: 'timestamptz', nullable: true })
  dateInvitation: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  dateActivation: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
