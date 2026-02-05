import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PieceJointeService } from '../../../../infrastructure/persistence/typeorm/repositories/documents/piece-jointe.service';
import { PieceJointeEntity } from '../../../../domain/documents/entities';
import type {
  PieceJointe,
  CreatePieceJointeRequest,
  UpdatePieceJointeRequest,
  GetPieceJointeRequest,
  ListPieceJointeRequest,
  ListPieceJointeByEntiteRequest,
  DeletePieceJointeRequest,
  ListPieceJointeResponse,
  DeleteResponse,
} from '@crm/proto/documents';

@Controller()
export class PieceJointeController {
  constructor(private readonly pieceJointeService: PieceJointeService) {}

  @GrpcMethod('PieceJointeService', 'Create')
  async create(data: CreatePieceJointeRequest): Promise<PieceJointe> {
    const pieceJointe = await this.pieceJointeService.create(data);
    return this.mapToProto(pieceJointe);
  }

  @GrpcMethod('PieceJointeService', 'Update')
  async update(data: UpdatePieceJointeRequest): Promise<PieceJointe> {
    const { id, ...updateData } = data;
    const pieceJointe = await this.pieceJointeService.update(id, updateData);
    return this.mapToProto(pieceJointe);
  }

  @GrpcMethod('PieceJointeService', 'Get')
  async get(data: GetPieceJointeRequest): Promise<PieceJointe> {
    const pieceJointe = await this.pieceJointeService.findById(data.id);
    return this.mapToProto(pieceJointe);
  }

  @GrpcMethod('PieceJointeService', 'List')
  async list(data: ListPieceJointeRequest): Promise<ListPieceJointeResponse> {
    const result = await this.pieceJointeService.findAll(
      { search: data.search, typeMime: data.typeMime },
      data.pagination,
    );
    return {
      pieces: result.data.map((p) => this.mapToProto(p)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('PieceJointeService', 'ListByEntite')
  async listByEntite(data: ListPieceJointeByEntiteRequest): Promise<ListPieceJointeResponse> {
    const result = await this.pieceJointeService.findByEntite(
      data.entiteType,
      data.entiteId,
      data.pagination,
    );
    return {
      pieces: result.data.map((p) => this.mapToProto(p)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('PieceJointeService', 'Delete')
  async delete(data: DeletePieceJointeRequest): Promise<DeleteResponse> {
    const success = await this.pieceJointeService.delete(data.id);
    return { success };
  }

  private mapToProto(piece: PieceJointeEntity): PieceJointe {
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
}
