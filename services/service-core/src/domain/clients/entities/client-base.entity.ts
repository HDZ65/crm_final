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

  @Column({ name: 'has_conciergerie', type: 'boolean', default: false })
  hasConciergerie: boolean;

  @Column({ name: 'has_justi_plus', type: 'boolean', default: false })
  hasJustiPlus: boolean;

  @Column({ name: 'has_wincash', type: 'boolean', default: false })
  hasWincash: boolean;

  @Column({ name: 'uuid_wincash', type: 'uuid', nullable: true })
  uuidWincash: string | null;

  @Column({ name: 'uuid_justi_plus', type: 'uuid', nullable: true })
  uuidJustiPlus: string | null;

  @Column({ name: 'date_premiere_souscription', type: 'date', nullable: true })
  datePremiereSouscription: Date | null;

    @Column({ name: 'canal_acquisition', type: 'varchar', length: 100, nullable: true })
    canalAcquisition: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    source: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    civilite: string | null;

    @OneToMany('AdresseEntity', 'client')
    adresses: AdresseEntity[];

   @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
   createdBy: string | null;

   @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
   modifiedBy: string | null;

   @CreateDateColumn({ name: 'created_at' })
   createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  static capitalizeName(name: string): string {
    if (!name) return name;
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }
}
