import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { StatutFactureEntity } from './statut-facture.entity';
import { LigneFactureEntity } from './ligne-facture.entity';

@Entity('facture')
@Index(['organisationId', 'numero'], { unique: true, where: 'numero IS NOT NULL' })
@Index(['organisationId', 'dateEmission'])
@Index(['clientBaseId'])
@Index(['contratId'])
export class FactureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  organisationId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  numero: string | null;

  @Column({ type: 'date' })
  dateEmission: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantHT: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantTTC: number;

  @Column({ type: 'uuid' })
  statutId: string;

  @Column({ type: 'uuid' })
  emissionFactureId: string;

  @Column({ type: 'uuid' })
  clientBaseId: string;

  @Column({ type: 'uuid', nullable: true })
  contratId: string | null;

  @Column({ type: 'uuid' })
  clientPartenaireId: string;

  @Column({ type: 'uuid' })
  adresseFacturationId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => StatutFactureEntity)
  @JoinColumn({ name: 'statut_id' })
  statut: StatutFactureEntity;

  @OneToMany(() => LigneFactureEntity, (ligne) => ligne.facture, { cascade: true })
  lignes: LigneFactureEntity[];

  // Business logic
  estBrouillon(): boolean {
    return this.statut?.code === 'BROUILLON';
  }

  canBeValidated(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.lignes || this.lignes.length === 0) {
      errors.push('Au moins une ligne de facture est requise');
    }

    if (Number(this.montantHT) <= 0) {
      errors.push('Le montant HT doit etre superieur a 0');
    }

    if (!this.estBrouillon()) {
      errors.push('Seules les factures brouillon peuvent etre validees');
    }

    return { valid: errors.length === 0, errors };
  }

  static calculateTotalsFromLines(lignes: LigneFactureEntity[]): {
    montantHT: number;
    montantTTC: number;
  } {
    const montantHT = lignes.reduce((sum, ligne) => sum + Number(ligne.montantHT), 0);
    const montantTTC = lignes.reduce((sum, ligne) => sum + Number(ligne.montantTTC), 0);
    return {
      montantHT: Math.round(montantHT * 100) / 100,
      montantTTC: Math.round(montantTTC * 100) / 100,
    };
  }
}
