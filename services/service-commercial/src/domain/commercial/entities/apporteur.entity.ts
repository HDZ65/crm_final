import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('apporteurs')
export class ApporteurEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id' })
  organisationId: string;

  @Column({ name: 'utilisateur_id', type: 'uuid', nullable: true })
  utilisateurId: string | null;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ name: 'type_apporteur' })
  typeApporteur: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  telephone: string | null;

  @Column({ name: 'societe_id', type: 'uuid', nullable: true })
  societeId: string | null; // NULL = toutes les societes

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
