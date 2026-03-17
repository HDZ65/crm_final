import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CompteType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
  MIXTE = 'MIXTE',
}

/**
 * CompteComptableEntity — Plan Comptable Général (PCG) dynamique
 *
 * Stocke les comptes comptables avec possibilité de personnalisation
 * par société. Les enregistrements avec societeId = NULL servent de
 * valeurs par défaut globales.
 */
@Entity('comptes_comptables')
@Index(['societeId', 'numero'], { unique: true })
export class CompteComptableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'societe_id', type: 'uuid', nullable: true })
  societeId: string | null;

  @Column({ type: 'varchar', length: 10 })
  numero: string;

  @Column({ type: 'varchar', length: 255 })
  libelle: string;

  @Column({
    type: 'enum',
    enum: CompteType,
  })
  type: CompteType;

  @Column({ name: 'journal_type', type: 'varchar', length: 20, nullable: true })
  journalType: string | null;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
