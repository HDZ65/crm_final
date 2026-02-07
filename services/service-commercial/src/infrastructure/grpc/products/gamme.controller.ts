import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { GammeService } from '../../persistence/typeorm/repositories/products/gamme.service';
import { GammeEntity, TypeGamme } from '../../../domain/products';

@Controller()
export class GammeController {
  constructor(private readonly gammeService: GammeService) {}

  @GrpcMethod('GammeService', 'Create')
  async create(data: any): Promise<any> {
    try {
      const gamme = await this.gammeService.create({
        organisationId: data.organisation_id,
        nom: data.nom,
        description: data.description,
        icone: data.icone,
        code: data.code,
        ordre: data.ordre || 0,
        parentId: data.parent_id || null,
        typeGamme: data.type_gamme || TypeGamme.FAMILLE,
        niveau: data.niveau || 0,
      });

      return this.mapToProto(gamme);
    } catch (error) {
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('GammeService', 'Update')
  async update(data: any): Promise<any> {
    try {
      const gamme = await this.gammeService.findById(data.id);
      if (!gamme) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Gamme not found',
        });
      }

      // Vérifier les cycles si parent_id est modifié
      if (data.parent_id !== undefined && data.parent_id !== gamme.parentId) {
        const hasCycle = await this.gammeService.hasCycle(data.id, data.parent_id);
        if (hasCycle) {
          throw new RpcException({
            code: status.INVALID_ARGUMENT,
            message: 'Cannot create cycle in hierarchy',
          });
        }

        // Vérifier la profondeur maximale
        const depth = await this.gammeService.getDepth(data.parent_id);
        if (depth >= 3) {
          throw new RpcException({
            code: status.INVALID_ARGUMENT,
            message: 'Maximum hierarchy depth (3 levels) exceeded',
          });
        }
      }

      const updated = await this.gammeService.update(data.id, {
        nom: data.nom !== undefined ? data.nom : gamme.nom,
        description: data.description !== undefined ? data.description : gamme.description,
        icone: data.icone !== undefined ? data.icone : gamme.icone,
        code: data.code !== undefined ? data.code : gamme.code,
        ordre: data.ordre !== undefined ? data.ordre : gamme.ordre,
        actif: data.actif !== undefined ? data.actif : gamme.actif,
        parentId: data.parent_id !== undefined ? data.parent_id : gamme.parentId,
      });

      return this.mapToProto(updated);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('GammeService', 'Get')
  async get(data: any): Promise<any> {
    try {
      const gamme = await this.gammeService.findById(data.id);
      if (!gamme) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Gamme not found',
        });
      }
      return this.mapToProto(gamme);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('GammeService', 'List')
  async list(data: any): Promise<any> {
    try {
      const gammes = await this.gammeService.findByOrganisation(data.organisation_id);
      return {
        gammes: gammes.map((g) => this.mapToProto(g)),
        pagination: {
          total: gammes.length,
          page: 1,
          limit: gammes.length,
          total_pages: 1,
        },
      };
    } catch (error) {
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('GammeService', 'Delete')
  async delete(data: any): Promise<any> {
    try {
      const success = await this.gammeService.delete(data.id);
      return { success };
    } catch (error) {
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('GammeService', 'GetTree')
  async getTree(data: any): Promise<any> {
    try {
      const roots = await this.gammeService.buildTree(data.organisation_id, data.parent_id);
      return { roots };
    } catch (error) {
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  private mapToProto(gamme: GammeEntity): any {
    return {
      id: gamme.id,
      organisation_id: gamme.organisationId,
      nom: gamme.nom,
      description: gamme.description || '',
      icone: gamme.icone || '',
      code: gamme.code,
      ordre: gamme.ordre,
      actif: gamme.actif,
      parent_id: gamme.parentId || '',
      niveau: gamme.niveau,
      type_gamme: gamme.typeGamme,
      created_at: gamme.createdAt?.toISOString() || '',
      updated_at: gamme.updatedAt?.toISOString() || '',
    };
  }
}
