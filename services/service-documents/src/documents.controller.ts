import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PieceJointeService } from './modules/piece-jointe/piece-jointe.service';
import { BoiteMailService } from './modules/boite-mail/boite-mail.service';
import { Fournisseur, TypeConnexion } from './modules/boite-mail/entities/boite-mail.entity';
import type {
  PieceJointe,
  CreatePieceJointeRequest,
  UpdatePieceJointeRequest,
  GetPieceJointeRequest,
  ListPieceJointeRequest,
  ListPieceJointeByEntiteRequest,
  DeletePieceJointeRequest,
  ListPieceJointeResponse,
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
} from '@proto/documents/documents';

@Controller()
export class DocumentsController {
  constructor(
    private readonly pieceJointeService: PieceJointeService,
    private readonly boiteMailService: BoiteMailService,
  ) {}

  // ========== PIECE JOINTE SERVICE ==========

  @GrpcMethod('PieceJointeService', 'Create')
  async createPieceJointe(data: CreatePieceJointeRequest): Promise<PieceJointe> {
    const pieceJointe = await this.pieceJointeService.create(data);
    return this.mapPieceJointe(pieceJointe);
  }

  @GrpcMethod('PieceJointeService', 'Update')
  async updatePieceJointe(data: UpdatePieceJointeRequest): Promise<PieceJointe> {
    const { id, ...updateData } = data;
    const pieceJointe = await this.pieceJointeService.update(id, updateData);
    return this.mapPieceJointe(pieceJointe);
  }

  @GrpcMethod('PieceJointeService', 'Get')
  async getPieceJointe(data: GetPieceJointeRequest): Promise<PieceJointe> {
    const pieceJointe = await this.pieceJointeService.findById(data.id);
    return this.mapPieceJointe(pieceJointe);
  }

  @GrpcMethod('PieceJointeService', 'List')
  async listPieceJointe(data: ListPieceJointeRequest): Promise<ListPieceJointeResponse> {
    const result = await this.pieceJointeService.findAll(
      { search: data.search, typeMime: data.typeMime },
      data.pagination,
    );
    return {
      pieces: result.data.map((p) => this.mapPieceJointe(p)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('PieceJointeService', 'ListByEntite')
  async listPieceJointeByEntite(data: ListPieceJointeByEntiteRequest): Promise<ListPieceJointeResponse> {
    const result = await this.pieceJointeService.findByEntite(
      data.entiteType,
      data.entiteId,
      data.pagination,
    );
    return {
      pieces: result.data.map((p) => this.mapPieceJointe(p)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('PieceJointeService', 'Delete')
  async deletePieceJointe(data: DeletePieceJointeRequest): Promise<DeleteResponse> {
    const success = await this.pieceJointeService.delete(data.id);
    return { success };
  }

  // ========== BOITE MAIL SERVICE ==========

  @GrpcMethod('BoiteMailService', 'Create')
  async createBoiteMail(data: CreateBoiteMailRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.create({
      ...data,
      serveurSMTP: data.serveurSmtp,
      portSMTP: data.portSmtp,
      serveurIMAP: data.serveurImap,
      portIMAP: data.portImap,
      fournisseur: data.fournisseur as Fournisseur,
      typeConnexion: data.typeConnexion as TypeConnexion,
    });
    return this.mapBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'Update')
  async updateBoiteMail(data: UpdateBoiteMailRequest): Promise<BoiteMail> {
    const { id, serveurSmtp, portSmtp, serveurImap, portImap, ...rest } = data;
    const updateData = {
      ...rest,
      serveurSMTP: serveurSmtp,
      portSMTP: portSmtp,
      serveurIMAP: serveurImap,
      portIMAP: portImap,
    };
    const boiteMail = await this.boiteMailService.update(id, updateData);
    return this.mapBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'Get')
  async getBoiteMail(data: GetBoiteMailRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.findById(data.id);
    return this.mapBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'GetByUtilisateur')
  async getBoiteMailByUtilisateur(data: GetBoiteMailByUtilisateurRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.findByUtilisateur(data.utilisateurId);
    return this.mapBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'GetDefault')
  async getDefaultBoiteMail(data: GetDefaultBoiteMailRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.findDefault(data.utilisateurId);
    return this.mapBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'List')
  async listBoiteMail(data: ListBoiteMailRequest): Promise<ListBoiteMailResponse> {
    const result = await this.boiteMailService.findAll(
      {
        search: data.search,
        fournisseur: data.fournisseur as Fournisseur,
        actif: data.actif,
      },
      data.pagination,
    );
    return {
      boites: result.data.map((b) => this.mapBoiteMail(b)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('BoiteMailService', 'ListByUtilisateur')
  async listBoiteMailByUtilisateur(data: ListBoiteMailByUtilisateurRequest): Promise<ListBoiteMailResponse> {
    const result = await this.boiteMailService.findByUtilisateurList(
      data.utilisateurId,
      data.actif,
      data.pagination,
    );
    return {
      boites: result.data.map((b) => this.mapBoiteMail(b)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('BoiteMailService', 'SetDefault')
  async setDefaultBoiteMail(data: SetDefaultBoiteMailRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.setDefault(data.id, data.utilisateurId);
    return this.mapBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'Activer')
  async activerBoiteMail(data: ActivateBoiteMailRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.activer(data.id);
    return this.mapBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'Desactiver')
  async desactiverBoiteMail(data: ActivateBoiteMailRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.desactiver(data.id);
    return this.mapBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'UpdateOAuthTokens')
  async updateOAuthTokens(data: UpdateOAuthTokensRequest): Promise<BoiteMail> {
    const boiteMail = await this.boiteMailService.updateOAuthTokens(
      data.id,
      data.accessToken,
      data.refreshToken,
      new Date(data.tokenExpiration),
    );
    return this.mapBoiteMail(boiteMail);
  }

  @GrpcMethod('BoiteMailService', 'TestConnection')
  async testConnection(data: TestConnectionRequest): Promise<TestConnectionResponse> {
    return this.boiteMailService.testConnection(data.id);
  }

  @GrpcMethod('BoiteMailService', 'Delete')
  async deleteBoiteMail(data: DeleteBoiteMailRequest): Promise<DeleteResponse> {
    const success = await this.boiteMailService.delete(data.id);
    return { success };
  }

  // ========== MAPPERS ==========

  private mapPieceJointe(piece: any): PieceJointe {
    return {
      id: piece.id,
      nomFichier: piece.nomFichier,
      url: piece.url,
      typeMime: piece.typeMime || '',
      taille: piece.taille || 0,
      entiteType: piece.entiteType || '',
      entiteId: piece.entiteId || '',
      dateUpload: piece.dateUpload?.toISOString() || '',
      uploadedBy: piece.uploadedBy || '',
      createdAt: piece.createdAt?.toISOString() || '',
      updatedAt: piece.updatedAt?.toISOString() || '',
    };
  }

  private mapBoiteMail(boite: any): BoiteMail {
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
