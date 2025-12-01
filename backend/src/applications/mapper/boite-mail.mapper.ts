import { BoiteMailEntity as BoiteMailDomainEntity } from '../../core/domain/boite-mail.entity';
import type { BoiteMailEntity as BoiteMailOrmEntity } from '../../infrastructure/db/entities/boite-mail.entity';

export class BoiteMailMapper {
  static toDomain(ormEntity: BoiteMailOrmEntity): BoiteMailDomainEntity {
    return new BoiteMailDomainEntity({
      id: ormEntity.id,
      nom: ormEntity.nom,
      adresseEmail: ormEntity.adresseEmail,
      fournisseur: ormEntity.fournisseur,
      typeConnexion: ormEntity.typeConnexion,
      serveurSMTP: ormEntity.serveurSMTP,
      portSMTP: ormEntity.portSMTP,
      serveurIMAP: ormEntity.serveurIMAP,
      portIMAP: ormEntity.portIMAP,
      utiliseSsl: ormEntity.utiliseSsl,
      utiliseTls: ormEntity.utiliseTls,
      username: ormEntity.username,
      motDePasse: ormEntity.motDePasse,
      clientId: ormEntity.clientId,
      clientSecret: ormEntity.clientSecret,
      refreshToken: ormEntity.refreshToken,
      accessToken: ormEntity.accessToken,
      tokenExpiration: ormEntity.tokenExpiration,
      signatureHtml: ormEntity.signatureHtml,
      signatureTexte: ormEntity.signatureTexte,
      estParDefaut: ormEntity.estParDefaut,
      actif: ormEntity.actif,
      utilisateurId: ormEntity.utilisateurId,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(
    domainEntity: BoiteMailDomainEntity,
  ): Partial<BoiteMailOrmEntity> {
    return {
      id: domainEntity.id,
      nom: domainEntity.nom,
      adresseEmail: domainEntity.adresseEmail,
      fournisseur: domainEntity.fournisseur,
      typeConnexion: domainEntity.typeConnexion,
      serveurSMTP: domainEntity.serveurSMTP,
      portSMTP: domainEntity.portSMTP,
      serveurIMAP: domainEntity.serveurIMAP,
      portIMAP: domainEntity.portIMAP,
      utiliseSsl: domainEntity.utiliseSsl,
      utiliseTls: domainEntity.utiliseTls,
      username: domainEntity.username,
      motDePasse: domainEntity.motDePasse,
      clientId: domainEntity.clientId,
      clientSecret: domainEntity.clientSecret,
      refreshToken: domainEntity.refreshToken,
      accessToken: domainEntity.accessToken,
      tokenExpiration: domainEntity.tokenExpiration,
      signatureHtml: domainEntity.signatureHtml,
      signatureTexte: domainEntity.signatureTexte,
      estParDefaut: domainEntity.estParDefaut,
      actif: domainEntity.actif,
      utilisateurId: domainEntity.utilisateurId,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
    };
  }
}
