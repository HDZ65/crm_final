import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PieceJointeService } from '../../persistence/typeorm/repositories/documents/piece-jointe.service';
import type {
  CreatePieceJointeRequest,
  UpdatePieceJointeRequest,
  GetPieceJointeRequest,
  ListPieceJointeRequest,
  ListPieceJointeResponse,
  ListPieceJointeByEntiteRequest,
  DeletePieceJointeRequest,
  PieceJointe,
  DeleteResponse,
  ListPieceJointeByTypeRequest,
  GetVersionHistoryRequest,
  LogDocumentAccessRequest,
  LogDocumentAccessResponse,
} from '@proto/documents';
import { PieceJointeEntity } from '../../../domain/documents/entities';

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
      type_document: p.typeDocument ?? 0,
      version: p.version ?? 1,
      parent_id: p.parentId || '',
      hash_sha256: p.hashSha256 || '',
      organisation_id: p.organisationId || '',
    };
  }

  @GrpcMethod('PieceJointeService', 'Create')
  async create(data: CreatePieceJointeRequest) {
    const piece = await this.pieceJointeService.create(data);
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
      { search: data.search, typeMime: data.type_mime },
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
    const result = await this.pieceJointeService.findByEntite(
      data.entite_type,
      data.entite_id,
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
  @GrpcMethod('PieceJointeService', 'Delete')
  async delete(data: DeletePieceJointeRequest) {
    const success = await this.pieceJointeService.delete(data.id);
    return { success };
  }

  @GrpcMethod('PieceJointeService', 'ListByType')
  async listByType(data: ListPieceJointeByTypeRequest) {
    const result = await this.pieceJointeService.findByType(
      data.organisation_id,
      data.type_document,
      data.entite_type || undefined,
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
    const pieces = await this.pieceJointeService.findVersionHistory(data.parent_id);
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
      documentId: data.document_id,
      organisationId: data.organisation_id,
      action: data.action,
      userId: data.user_id || undefined,
      userName: data.user_name || undefined,
      ipAddress: data.ip_address || undefined,
    });
    return {
      success: true,
      log: {
        id: log.id,
        document_id: log.documentId,
        organisation_id: log.organisationId,
        action: log.action,
        user_id: log.userId || '',
        user_name: log.userName || '',
        ip_address: log.ipAddress || '',
        timestamp: log.timestamp?.toISOString() ?? '',
      },
    };
  }
}
