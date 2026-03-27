import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  CreatePieceJointeRequest,
  DeletePieceJointeRequest,
  GetPieceJointeRequest,
  GetVersionHistoryRequest,
  ListPieceJointeByEntiteRequest,
  ListPieceJointeByTypeRequest,
  ListPieceJointeRequest,
  LogDocumentAccessRequest,
  LogDocumentAccessResponse,
  UpdatePieceJointeRequest,
} from '@proto/documents';
import { PieceJointeEntity } from '../../../domain/documents/entities';
import { PieceJointeService } from '../../persistence/typeorm/repositories/documents/piece-jointe.service';

@Controller()
export class PieceJointeController {
  constructor(private readonly pieceJointeService: PieceJointeService) {}

  private mapPieceToProto(p: PieceJointeEntity): Record<string, unknown> {
    return {
      ...p,
      typeMime: p.typeMime || '',
      taille: p.taille || 0,
      entiteType: p.entiteType || '',
      entiteId: p.entiteId || '',
      dateUpload: p.dateUpload?.toISOString() ?? '',
      uploadedBy: p.uploadedBy || '',
      createdAt: p.createdAt?.toISOString() ?? '',
      updatedAt: p.updatedAt?.toISOString() ?? '',
      typeDocument: p.typeDocument ?? 0,
      version: p.version ?? 1,
      parentId: p.parentId || '',
      hashSha256: p.hashSha256 || '',
      organisationId: p.keycloakGroupId || '',
    };
  }

  @GrpcMethod('PieceJointeService', 'Create')
  async create(data: CreatePieceJointeRequest) {
    const piece = await this.pieceJointeService.create({ ...data, taille: Number(data.taille) } as any);
    return this.mapPieceToProto(piece);
  }
  @GrpcMethod('PieceJointeService', 'Update')
  async update(data: UpdatePieceJointeRequest) {
    const { id, ...updateData } = data;
    const piece = await this.pieceJointeService.update(id, updateData);
    return this.mapPieceToProto(piece);
  }
  @GrpcMethod('PieceJointeService', 'Get')
  async get(data: GetPieceJointeRequest) {
    const piece = await this.pieceJointeService.findById(data.id);
    return this.mapPieceToProto(piece);
  }
  @GrpcMethod('PieceJointeService', 'List')
  async list(data: ListPieceJointeRequest) {
    const result = await this.pieceJointeService.findAll(
      { search: data.search, typeMime: data.typeMime },
      data.pagination,
    );
    return {
      pieces: result.data.map((p: PieceJointeEntity) => this.mapPieceToProto(p)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
  @GrpcMethod('PieceJointeService', 'ListByEntite')
  async listByEntite(data: ListPieceJointeByEntiteRequest) {
    const result = await this.pieceJointeService.findByEntite(data.entiteType, data.entiteId, data.pagination);
    return {
      pieces: result.data.map((p: PieceJointeEntity) => this.mapPieceToProto(p)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
  @GrpcMethod('PieceJointeService', 'Delete')
  async delete(data: DeletePieceJointeRequest) {
    const success = await this.pieceJointeService.delete(data.id);
    return { success };
  }

  @GrpcMethod('PieceJointeService', 'ListByType')
  async listByType(data: ListPieceJointeByTypeRequest) {
    const result = await this.pieceJointeService.findByType(
      data.organisationId,
      data.typeDocument,
      data.entiteType || undefined,
      data.pagination,
    );
    return {
      pieces: result.data.map((p: PieceJointeEntity) => this.mapPieceToProto(p)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('PieceJointeService', 'GetVersionHistory')
  async getVersionHistory(data: GetVersionHistoryRequest) {
    const pieces = await this.pieceJointeService.findVersionHistory(data.parentId);
    return {
      pieces: pieces.map((p: PieceJointeEntity) => this.mapPieceToProto(p)),
      pagination: {
        total: pieces.length,
        page: 1,
        limit: pieces.length,
        totalPages: 1,
      },
    };
  }

  @GrpcMethod('PieceJointeService', 'LogAccess')
  async logAccess(data: LogDocumentAccessRequest): Promise<LogDocumentAccessResponse> {
    const log = await this.pieceJointeService.logAccess({
      documentId: data.documentId,
      keycloakGroupId: data.organisationId,
      action: data.action,
      userId: data.userId || undefined,
      userName: data.userName || undefined,
      ipAddress: data.ipAddress || undefined,
    });
    return {
      success: true,
      log: {
        id: log.id,
        documentId: log.documentId,
        organisationId: log.keycloakGroupId,
        action: log.action,
        userId: log.userId || '',
        userName: log.userName || '',
        ipAddress: log.ipAddress || '',
        timestamp: log.timestamp?.toISOString() ?? '',
      },
    };
  }
}
