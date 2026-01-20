import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MembrePartenaireEntity } from './membre-partenaire.entity';

@Entity('utilisateurs')
export class UtilisateurEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, unique: true })
  keycloakId: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column()
  email: string;

  @Column()
  telephone: string;

  @Column()
  actif: boolean;

  @OneToMany(() => MembrePartenaireEntity, (membre) => membre.utilisateur)
  membresPartenaires: MembrePartenaireEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
