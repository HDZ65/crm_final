import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('invitationorganisations')
export class InvitationCompte {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;

  @Column()
  emailInvite: string;

  @Column()
  roleId: string;

  @Column({ unique: true })
  token: string;

  @Column({ type: 'timestamptz' })
  expireAt: Date;

  @Column({ default: 'pending' })
  etat: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
