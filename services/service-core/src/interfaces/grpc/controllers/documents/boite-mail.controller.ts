import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { BoiteMailService } from '../../../../infrastructure/persistence/typeorm/repositories/documents/boite-mail.service';
import { Fournisseur, TypeConnexion, BoiteMailEntity } from '../../../../domain/documents/entities';
import type {
  BoiteMail,
  CreateBoiteMailRequest,
  UpdateBoiteMailRequest,
  GetBoiteMailRequest,
  GetBoiteMailByUtilisateurRequest,
  GetDefaultBoiteMailRequest,
  ListBoiteMailRequest,
  ListBoiteMailByUtilisateurRequest,
  SetDefaultBoiteMailRequest,
  ActivateBoiteMailRequest,
  UpdateOAuthTokensRequest,
  TestConnectionRequest,
  TestConnectionResponse,
  DeleteBoiteMailRequest,
  ListBoiteMailResponse,
  DeleteResponse,
} from '@crm/proto/documents';

@Controller()
export class BoiteMailController {
  constructor(private readonly boiteMailService: BoiteMailService) {}

  @GrpcMethod('BoiteMailService', 'Create')
  async create(data: CreateBoiteMailRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.create({
      ...data,
      serveurSMTP: data.serveurSmtp,
      portSMTP: data.portSmtp,
      serveurIMAP: data.serveurImap,
      portIMAP: data.portImap,
      fournisseur: data.fournisseur as Fournisseur,
      typeConnexion: data.typeConnexion as TypeConnexion,
    });
    return this.mapToProto(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'Update')
  async update(data: UpdateBoiteMailRequest): Promise<BoiteMail> {
    const { id, serveurSmtp, portSmtp, serveurImap, portImap, ...rest } = data;
    const updateData = {
      ...rest,
      serveurSMTP: serveurSmtp,
      portSMTP: portSmtp,
      serveurIMAP: serveurImap,
      portIMAP: portImap,
    };
    const boiteMail = await this.boiteMailService.update(id, updateData);
    return this.mapToProto(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'Get')
  async get(data: GetBoiteMailRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.findById(data.id);
    return this.mapToProto(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'GetByUtilisateur')
  async getByUtilisateur(data: GetBoiteMailByUtilisateurRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.findByUtilisateur(data.utilisateurId);
    return this.mapToProto(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'GetDefault')
  async getDefault(data: GetDefaultBoiteMailRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.findDefault(data.utilisateurId);
    return this.mapToProto(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'List')
  async list(data: ListBoiteMailRequest): Promise<ListBoiteMailResponse> {
    const result = await this.boiteMailService.findAll(
      {
        search: data.search,
        fournisseur: data.fournisseur as Fournisseur,
        actif: data.actif,
      },
      data.pagination,
    );
    return {
      boites: result.data.map((b) => this.mapToProto(b)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('BoiteMailService', 'ListByUtilisateur')
  async listByUtilisateur(data: ListBoiteMailByUtilisateurRequest): Promise<ListBoiteMailResponse> {
    const result = await this.boiteMailService.findByUtilisateurList(
      data.utilisateurId,
      data.actif,
      data.pagination,
    );
    return {
      boites: result.data.map((b) => this.mapToProto(b)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('BoiteMailService', 'SetDefault')
  async setDefault(data: SetDefaultBoiteMailRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.setDefault(data.id, data.utilisateurId);
    return this.mapToProto(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'Activer')
  async activer(data: ActivateBoiteMailRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.activer(data.id);
    return this.mapToProto(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'Desactiver')
  async desactiver(data: ActivateBoiteMailRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.desactiver(data.id);
    return this.mapToProto(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'UpdateOAuthTokens')
  async updateOAuthTokens(data: UpdateOAuthTokensRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.updateOAuthTokens(
      data.id,
      data.accessToken,
      data.refreshToken,
      new Date(data.tokenExpiration),
    );
    return this.mapToProto(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'TestConnection')
  async testConnection(data: TestConnectionRequest): Promise<TestConnectionResponse> {
    return this.boiteMailService.testConnection(data.id);
  }

  @GrpcMethod('BoiteMailService', 'Delete')
  async delete(data: DeleteBoiteMailRequest): Promise<DeleteResponse> {
    const success = await this.boiteMailService.delete(data.id);
    return { success };
  }

  private mapToProto(boite: BoiteMailEntity): BoiteMail {
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
      tokenExpiration: boite.tokenExpiration?.toISOString() || '',
      signatureHtml: boite.signatureHtml || '',
      signatureTexte: boite.signatureTexte || '',
      estParDefaut: boite.estParDefaut || false,
      actif: boite.actif,
      utilisateurId: boite.utilisateurId,
      createdAt: boite.createdAt?.toISOString() || '',
      updatedAt: boite.updatedAt?.toISOString() || '',
    };
  }
}
