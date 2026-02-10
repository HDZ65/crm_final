import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { DemandeConciergerieService } from '../../persistence/typeorm/repositories/services/demande-conciergerie.service';
import { CommentaireDemandeService } from '../../persistence/typeorm/repositories/services/commentaire-demande.service';
import {
  DemandeConciergerie,
  DemandeStatut,
  DemandeCategorie,
  DemandePriorite,
  DemandeCanal,
} from '../../../domain/services/entities/demande-conciergerie.entity';
import { CommentaireDemande, CommentaireType } from '../../../domain/services/entities/commentaire-demande.entity';
import type {
  DemandeConciergerieProto,
  CommentaireDemandeProto,
  CreateDemandeRequest,
  CreateDemandeResponse,
  GetDemandeRequest,
  GetDemandeResponse,
  UpdateDemandeRequest,
  UpdateDemandeResponse,
  ListDemandesRequest,
  ListDemandesResponse,
  AddCommentaireRequest,
  AddCommentaireResponse,
  AssignerDemandeRequest,
  AssignerDemandeResponse,
  CloturerDemandeRequest,
  CloturerDemandeResponse,
  DeleteDemandeRequest,
  DeleteDemandeResponse,
} from '@proto/conciergerie';
import { randomUUID as uuid } from 'crypto';

/**
 * NATS event subjects for Conciergerie demandes.
 * NOTE: NATS publishing will be wired when @crm/nats-utils is available.
 * Currently logs events for traceability.
 */
const NATS_SUBJECTS = {
  DEMANDE_CREATED: 'conciergerie.demande.created',
  DEMANDE_UPDATED: 'conciergerie.demande.updated',
  DEMANDE_CLOSED: 'conciergerie.demande.closed',
};

@Controller()
export class ConciergerieController {
  private readonly logger = new Logger(ConciergerieController.name);

  constructor(
    private readonly demandeConciergerieService: DemandeConciergerieService,
    private readonly commentaireDemandeService: CommentaireDemandeService,
  ) {}

  @GrpcMethod('ConciergerieSvc', 'CreateDemande')
  async createDemande(data: CreateDemandeRequest): Promise<CreateDemandeResponse> {
    this.logger.log(`CreateDemande called for org=${data.organisation_id}, client=${data.client_id}`);

    try {
      const demande = await this.demandeConciergerieService.create({
        organisationId: data.organisation_id,
        clientId: data.client_id,
        objet: data.titre,
        description: data.description,
        categorie: this.mapCategorieFromProto(data.categorie as number),
        canal: data.canal_origine ? this.mapCanalFromString(data.canal_origine) : undefined,
        priorite: this.mapPrioriteFromProto(data.priorite as number),
      });

      // Emit NATS event (logged until nats-utils is wired)
      this.emitEvent(NATS_SUBJECTS.DEMANDE_CREATED, {
        event_id: uuid(),
        timestamp: Date.now(),
        demande_id: demande.id,
        organisation_id: demande.organisationId,
        client_id: demande.clientId,
        titre: demande.objet,
        categorie: demande.categorie,
        priorite: demande.priorite,
      });

      return { demande: this.toDemandeProto(demande) };
    } catch (error: any) {
      this.logger.error('CreateDemande failed', error.stack);
      throw error;
    }
  }

  @GrpcMethod('ConciergerieSvc', 'GetDemande')
  async getDemande(data: GetDemandeRequest): Promise<GetDemandeResponse> {
    this.logger.debug(`GetDemande called for id=${data.id}`);

    const demande = await this.demandeConciergerieService.findById(data.id);
    if (!demande) {
      return { demande: undefined };
    }

    // Fetch comments for this demande
    const commentaires = await this.commentaireDemandeService.findByDemandeId(data.id);

    const proto = this.toDemandeProto(demande);
    proto.commentaires = commentaires.map((c) => this.toCommentaireProto(c));

    return { demande: proto };
  }

  @GrpcMethod('ConciergerieSvc', 'ListDemandes')
  async listDemandes(data: ListDemandesRequest): Promise<ListDemandesResponse> {
    this.logger.debug(`ListDemandes called for org=${data.organisation_id}`);

    const result = await this.demandeConciergerieService.findAll(
      {
        organisationId: data.organisation_id,
        clientId: data.client_id,
        assigneA: data.assigne_a,
        statut: data.statut !== undefined ? this.mapStatutFromProto(data.statut as number) : undefined,
        priorite: data.priorite !== undefined ? this.mapPrioriteFromProto(data.priorite as number) : undefined,
        categorie: data.categorie !== undefined ? this.mapCategorieFromProto(data.categorie as number) : undefined,
        search: data.search,
      },
      data.pagination
        ? { page: data.pagination.page || 1, limit: data.pagination.limit || 20 }
        : undefined,
    );

    return {
      demandes: result.data.map((d) => this.toDemandeProto(d)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ConciergerieSvc', 'UpdateDemande')
  async updateDemande(data: UpdateDemandeRequest): Promise<UpdateDemandeResponse> {
    this.logger.log(`UpdateDemande called for id=${data.id}`);

    try {
      const existing = await this.demandeConciergerieService.findById(data.id);
      const ancienStatut = existing?.statut;

      const updateData: Partial<DemandeConciergerie> = {};

      if (data.titre !== undefined) {
        updateData.objet = data.titre;
      }
      if (data.description !== undefined) {
        updateData.description = data.description;
      }
      if (data.categorie !== undefined) {
        updateData.categorie = this.mapCategorieFromProto(data.categorie as number);
      }
      if (data.statut !== undefined) {
        updateData.statut = this.mapStatutFromProto(data.statut as number);
      }
      if (data.priorite !== undefined) {
        updateData.priorite = this.mapPrioriteFromProto(data.priorite as number);
      }

      const demande = await this.demandeConciergerieService.update(data.id, updateData);

      // Emit NATS event
      this.emitEvent(NATS_SUBJECTS.DEMANDE_UPDATED, {
        event_id: uuid(),
        timestamp: Date.now(),
        demande_id: demande.id,
        organisation_id: demande.organisationId,
        ancien_statut: ancienStatut,
        nouveau_statut: demande.statut,
        assigne_a: demande.assigneA,
      });

      return { demande: this.toDemandeProto(demande) };
    } catch (error: any) {
      this.logger.error('UpdateDemande failed', error.stack);
      throw error;
    }
  }

  @GrpcMethod('ConciergerieSvc', 'AddCommentaire')
  async addCommentaire(data: AddCommentaireRequest): Promise<AddCommentaireResponse> {
    this.logger.log(`AddCommentaire called for demande=${data.demande_id}`);

    try {
      const commentaire = await this.commentaireDemandeService.create({
        demandeId: data.demande_id,
        auteurId: data.auteur_id,
        contenu: data.contenu,
        type: data.interne ? CommentaireType.INTERNE : CommentaireType.CLIENT,
      });

      return { commentaire: this.toCommentaireProto(commentaire) };
    } catch (error: any) {
      this.logger.error('AddCommentaire failed', error.stack);
      throw error;
    }
  }

  @GrpcMethod('ConciergerieSvc', 'AssignerDemande')
  async assignerDemande(data: AssignerDemandeRequest): Promise<AssignerDemandeResponse> {
    this.logger.log(`AssignerDemande called for demande=${data.demande_id}, user=${data.assigne_a}`);

    try {
      const demande = await this.demandeConciergerieService.assigner(
        data.demande_id,
        data.assigne_a,
      );

      // Emit NATS event
      this.emitEvent(NATS_SUBJECTS.DEMANDE_UPDATED, {
        event_id: uuid(),
        timestamp: Date.now(),
        demande_id: demande.id,
        organisation_id: demande.organisationId,
        ancien_statut: DemandeStatut.NOUVELLE,
        nouveau_statut: demande.statut,
        assigne_a: demande.assigneA,
      });

      return { demande: this.toDemandeProto(demande) };
    } catch (error: any) {
      this.logger.error('AssignerDemande failed', error.stack);
      throw error;
    }
  }

  @GrpcMethod('ConciergerieSvc', 'CloturerDemande')
  async cloturerDemande(data: CloturerDemandeRequest): Promise<CloturerDemandeResponse> {
    this.logger.log(`CloturerDemande called for demande=${data.demande_id}`);

    try {
      const demande = await this.demandeConciergerieService.cloturer(
        data.demande_id,
        data.resolution_notes,
      );

      // Emit NATS event
      this.emitEvent(NATS_SUBJECTS.DEMANDE_CLOSED, {
        event_id: uuid(),
        timestamp: Date.now(),
        demande_id: demande.id,
        organisation_id: demande.organisationId,
        client_id: demande.clientId,
        resolution_notes: data.resolution_notes,
      });

      return { demande: this.toDemandeProto(demande) };
    } catch (error: any) {
      this.logger.error('CloturerDemande failed', error.stack);
      throw error;
    }
  }

  @GrpcMethod('ConciergerieSvc', 'DeleteDemande')
  async deleteDemande(data: DeleteDemandeRequest): Promise<DeleteDemandeResponse> {
    this.logger.log(`DeleteDemande called for id=${data.id}`);

    try {
      const success = await this.demandeConciergerieService.delete(data.id);
      return { success };
    } catch (error: any) {
      this.logger.error('DeleteDemande failed', error.stack);
      throw error;
    }
  }

  // ========== MAPPERS ==========

  private toDemandeProto(entity: DemandeConciergerie): DemandeConciergerieProto {
    return {
      id: entity.id,
      organisation_id: entity.organisationId ?? '',
      client_id: entity.clientId ?? '',
      reference: entity.reference ?? '',
      titre: entity.objet ?? '',
      description: entity.description ?? '',
      categorie: this.mapCategorieToProto(entity.categorie),
      statut: this.mapStatutToProto(entity.statut),
      priorite: this.mapPrioriteToProto(entity.priorite),
      assigne_a: entity.assigneA ?? '',
      canal_origine: entity.canal ?? '',
      tags: [],
      date_echeance: entity.dateLimite?.toISOString() ?? '',
      date_resolution: entity.dateResolution?.toISOString() ?? '',
      resolution_notes: entity.metadata?.resolutionNotes ?? '',
      created_at: entity.createdAt?.toISOString() ?? '',
      updated_at: entity.updatedAt?.toISOString() ?? '',
      commentaires: [],
    };
  }

  private toCommentaireProto(entity: CommentaireDemande): CommentaireDemandeProto {
    return {
      id: entity.id,
      demande_id: entity.demandeId ?? '',
      auteur_id: entity.auteurId ?? '',
      contenu: entity.contenu ?? '',
      interne: entity.type === CommentaireType.INTERNE,
      created_at: entity.createdAt?.toISOString() ?? '',
      updated_at: '',
    };
  }

  // ========== Enum Mappers ==========

  private mapStatutToProto(statut: DemandeStatut): number {
    const mapping: Record<DemandeStatut, number> = {
      [DemandeStatut.NOUVELLE]: 1,
      [DemandeStatut.EN_COURS]: 2,
      [DemandeStatut.EN_ATTENTE]: 3,
      [DemandeStatut.RESOLUE]: 4,
      [DemandeStatut.FERMEE]: 5,
      [DemandeStatut.ANNULEE]: 6,
    };
    return mapping[statut] ?? 0;
  }

  private mapStatutFromProto(statut: number): DemandeStatut | undefined {
    const mapping: Record<number, DemandeStatut> = {
      1: DemandeStatut.NOUVELLE,
      2: DemandeStatut.EN_COURS,
      3: DemandeStatut.EN_ATTENTE,
      4: DemandeStatut.RESOLUE,
      5: DemandeStatut.FERMEE,
      6: DemandeStatut.ANNULEE,
    };
    return mapping[statut];
  }

  private mapPrioriteToProto(priorite: DemandePriorite): number {
    const mapping: Record<DemandePriorite, number> = {
      [DemandePriorite.BASSE]: 1,
      [DemandePriorite.NORMALE]: 2,
      [DemandePriorite.HAUTE]: 3,
      [DemandePriorite.URGENTE]: 4,
    };
    return mapping[priorite] ?? 0;
  }

  private mapPrioriteFromProto(priorite: number): DemandePriorite | undefined {
    const mapping: Record<number, DemandePriorite> = {
      1: DemandePriorite.BASSE,
      2: DemandePriorite.NORMALE,
      3: DemandePriorite.HAUTE,
      4: DemandePriorite.URGENTE,
    };
    return mapping[priorite];
  }

  private mapCategorieToProto(categorie: DemandeCategorie): number {
    const mapping: Record<DemandeCategorie, number> = {
      [DemandeCategorie.ADMINISTRATIVE]: 1,
      [DemandeCategorie.JURIDIQUE]: 2,
      [DemandeCategorie.TECHNIQUE]: 3,
      [DemandeCategorie.FINANCIERE]: 4,
      [DemandeCategorie.AUTRE]: 5,
      [DemandeCategorie.COMMERCIALE]: 5,
    };
    return mapping[categorie] ?? 0;
  }

  private mapCategorieFromProto(categorie: number): DemandeCategorie | undefined {
    const mapping: Record<number, DemandeCategorie> = {
      1: DemandeCategorie.ADMINISTRATIVE,
      2: DemandeCategorie.JURIDIQUE,
      3: DemandeCategorie.TECHNIQUE,
      4: DemandeCategorie.FINANCIERE,
      5: DemandeCategorie.AUTRE,
    };
    return mapping[categorie];
  }

  private mapCanalFromString(canal: string): DemandeCanal {
    const mapping: Record<string, DemandeCanal> = {
      email: DemandeCanal.EMAIL,
      telephone: DemandeCanal.TELEPHONE,
      chat: DemandeCanal.CHAT,
      portail: DemandeCanal.PORTAIL,
      en_personne: DemandeCanal.EN_PERSONNE,
    };
    return mapping[canal.toLowerCase()] ?? DemandeCanal.PORTAIL;
  }

  /**
   * Emit a NATS event. Currently logs the event payload.
   * Will be wired to actual NATS publishing when @crm/nats-utils is available.
   */
  private emitEvent(subject: string, payload: Record<string, any>): void {
    this.logger.log(`[NATS_EVENT] ${subject}: ${JSON.stringify(payload)}`);
    // TODO: Wire to nats-utils when available
    // this.natsService.publish(subject, payload);
  }
}
