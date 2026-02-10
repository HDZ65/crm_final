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
} from '@proto/documents';

@Controller()
export class PieceJointeController {
  constructor(private readonly pieceJointeService: PieceJointeService) {}

  @GrpcMethod('PieceJointeService', 'Create')
  async create(data: CreatePieceJointeRequest) {
    const piece = await this.pieceJointeService.create(data);
    return {
      ...piece,
      typeMime: piece.typeMime || '',
      taille: piece.taille || 0,
      entiteType: piece.entiteType || '',
      entiteId: piece.entiteId || '',
      dateUpload: piece.dateUpload?.toISOString() ?? '',
      uploadedBy: piece.uploadedBy || '',
      createdAt: piece.createdAt?.toISOString() ?? '',
      updatedAt: piece.updatedAt?.toISOString() ?? '',
    };
  }

  @GrpcMethod('PieceJointeService', 'Update')
  async update(data: UpdatePieceJointeRequest) {
    const { id, ...updateData } = data;
    const piece = await this.pieceJointeService.update(id, updateData);
    return {
      ...piece,
      typeMime: piece.typeMime || '',
      taille: piece.taille || 0,
      entiteType: piece.entiteType || '',
      entiteId: piece.entiteId || '',
      dateUpload: piece.dateUpload?.toISOString() ?? '',
      uploadedBy: piece.uploadedBy || '',
      createdAt: piece.createdAt?.toISOString() ?? '',
      updatedAt: piece.updatedAt?.toISOString() ?? '',
    };
  }

  @GrpcMethod('PieceJointeService', 'Get')
  async get(data: GetPieceJointeRequest) {
    const piece = await this.pieceJointeService.findById(data.id);
    return {
      ...piece,
      typeMime: piece.typeMime || '',
      taille: piece.taille || 0,
      entiteType: piece.entiteType || '',
      entiteId: piece.entiteId || '',
      dateUpload: piece.dateUpload?.toISOString() ?? '',
      uploadedBy: piece.uploadedBy || '',
      createdAt: piece.createdAt?.toISOString() ?? '',
      updatedAt: piece.updatedAt?.toISOString() ?? '',
    };
  }

  @GrpcMethod('PieceJointeService', 'List')
  async list(data: ListPieceJointeRequest) {
    const result = await this.pieceJointeService.findAll(
      { search: data.search, typeMime: data.type_mime },
      data.pagination,
    );
    return {
      pieces: result.data.map((p: any) => ({
        ...p,
        typeMime: p.typeMime || '',
        taille: p.taille || 0,
        entiteType: p.entiteType || '',
        entiteId: p.entiteId || '',
        dateUpload: p.dateUpload?.toISOString() ?? '',
        uploadedBy: p.uploadedBy || '',
        createdAt: p.createdAt?.toISOString() ?? '',
        updatedAt: p.updatedAt?.toISOString() ?? '',
      })),
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
      pieces: result.data.map((p: any) => ({
        ...p,
        typeMime: p.typeMime || '',
        taille: p.taille || 0,
        entiteType: p.entiteType || '',
        entiteId: p.entiteId || '',
        dateUpload: p.dateUpload?.toISOString() ?? '',
        uploadedBy: p.uploadedBy || '',
        createdAt: p.createdAt?.toISOString() ?? '',
        updatedAt: p.updatedAt?.toISOString() ?? '',
      })),
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
}
