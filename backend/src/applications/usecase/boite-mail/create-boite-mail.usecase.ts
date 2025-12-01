import { Injectable, Inject } from '@nestjs/common';
import { BoiteMailEntity } from '../../../core/domain/boite-mail.entity';
import type { BoiteMailRepositoryPort } from '../../../core/port/boite-mail-repository.port';
import type { CreateBoiteMailDto } from '../../dto/boite-mail/create-boite-mail.dto';

@Injectable()
export class CreateBoiteMailUseCase {
  constructor(
    @Inject('BoiteMailRepositoryPort')
    private readonly repository: BoiteMailRepositoryPort,
  ) {}

  async execute(dto: CreateBoiteMailDto): Promise<BoiteMailEntity> {
    const entity = new BoiteMailEntity({
      nom: dto.nom,
      adresseEmail: dto.adresseEmail,
      fournisseur: dto.fournisseur,
      typeConnexion: dto.typeConnexion,
      serveurSMTP: dto.serveurSMTP,
      portSMTP: dto.portSMTP,
      serveurIMAP: dto.serveurIMAP,
      portIMAP: dto.portIMAP,
      utiliseSsl: dto.utiliseSsl,
      utiliseTls: dto.utiliseTls,
      username: dto.username,
      motDePasse: dto.motDePasse,
      clientId: dto.clientId,
      clientSecret: dto.clientSecret,
      refreshToken: dto.refreshToken,
      signatureHtml: dto.signatureHtml,
      signatureTexte: dto.signatureTexte,
      estParDefaut: dto.estParDefaut,
      actif: dto.actif,
      utilisateurId: dto.utilisateurId,
    });

    return await this.repository.create(entity);
  }
}
