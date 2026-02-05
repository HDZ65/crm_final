import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RoleEntity } from './role.entity';

@Entity('invitationorganisations')
export class InvitationCompteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'email_invite', type: 'varchar', length: 255 })
  emailInvite: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  token: string;

  @Column({ name: 'expire_at', type: 'timestamp' })
  expireAt: Date;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  etat: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;
}
