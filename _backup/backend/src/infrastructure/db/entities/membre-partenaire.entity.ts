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
import { PartenaireMarqueBlancheEntity } from './partenaire-marque-blanche.entity';

@Entity('membrepartenaires')
export class MembrePartenaireEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  utilisateurId: string;

  @ManyToOne(
    () => UtilisateurEntity,
    (utilisateur) => utilisateur.membresPartenaires,
  )
  @JoinColumn({ name: 'utilisateurId' })
  utilisateur: UtilisateurEntity;

  @Column()
  partenaireMarqueBlancheId: string;

  @ManyToOne(
    () => PartenaireMarqueBlancheEntity,
    (partenaire) => partenaire.membres,
  )
  @JoinColumn({ name: 'partenaireMarqueBlancheId' })
  partenaireMarqueBlanche: PartenaireMarqueBlancheEntity;

  @Column()
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
