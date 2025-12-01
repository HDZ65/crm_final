import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AdresseEntity } from './adresse.entity';
import { OrganisationEntity } from './organisation.entity';
import { ClientBaseEntity } from './client-base.entity';
import { ContratEntity } from './contrat.entity';
import { ClientPartenaireEntity } from './client-partenaire.entity';
import { EmissionFactureEntity } from './emission-facture.entity';
import { StatutFactureEntity } from './statut-facture.entity';

@Entity('factures')
export class FactureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organisationId: string;

  @ManyToOne(() => OrganisationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation: OrganisationEntity;

  @Column()
  numero: string;

  @Column()
  dateEmission: string;

  @Column()
  montantHT: number;

  @Column()
  montantTTC: number;

  @Column()
  statutId: string;

  @ManyToOne(() => StatutFactureEntity)
  @JoinColumn({ name: 'statutId' })
  statut: StatutFactureEntity;

  @Column()
  emissionFactureId: string;

  @ManyToOne(() => EmissionFactureEntity)
  @JoinColumn({ name: 'emissionFactureId' })
  emission: EmissionFactureEntity;

  @Column()
  clientBaseId: string;

  @ManyToOne(() => ClientBaseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientBaseId' })
  client: ClientBaseEntity;

  @Column({ nullable: true })
  contratId: string | null;

  @ManyToOne(() => ContratEntity, { nullable: true })
  @JoinColumn({ name: 'contratId' })
  contrat: ContratEntity | null;

  @Column()
  clientPartenaireId: string;

  @ManyToOne(() => ClientPartenaireEntity)
  @JoinColumn({ name: 'clientPartenaireId' })
  clientPartenaire: ClientPartenaireEntity;

  @Column()
  adresseFacturationId: string;

  @ManyToOne(() => AdresseEntity)
  @JoinColumn({ name: 'adresseFacturationId' })
  adresseFacturation: AdresseEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
