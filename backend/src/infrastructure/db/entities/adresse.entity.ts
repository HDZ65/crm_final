import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClientBaseEntity } from './client-base.entity';

@Entity('adresses')
export class AdresseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientBaseId: string;

  @ManyToOne(() => ClientBaseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientBaseId' })
  client: ClientBaseEntity;

  @Column()
  ligne1: string;

  @Column({ type: 'varchar', nullable: true })
  ligne2?: string | null;

  @Column()
  codePostal: string;

  @Column()
  ville: string;

  @Column()
  pays: string;

  @Column()
  type: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
