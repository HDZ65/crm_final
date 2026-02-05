import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { AdresseEntity } from './adresse.entity';

@Entity('clientbases')
export class ClientBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'type_client', length: 50 })
  typeClient: string;

  @Column({ length: 100 })
  nom: string;

  @Column({ length: 100 })
  prenom: string;

  @Column({ name: 'date_naissance', type: 'date', nullable: true })
  dateNaissance: Date | null;

  @Column({ name: 'compte_code', length: 50 })
  compteCode: string;

  @Column({ name: 'partenaire_id', type: 'uuid' })
  partenaireId: string;

  @Column({ name: 'date_creation', type: 'timestamptz' })
  dateCreation: Date;

  @Column({ length: 20 })
  telephone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ length: 50, default: 'ACTIF' })
  statut: string;

  @Column({ name: 'societe_id', type: 'uuid', nullable: true })
  societeId: string | null;

  @OneToMany('AdresseEntity', 'client')
  adresses: AdresseEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  static capitalizeName(name: string): string {
    if (!name) return name;
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }
}
