import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('transporteurorganisations')
export class TransporteurCompte {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column({ name: 'organisation_id' })
  organisationId: string;

  @Column({ name: 'contract_number' })
  contractNumber: string;

  @Column()
  password: string;

  @Column({ name: 'label_format' })
  labelFormat: string;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
