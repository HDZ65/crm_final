import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UtilisateurEntity } from './utilisateur.entity';
import { RoleEntity } from './role.entity';

@Entity('membreorganisations')
@Unique(['organisationId', 'utilisateurId'])
export class MembreCompteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'utilisateur_id', type: 'uuid' })
  utilisateurId: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @Column({ type: 'varchar', length: 50, default: 'actif' })
  etat: string;

  @Column({ name: 'date_invitation', type: 'timestamp', nullable: true })
  dateInvitation: Date | null;

  @Column({ name: 'date_activation', type: 'timestamp', nullable: true })
  dateActivation: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => UtilisateurEntity)
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: UtilisateurEntity;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;
}
