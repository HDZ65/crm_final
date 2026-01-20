import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('clientpartenaires')
export class ClientPartenaireEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_base_id', type: 'uuid' })
  clientBaseId: string;

  @Column({ name: 'partenaire_id', type: 'uuid' })
  partenaireId: string;

  @Column({ name: 'role_partenaire_id', type: 'uuid' })
  rolePartenaireId: string;

  @Column({ name: 'valid_from', type: 'date' })
  validFrom: string;

  @Column({ name: 'valid_to', type: 'date', nullable: true })
  validTo: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
