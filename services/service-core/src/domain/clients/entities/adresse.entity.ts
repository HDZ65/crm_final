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

  @Column({ name: 'client_base_id', type: 'uuid' })
  clientBaseId: string;

  @ManyToOne(() => ClientBaseEntity, (client) => client.adresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_base_id' })
  client: ClientBaseEntity;

  @Column({ length: 255 })
  ligne1: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ligne2: string | null;

  @Column({ name: 'code_postal', length: 20 })
  codePostal: string;

  @Column({ length: 100 })
  ville: string;

  @Column({ length: 100, default: 'France' })
  pays: string;

  @Column({ length: 50 })
  type: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
