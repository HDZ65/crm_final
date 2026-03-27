import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  ActivateBoiteMailRequest,
  BoiteMail,
  CreateBoiteMailRequest,
  DeleteBoiteMailRequest,
  GetBoiteMailByUtilisateurRequest,
  GetBoiteMailRequest,
  GetDefaultBoiteMailRequest,
  ListBoiteMailByUtilisateurRequest,
  ListBoiteMailRequest,
  SetDefaultBoiteMailRequest,
  TestConnectionRequest,
  UpdateBoiteMailRequest,
  UpdateOAuthTokensRequest,
} from '@proto/documents';
import { Fournisseur, TypeConnexion } from '../../../domain/documents/entities';
import { BoiteMailService } from '../../persistence/typeorm/repositories/documents/boite-mail.service';

function toProtoBoiteMail(boite: any): BoiteMail {
  return {
    id: boite.id,
    nom: boite.nom,
    adresseEmail: boite.adresseEmail,
    fournisseur: boite.fournisseur,
    typeConnexion: boite.typeConnexion,
    serveurSmtp: boite.serveurSMTP || '',
    portSmtp: boite.portSMTP || 0,
    serveurImap: boite.serveurIMAP || '',
    portImap: boite.portIMAP || 0,
    utiliseSsl: boite.utiliseSsl || false,
    utiliseTls: boite.utiliseTls || false,
    username: boite.username || '',
    clientId: boite.clientId || '',
    tokenExpiration: boite.tokenExpiration?.toISOString() ?? '',
    signatureHtml: boite.signatureHtml || '',
    signatureTexte: boite.signatureTexte || '',
    estParDefaut: boite.estParDefaut || false,
    actif: boite.actif,
    utilisateurId: boite.utilisateurId,
    createdAt: boite.createdAt?.toISOString() ?? '',
    updatedAt: boite.updatedAt?.toISOString() ?? '',
  };
}

@Controller()
export class BoiteMailController {
  constructor(private readonly boiteMailService: BoiteMailService) {}

  @GrpcMethod('BoiteMailService', 'Create')
  async create(data: CreateBoiteMailRequest) {
    const boiteMail = await this.boiteMailService.create({
      ...data,
      serveurSMTP: data.serveurSmtp,
      portSMTP: data.portSmtp,
      serveurIMAP: data.serveurImap,
      portIMAP: data.portImap,
      fournisseur: data.fournisseur as Fournisseur,
      typeConnexion: data.typeConnexion as TypeConnexion,
    });
    return toProtoBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'Update')
  async update(data: UpdateBoiteMailRequest) {
    const { id, serveurSmtp, portSmtp, serveurImap, portImap, ...rest } = data;
    const updateData = {
      ...rest,
      serveurSMTP: serveurSmtp,
      portSMTP: portSmtp,
      serveurIMAP: serveurImap,
      portIMAP: portImap,
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
    const boiteMail = await this.boiteMailService.findByUtilisateur(data.utilisateurId);
    return toProtoBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'GetDefault')
  async getDefault(data: GetDefaultBoiteMailRequest) {
    const boiteMail = await this.boiteMailService.findDefault(data.utilisateurId);
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
    const result = await this.boiteMailService.findByUtilisateurList(data.utilisateurId, data.actif, data.pagination);
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
    const boiteMail = await this.boiteMailService.setDefault(data.id, data.utilisateurId);
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
      data.accessToken,
      data.refreshToken,
      new Date(data.tokenExpiration),
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
