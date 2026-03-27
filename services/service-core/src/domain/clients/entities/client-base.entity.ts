import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { EncryptedColumnTransformer } from '../../../infrastructure/security/encrypted-column.transformer';
import { EncryptionService } from '../../../infrastructure/security/encryption.service';
import { AdresseEntity } from './adresse.entity';

const encryptionService = new EncryptionService();

@Entity('clientbases')
export class ClientBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'keycloak_group_id', type: 'varchar', length: 255 })
  keycloakGroupId: string;

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

  @Column({
    name: 'iban',
    type: 'text',
    nullable: true,
    transformer: new EncryptedColumnTransformer(encryptionService),
  })
  iban: string | null;

  @Column({
    name: 'bic',
    type: 'text',
    nullable: true,
    transformer: new EncryptedColumnTransformer(encryptionService),
  })
  bic: string | null;

  @Column({ name: 'mandat_sepa', type: 'boolean', nullable: true })
  mandatSepa: boolean | null;

  @Column({ name: 'csp', type: 'varchar', length: 100, nullable: true })
  csp: string | null;

  @Column({ name: 'regime_social', type: 'varchar', length: 100, nullable: true })
  regimeSocial: string | null;

  @Column({ name: 'lieu_naissance', type: 'varchar', length: 100, nullable: true })
  lieuNaissance: string | null;

  @Column({ name: 'pays_naissance', type: 'varchar', length: 100, nullable: true })
  paysNaissance: string | null;

  @Column({ name: 'etape_courante', type: 'varchar', length: 100, nullable: true })
  etapeCourante: string | null;

  @Column({ name: 'is_politically_exposed', type: 'boolean', nullable: true })
  isPoliticallyExposed: boolean | null;

  @Column({ name: 'numss', type: 'varchar', length: 20, nullable: true })
  numss: string | null;

  @Column({ name: 'num_organisme', type: 'varchar', length: 20, nullable: true })
  numOrganisme: string | null;

  @OneToMany(() => AdresseEntity, (adresse) => adresse.client)
  adresses: Relation<AdresseEntity[]>;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy: string | null;

  @Column({ name: 'modified_by', type: 'varchar', length: 255, nullable: true })
  modifiedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'search_vector', type: 'tsvector', nullable: true, select: false })
  searchVector: unknown;

  static capitalizeName(name: string): string {
    if (!name) return name;
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }
}
