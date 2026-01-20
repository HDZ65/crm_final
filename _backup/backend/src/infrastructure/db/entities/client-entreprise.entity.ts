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

  @Column()
  raisonSociale: string;

  @Column()
  numeroTVA: string;

  @Column()
  siren: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
