import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type LogoPosition = 'left' | 'center' | 'right';

@Entity('facture_settings')
@Index(['societeId'], { unique: true })
export class FactureSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  societeId: string;

  // Branding
  @Column({ type: 'text', nullable: true })
  logoBase64: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  logoMimeType: string | null;

  @Column({ length: 7, default: '#000000' })
  primaryColor: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  secondaryColor: string | null;

  // Company info
  @Column({ type: 'varchar', length: 200, nullable: true })
  companyName: string | null;

  @Column({ type: 'text', nullable: true })
  companyAddress: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  companyPhone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  companyEmail: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  companySiret: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  companyTvaNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  companyRcs: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  companyCapital: string | null;

  // Bank details
  @Column({ type: 'varchar', length: 34, nullable: true })
  iban: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  bic: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankName: string | null;

  // Custom texts
  @Column({ type: 'text', nullable: true })
  headerText: string | null;

  @Column({ type: 'text', nullable: true })
  footerText: string | null;

  @Column({ type: 'text', nullable: true })
  legalMentions: string | null;

  @Column({ type: 'text', nullable: true })
  paymentTerms: string | null;

  // Settings
  @Column({ type: 'varchar', length: 20, nullable: true })
  invoicePrefix: string | null;

  @Column({ default: true })
  showLogo: boolean;

  @Column({ length: 10, default: 'left' })
  logoPosition: LogoPosition;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business logic
  hasLogo(): boolean {
    return !!(this.logoBase64 && this.logoMimeType);
  }

  hasBankDetails(): boolean {
    return !!(this.iban && this.bic);
  }

  getLogoDataUrl(): string | null {
    if (!this.hasLogo()) return null;
    return `data:${this.logoMimeType};base64,${this.logoBase64}`;
  }
}
