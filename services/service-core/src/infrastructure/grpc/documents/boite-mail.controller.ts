import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { BoiteMailService } from '../../persistence/typeorm/repositories/documents/boite-mail.service';
import { Fournisseur, TypeConnexion } from '../../../domain/documents/entities';
import type {
  CreateBoiteMailRequest,
  UpdateBoiteMailRequest,
  GetBoiteMailRequest,
  GetBoiteMailByUtilisateurRequest,
  GetDefaultBoiteMailRequest,
  ListBoiteMailRequest,
  ListBoiteMailResponse,
  ListBoiteMailByUtilisateurRequest,
  SetDefaultBoiteMailRequest,
  ActivateBoiteMailRequest,
  UpdateOAuthTokensRequest,
  TestConnectionRequest,
  TestConnectionResponse,
  DeleteBoiteMailRequest,
  BoiteMail,
  DeleteResponse,
} from '@proto/documents';

function toProtoBoiteMail(boite: any): BoiteMail {
  return {
    id: boite.id,
    nom: boite.nom,
    adresse_email: boite.adresseEmail,
    fournisseur: boite.fournisseur,
    type_connexion: boite.typeConnexion,
    serveur_smtp: boite.serveurSMTP || '',
    port_smtp: boite.portSMTP || 0,
    serveur_imap: boite.serveurIMAP || '',
    port_imap: boite.portIMAP || 0,
    utilise_ssl: boite.utiliseSsl || false,
    utilise_tls: boite.utiliseTls || false,
    username: boite.username || '',
    client_id: boite.clientId || '',
    token_expiration: boite.tokenExpiration?.toISOString() ?? '',
    signature_html: boite.signatureHtml || '',
    signature_texte: boite.signatureTexte || '',
    est_par_defaut: boite.estParDefaut || false,
    actif: boite.actif,
    utilisateur_id: boite.utilisateurId,
    created_at: boite.createdAt?.toISOString() ?? '',
    updated_at: boite.updatedAt?.toISOString() ?? '',
  };
}

@Controller()
export class BoiteMailController {
  constructor(private readonly boiteMailService: BoiteMailService) {}

  @GrpcMethod('BoiteMailService', 'Create')
  async create(data: CreateBoiteMailRequest) {
    const boiteMail = await this.boiteMailService.create({
      ...data,
      serveurSMTP: data.serveur_smtp,
      portSMTP: data.port_smtp,
      serveurIMAP: data.serveur_imap,
      portIMAP: data.port_imap,
      fournisseur: data.fournisseur as Fournisseur,
      typeConnexion: data.type_connexion as TypeConnexion,
    });
    return toProtoBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'Update')
  async update(data: UpdateBoiteMailRequest) {
    const { id, serveur_smtp, port_smtp, serveur_imap, port_imap, ...rest } = data;
    const updateData = {
      ...rest,
      serveurSMTP: serveur_smtp,
      portSMTP: port_smtp,
      serveurIMAP: serveur_imap,
      portIMAP: port_imap,
    };
    const boiteMail = await this.boiteMailService.update(id, updateData);
    return toProtoBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'Get')
  async get(data: GetBoiteMailRequest) {
    const boiteMail = await this.boiteMailService.findById(data.id);
    return toProtoBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'GetByUtilisateur')
  async getByUtilisateur(data: GetBoiteMailByUtilisateurRequest) {
    const boiteMail = await this.boiteMailService.findByUtilisateur(data.utilisateur_id);
    return toProtoBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'GetDefault')
  async getDefault(data: GetDefaultBoiteMailRequest) {
    const boiteMail = await this.boiteMailService.findDefault(data.utilisateur_id);
    return toProtoBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'List')
  async list(data: ListBoiteMailRequest) {
    const result = await this.boiteMailService.findAll(
      {
        search: data.search,
        fournisseur: data.fournisseur as Fournisseur,
        actif: data.actif,
      },
      data.pagination,
    );
    return {
      boites: result.data.map((b: any) => toProtoBoiteMail(b)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('BoiteMailService', 'ListByUtilisateur')
  async listByUtilisateur(data: ListBoiteMailByUtilisateurRequest) {
    const result = await this.boiteMailService.findByUtilisateurList(
      data.utilisateur_id,
      data.actif,
      data.pagination,
    );
    return {
      boites: result.data.map((b: any) => toProtoBoiteMail(b)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('BoiteMailService', 'SetDefault')
  async setDefault(data: SetDefaultBoiteMailRequest) {
    const boiteMail = await this.boiteMailService.setDefault(data.id, data.utilisateur_id);
    return toProtoBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'Activer')
  async activer(data: ActivateBoiteMailRequest) {
    const boiteMail = await this.boiteMailService.activer(data.id);
    return toProtoBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'Desactiver')
  async desactiver(data: ActivateBoiteMailRequest) {
    const boiteMail = await this.boiteMailService.desactiver(data.id);
    return toProtoBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'UpdateOAuthTokens')
  async updateOAuthTokens(data: UpdateOAuthTokensRequest) {
    const boiteMail = await this.boiteMailService.updateOAuthTokens(
      data.id,
      data.access_token,
      data.refresh_token,
      new Date(data.token_expiration),
    );
    return toProtoBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'TestConnection')
  async testConnection(data: TestConnectionRequest) {
    return this.boiteMailService.testConnection(data.id);
  }

  @GrpcMethod('BoiteMailService', 'Delete')
  async delete(data: DeleteBoiteMailRequest) {
    const success = await this.boiteMailService.delete(data.id);
    return { success };
  }
}
