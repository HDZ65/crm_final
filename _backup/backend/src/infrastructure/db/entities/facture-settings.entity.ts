import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SocieteEntity } from './societe.entity';

@Entity('facture_settings')
@Index(['societeId'], { unique: true })
export class FactureSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  societeId: string;

  @ManyToOne(() => SocieteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'societeId' })
  societe: SocieteEntity;

  // Branding
  @Column({ type: 'text', nullable: true })
  logoBase64: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  logoMimeType: string | null;

  @Column({ type: 'varchar', length: 7, default: '#000000' })
  primaryColor: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  secondaryColor: string | null;

  // Informations entreprise
  @Column({ type: 'varchar', length: 255, nullable: true })
  companyName: string | null;

  @Column({ type: 'text', nullable: true })
  companyAddress: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  companyPhone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyEmail: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  companySiret: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  companyTvaNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  companyRcs: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  companyCapital: string | null;

  // Coordonnées bancaires
  @Column({ type: 'varchar', length: 34, nullable: true })
  iban: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  bic: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankName: string | null;

  // Textes personnalisés
  @Column({ type: 'text', nullable: true })
  headerText: string | null;

  @Column({ type: 'text', nullable: true })
  footerText: string | null;

  @Column({ type: 'text', nullable: true })
  legalMentions: string | null;

  @Column({ type: 'text', nullable: true })
  paymentTerms: string | null;

  // Paramètres
  @Column({ type: 'varchar', length: 20, nullable: true })
  invoicePrefix: string | null;

  @Column({ default: true })
  showLogo: boolean;

  @Column({ type: 'varchar', length: 10, default: 'left' })
  logoPosition: 'left' | 'center' | 'right';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
