import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cliententreprises')
export class ClientEntrepriseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'raison_sociale', length: 255 })
  raisonSociale: string;

  @Column({ name: 'numero_tva', length: 50 })
  numeroTva: string;

  @Column({ length: 20 })
  siren: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
