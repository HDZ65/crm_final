import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('affectationgroupeclients')
export class AffectationGroupeClientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupeId: string;

  @Column()
  clientBaseId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
