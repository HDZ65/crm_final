import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { FormuleProduitService } from '../../persistence/typeorm/repositories/products/formule-produit.service';
import { FormuleProduitEntity } from '../../../domain/products/entities/formule-produit.entity';
import { FranchiseType, TypeAjustementPrix } from '../../../domain/products/enums';

@Controller()
export class FormuleProduitController {
  constructor(private readonly formuleProduitService: FormuleProduitService) {}

  @GrpcMethod('FormuleProduitService', 'Create')
  async create(data: any): Promise<any> {
    try {
      const entity = new FormuleProduitEntity();
      entity.produitId = data.produit_id;
      entity.code = data.code;
      entity.nom = data.nom;
      entity.description = data.description || null;
      entity.ordre = data.ordre || 0;
      entity.garanties = data.garanties || null;
      entity.options = data.options || null;
      entity.franchiseMontant = data.franchise_montant || null;
      entity.franchiseType = data.franchise_type || null;
      entity.prixFormule = data.prix_formule || null;
      entity.typeAjustementPrix = data.type_ajustement_prix || null;
      entity.versionProduitId = data.version_produit_id || null;
      entity.metadata = data.metadata ? JSON.parse(data.metadata) : null;
      entity.actif = true;

      const formule = await this.formuleProduitService.save(entity);
      return this.mapToProto(formule);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('FormuleProduitService', 'Update')
  async update(data: any): Promise<any> {
    try {
      const formule = await this.formuleProduitService.findById(data.id);
      if (!formule) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'FormuleProduit not found',
        });
      }

      const updated = await this.formuleProduitService.update(data.id, {
        code: data.code !== undefined ? data.code : formule.code,
        nom: data.nom !== undefined ? data.nom : formule.nom,
        description: data.description !== undefined ? data.description : formule.description,
        ordre: data.ordre !== undefined ? data.ordre : formule.ordre,
        garanties: data.garanties !== undefined ? data.garanties : formule.garanties,
        options: data.options !== undefined ? data.options : formule.options,
        franchiseMontant: data.franchise_montant !== undefined ? data.franchise_montant : formule.franchiseMontant,
        franchiseType: data.franchise_type !== undefined ? data.franchise_type : formule.franchiseType,
        prixFormule: data.prix_formule !== undefined ? data.prix_formule : formule.prixFormule,
        typeAjustementPrix: data.type_ajustement_prix !== undefined ? data.type_ajustement_prix : formule.typeAjustementPrix,
        actif: data.actif !== undefined ? data.actif : formule.actif,
        metadata: data.metadata !== undefined ? (data.metadata ? JSON.parse(data.metadata) : null) : formule.metadata,
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

  @GrpcMethod('FormuleProduitService', 'Get')
  async get(data: any): Promise<any> {
    try {
      const formule = await this.formuleProduitService.findById(data.id);
      if (!formule) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'FormuleProduit not found',
        });
      }
      return this.mapToProto(formule);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('FormuleProduitService', 'ListByProduit')
  async listByProduit(data: any): Promise<any> {
    try {
      let formules = await this.formuleProduitService.findByProduit(data.produit_id);
      
      // Filter by actif if provided
      if (data.actif !== undefined) {
        formules = formules.filter((f) => f.actif === data.actif);
      }

      return {
        formules: formules.map((f) => this.mapToProto(f)),
        pagination: {
          total: formules.length,
          page: 1,
          limit: formules.length,
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

  @GrpcMethod('FormuleProduitService', 'Delete')
  async delete(data: any): Promise<any> {
    try {
      await this.formuleProduitService.delete(data.id);
      return { success: true };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('FormuleProduitService', 'Activer')
  async activer(data: any): Promise<any> {
    try {
      const formule = await this.formuleProduitService.findById(data.id);
      if (!formule) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'FormuleProduit not found',
        });
      }

      const updated = await this.formuleProduitService.update(data.id, {
        ...formule,
        actif: true,
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

  @GrpcMethod('FormuleProduitService', 'Desactiver')
  async desactiver(data: any): Promise<any> {
    try {
      const formule = await this.formuleProduitService.findById(data.id);
      if (!formule) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'FormuleProduit not found',
        });
      }

      const updated = await this.formuleProduitService.update(data.id, {
        ...formule,
        actif: false,
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

  private mapToProto(formule: FormuleProduitEntity): any {
    return {
      id: formule.id,
      produit_id: formule.produitId,
      code: formule.code,
      nom: formule.nom,
      description: formule.description || '',
      ordre: formule.ordre,
      garanties: formule.garanties || [],
      options: formule.options || [],
      franchise_montant: formule.franchiseMontant || 0,
      franchise_type: formule.franchiseType || 0,
      prix_formule: formule.prixFormule || 0,
      type_ajustement_prix: formule.typeAjustementPrix || 0,
      actif: formule.actif,
      version_produit_id: formule.versionProduitId || '',
      metadata: formule.metadata ? JSON.stringify(formule.metadata) : '',
      created_by: formule.createdBy || '',
      modified_by: formule.modifiedBy || '',
      created_at: formule.createdAt?.toISOString() || '',
      updated_at: formule.updatedAt?.toISOString() || '',
    };
  }
}
