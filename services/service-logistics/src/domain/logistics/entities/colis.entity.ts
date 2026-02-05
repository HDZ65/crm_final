import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('colis')
export class ColisEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'expedition_id' })
  @Index()
  expeditionId: string;

  @Column({ name: 'poids_gr' })
  poidsGr: number;

  @Column({ name: 'long_cm' })
  longCm: number;

  @Column({ name: 'larg_cm' })
  largCm: number;

  @Column({ name: 'haut_cm' })
  hautCm: number;

  @Column({ name: 'valeur_declaree', type: 'decimal', precision: 10, scale: 2 })
  valeurDeclaree: number;

  @Column()
  contenu: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business methods
  getVolumeM3(): number {
    return (this.longCm * this.largCm * this.hautCm) / 1_000_000;
  }

  getPoidsKg(): number {
    return this.poidsGr / 1000;
  }
}
