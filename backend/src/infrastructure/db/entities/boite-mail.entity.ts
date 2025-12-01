import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UtilisateurEntity } from './utilisateur.entity';
import { EncryptedColumnTransformer } from '../transformers/encrypted-column.transformer';

@Entity('boites_mail')
export class BoiteMailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column()
  adresseEmail: string;

  @Column()
  fournisseur: string;

  @Column()
  typeConnexion: string;

  // Configuration SMTP/IMAP
  @Column({ type: 'varchar', nullable: true })
  serveurSMTP?: string | null;

  @Column({ type: 'int', nullable: true })
  portSMTP?: number | null;

  @Column({ type: 'varchar', nullable: true })
  serveurIMAP?: string | null;

  @Column({ type: 'int', nullable: true })
  portIMAP?: number | null;

  @Column({ default: false })
  utiliseSsl?: boolean;

  @Column({ default: false })
  utiliseTls?: boolean;

  // Credentials - Chiffrés via EncryptedColumnTransformer
  @Column({ type: 'varchar', nullable: true })
  username?: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    transformer: EncryptedColumnTransformer,
  })
  motDePasse?: string | null;

  // OAuth2 configuration - Tokens chiffrés
  @Column({ type: 'varchar', nullable: true })
  clientId?: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    transformer: EncryptedColumnTransformer,
  })
  clientSecret?: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: EncryptedColumnTransformer,
  })
  refreshToken?: string | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: EncryptedColumnTransformer,
  })
  accessToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiration?: Date | null;

  // Signature
  @Column({ type: 'text', nullable: true })
  signatureHtml?: string | null;

  @Column({ type: 'text', nullable: true })
  signatureTexte?: string | null;

  // Paramètres
  @Column({ default: false })
  estParDefaut: boolean;

  @Column({ default: true })
  actif: boolean;

  @Column()
  utilisateurId: string;

  @ManyToOne(() => UtilisateurEntity)
  @JoinColumn({ name: 'utilisateurId' })
  utilisateur: UtilisateurEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
