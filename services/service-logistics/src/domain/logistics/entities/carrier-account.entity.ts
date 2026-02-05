import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('transporteurorganisations')
export class CarrierAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id' })
  @Index()
  organisationId: string;

  @Column()
  type: string;

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

  // Business methods
  isActive(): boolean {
    return this.actif;
  }

  isMaileva(): boolean {
    return this.type.toLowerCase() === 'maileva';
  }
}
