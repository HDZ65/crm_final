import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrganisationEntity } from './organisation.entity';
import { UtilisateurEntity } from './utilisateur.entity';

@Entity('apporteurs')
export class ApporteurEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;

  @ManyToOne(() => OrganisationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation: OrganisationEntity;

  @Column({ type: 'uuid', nullable: true })
  utilisateurId: string | null;

  @ManyToOne(() => UtilisateurEntity, { nullable: true })
  @JoinColumn({ name: 'utilisateurId' })
  utilisateur: UtilisateurEntity | null;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column()
  typeApporteur: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  telephone: string | null;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
