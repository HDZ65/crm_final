import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ExportFormatDefault {
  CSV = 'CSV',
  FEC = 'FEC',
}

/**
 * ExportConfigEntity — Configuration d'export comptable par société
 *
 * Permet de personnaliser les codes journaux, le format par défaut,
 * le séparateur et l'encodage pour chaque filiale/société.
 */
@Entity('export_configs')
export class ExportConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'societe_id', type: 'uuid', unique: true })
  societeId: string;

  @Column({ name: 'journal_vente_code', type: 'varchar', length: 10, default: 'VT' })
  journalVenteCode: string;

  @Column({ name: 'journal_reglement_code', type: 'varchar', length: 10, default: 'BAN' })
  journalReglementCode: string;

  @Column({ name: 'journal_impayes_code', type: 'varchar', length: 10, default: 'IMP' })
  journalImpayesCode: string;

  @Column({
    name: 'format_defaut',
    type: 'enum',
    enum: ExportFormatDefault,
    default: ExportFormatDefault.CSV,
  })
  formatDefaut: ExportFormatDefault;

  @Column({ type: 'varchar', length: 5, default: ';' })
  separator: string;

  @Column({ type: 'varchar', length: 20, default: 'UTF-8' })
  encoding: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
