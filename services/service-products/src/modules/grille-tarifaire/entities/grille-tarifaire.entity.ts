import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { PrixProduitEntity } from '../../prix-produit/entities/prix-produit.entity';

@Entity('grille_tarifaire')
@Index(['organisationId', 'estParDefaut'])
export class GrilleTarifaireEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ length: 100 })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'date_debut', type: 'date', nullable: true })
  dateDebut: Date | null;

  @Column({ name: 'date_fin', type: 'date', nullable: true })
  dateFin: Date | null;

  @Column({ name: 'est_par_defaut', default: false })
  estParDefaut: boolean;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => PrixProduitEntity, (prix) => prix.grilleTarifaire)
  prixProduits: PrixProduitEntity[];
}
