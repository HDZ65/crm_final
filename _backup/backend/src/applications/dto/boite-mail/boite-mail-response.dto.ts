import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { BoiteMailEntity } from '../../../core/domain/boite-mail.entity';

export class BoiteMailDto {
  @ApiProperty({ description: 'ID unique de la boîte mail' })
  id: string;

  @ApiProperty({ description: 'Nom de la boîte mail' })
  nom: string;

  @ApiProperty({ description: 'Adresse email' })
  adresseEmail: string;

  @ApiProperty({
    description: 'Fournisseur de messagerie',
    enum: ['gmail', 'outlook', 'smtp', 'exchange', 'other'],
  })
  fournisseur: string;

  @ApiProperty({
    description: 'Type de connexion',
    enum: ['oauth2', 'smtp', 'imap'],
  })
  typeConnexion: string;

  @ApiPropertyOptional({ description: 'Serveur SMTP' })
  serveurSMTP?: string | null;

  @ApiPropertyOptional({ description: 'Port SMTP' })
  portSMTP?: number | null;

  @ApiPropertyOptional({ description: 'Serveur IMAP' })
  serveurIMAP?: string | null;

  @ApiPropertyOptional({ description: 'Port IMAP' })
  portIMAP?: number | null;

  @ApiPropertyOptional({ description: 'Utilise SSL' })
  utiliseSsl?: boolean;

  @ApiPropertyOptional({ description: 'Utilise TLS' })
  utiliseTls?: boolean;

  @ApiPropertyOptional({ description: 'Signature au format HTML' })
  signatureHtml?: string | null;

  @ApiPropertyOptional({ description: 'Signature au format texte' })
  signatureTexte?: string | null;

  @ApiProperty({ description: 'Boîte mail par défaut' })
  estParDefaut: boolean;

  @ApiProperty({ description: 'Boîte mail active' })
  actif: boolean;

  @ApiProperty({ description: "ID de l'utilisateur propriétaire" })
  utilisateurId: string;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière modification' })
  updatedAt: Date;

  constructor(entity: BoiteMailEntity) {
    this.id = entity.id;
    this.nom = entity.nom;
    this.adresseEmail = entity.adresseEmail;
    this.fournisseur = entity.fournisseur;
    this.typeConnexion = entity.typeConnexion;
    this.serveurSMTP = entity.serveurSMTP;
    this.portSMTP = entity.portSMTP;
    this.serveurIMAP = entity.serveurIMAP;
    this.portIMAP = entity.portIMAP;
    this.utiliseSsl = entity.utiliseSsl;
    this.utiliseTls = entity.utiliseTls;
    this.signatureHtml = entity.signatureHtml;
    this.signatureTexte = entity.signatureTexte;
    this.estParDefaut = entity.estParDefaut;
    this.actif = entity.actif;
    this.utilisateurId = entity.utilisateurId;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
    // Note: On n'expose PAS les credentials (password, tokens) dans la réponse
  }
}
