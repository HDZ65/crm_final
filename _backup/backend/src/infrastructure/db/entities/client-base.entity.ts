import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { OrganisationEntity } from './organisation.entity';
import { AdresseEntity } from './adresse.entity';
import { ContratEntity } from './contrat.entity';

@Entity('clientbases')
export class ClientBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;

  @ManyToOne(() => OrganisationEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organisationId' })
  organisation: OrganisationEntity;

  @OneToMany(() => AdresseEntity, (adresse) => adresse.client)
  adresses: AdresseEntity[];

  @OneToMany(() => ContratEntity, (contrat) => contrat.client)
  contrats: ContratEntity[];

  @Column()
  typeClient: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ type: 'date', nullable: true })
  dateNaissance?: Date | null;

  @Column()
  compteCode: string;

  @Column()
  partenaireId: string;

  @Column({ type: 'timestamptz' })
  dateCreation: Date;

  @Column()
  telephone: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ default: 'ACTIF' })
  statut: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
