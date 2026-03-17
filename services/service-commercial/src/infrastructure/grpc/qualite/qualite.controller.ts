import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ControleQualiteService } from '../../persistence/typeorm/repositories/qualite/controle-qualite.service';
import type {
  GetControleRequest,
  GetControleByContratRequest,
  CreerControleRequest,
  RejeterControleRequest,
  ValiderControleRequest,
  RetournerControleRequest,
} from '@proto/qualite';

function mapControleToResponse(entity: any) {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    contrat_id: entity.contratId,
    statut: entity.statut,
    validateur_id: entity.validateurId,
    score: entity.score,
    date_soumission: entity.dateSoumission?.toISOString?.() ?? entity.dateSoumission,
    date_validation: entity.dateValidation?.toISOString?.() ?? entity.dateValidation,
    motif_rejet: entity.motifRejet,
    commentaire: entity.commentaire,
    created_at: entity.createdAt?.toISOString?.() ?? entity.createdAt,
    updated_at: entity.updatedAt?.toISOString?.() ?? entity.updatedAt,
  };
}

@Controller()
export class QualiteController {
  private readonly logger = new Logger(QualiteController.name);

  constructor(
    private readonly controleQualiteService: ControleQualiteService,
  ) {}

  @GrpcMethod('ControleQualiteService', 'GetControle')
  async getControle(data: GetControleRequest) {
    try {
      const controle = await this.controleQualiteService.findById(data.id);
      if (!controle) {
        return null;
      }
      return mapControleToResponse(controle);
    } catch (error) {
      this.logger.error(`Error getting controle qualite: ${error}`);
      throw error;
    }
  }

  @GrpcMethod('ControleQualiteService', 'GetControleByContrat')
  async getControleByContrat(data: GetControleByContratRequest) {
    try {
      const controle = await this.controleQualiteService.findByContratId(data.contrat_id);
      if (!controle) {
        return null;
      }
      return mapControleToResponse(controle);
    } catch (error) {
      this.logger.error(`Error getting controle qualite by contrat: ${error}`);
      throw error;
    }
  }

  @GrpcMethod('ControleQualiteService', 'CreerControle')
  async creerControle(data: CreerControleRequest) {
    try {
      const controle = await this.controleQualiteService.create(
        data.organisation_id,
        data.contrat_id,
      );
      return mapControleToResponse(controle);
    } catch (error) {
      this.logger.error(`Error creating controle qualite: ${error}`);
      throw error;
    }
  }

  @GrpcMethod('ControleQualiteService', 'RejeterControle')
  async rejeterControle(data: RejeterControleRequest) {
    try {
      const controle = await this.controleQualiteService.update(data.id, {
        statut: 'REJETE' as any,
        validateurId: data.validateur_id,
        motifRejet: data.motif,
      });
      return mapControleToResponse(controle);
    } catch (error) {
      this.logger.error(`Error rejecting controle qualite: ${error}`);
      throw error;
    }
  }

  @GrpcMethod('ControleQualiteService', 'ValiderControle')
  async validerControle(data: ValiderControleRequest) {
    try {
      const controle = await this.controleQualiteService.update(data.id, {
        statut: 'VALIDE' as any,
        validateurId: data.validateur_id,
        dateValidation: new Date(),
      });
      return mapControleToResponse(controle);
    } catch (error) {
      this.logger.error(`Error validating controle qualite: ${error}`);
      throw error;
    }
  }

  @GrpcMethod('ControleQualiteService', 'RetournerControle')
  async retournerControle(data: RetournerControleRequest) {
    try {
      const controle = await this.controleQualiteService.update(data.id, {
        statut: 'RETOUR' as any,
        validateurId: data.validateur_id,
        motifRejet: data.motif,
      });
      return mapControleToResponse(controle);
    } catch (error) {
      this.logger.error(`Error returning controle qualite: ${error}`);
      throw error;
    }
  }
}
