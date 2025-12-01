import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ClientBaseEntity } from './client-base.entity';
import { ContratEntity } from './contrat.entity';

@Entity('comptes')
export class CompteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column()
  etat: string;

  @Column()
  dateCreation: string;

  @Column()
  createdByUserId: string;

  @OneToMany(() => ClientBaseEntity, (client) => client.organisation)
  clients: ClientBaseEntity[];

  @OneToMany(() => ContratEntity, (contrat) => contrat.organisation)
  contrats: ContratEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
