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
import { PartenaireMarqueBlancheEntity } from './partenaire-marque-blanche.entity';
import { RolePartenaireEntity } from './role-partenaire.entity';

@Entity('membrepartenaires')
@Unique(['utilisateurId', 'partenaireId'])
export class MembrePartenaireEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'utilisateur_id', type: 'uuid' })
  utilisateurId: string;

  @Column({ name: 'partenaire_marque_blanche_id', type: 'uuid' })
  partenaireId: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => PartenaireMarqueBlancheEntity, (partenaire) => partenaire.membres)
  @JoinColumn({ name: 'partenaire_marque_blanche_id' })
  partenaire: PartenaireMarqueBlancheEntity;

  @ManyToOne(() => RolePartenaireEntity)
  @JoinColumn({ name: 'role_id' })
  role: RolePartenaireEntity;
}
