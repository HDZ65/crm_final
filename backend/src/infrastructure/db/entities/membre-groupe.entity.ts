import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('membregroupes')
export class MembreGroupeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  membreCompteId: string;

  @Column()
  groupeId: string;

  @Column()
  roleLocal: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
