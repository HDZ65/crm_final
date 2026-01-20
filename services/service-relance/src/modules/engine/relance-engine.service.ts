import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { RegleRelanceService } from '../regle-relance/regle-relance.service';
import { HistoriqueRelanceService } from '../historique-relance/historique-relance.service';
import {
  RegleRelanceEntity,
  RelanceDeclencheur,
} from '../regle-relance/entities/regle-relance.entity';
import { RelanceResultat } from '../historique-relance/entities/historique-relance.entity';

export interface RelanceEventData {
  organisationId: string;
  declencheur: RelanceDeclencheur;
  clientId?: string;
  contratId?: string;
  factureId?: string;
  metadata?: Record<string, unknown>;
}

export interface RelanceAction {
  type: 'TACHE' | 'EMAIL' | 'NOTIFICATION';
  titre: string;
  description: string;
  assigneA?: string;
  priorite: string;
  metadata?: Record<string, unknown>;
}

export interface ExecuteResult {
  success: boolean;
  message: string;
  relancesExecutees: number;
  relancesEchouees: number;
}

export interface ProcessEventResult {
  success: boolean;
  message: string;
  actionsCreated: RelanceAction[];
}

@Injectable()
export class RelanceEngineService {
  private readonly logger = new Logger(RelanceEngineService.name);
  private readonly cronEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly regleRelanceService: RegleRelanceService,
    private readonly historiqueRelanceService: HistoriqueRelanceService,
  ) {
    this.cronEnabled = this.configService.get<string>('CRON_ENABLED') === 'true';
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduledExecution(): Promise<void> {
    if (!this.cronEnabled) {
      return;
    }
    this.logger.log('Scheduled relance engine execution started');
    // In a microservice architecture, this would emit events
    // to trigger the main backend to check for pending relances
    // For now, we log and skip
    this.logger.log('Scheduled execution - emit CHECK_RELANCES event');
  }

  async executeRelances(organisationId: string): Promise<ExecuteResult> {
    this.logger.log(`Executing relances for organisation ${organisationId}`);

    let relancesExecutees = 0;
    let relancesEchouees = 0;

    try {
      const reglesActives = await this.regleRelanceService.findActives(organisationId);

      for (const regle of reglesActives) {
        try {
          const result = await this.executeRegle(regle);
          if (result.success) {
            relancesExecutees += result.actionsCreees;
          } else {
            relancesEchouees++;
          }
        } catch (error) {
          this.logger.error(`Error executing regle ${regle.id}`, error);
          relancesEchouees++;
        }
      }

      return {
        success: true,
        message: `Relances exécutées: ${relancesExecutees}, Échecs: ${relancesEchouees}`,
        relancesExecutees,
        relancesEchouees,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message,
        relancesExecutees,
        relancesEchouees,
      };
    }
  }

  async executeRegle(regle: RegleRelanceEntity): Promise<{ success: boolean; actionsCreees: number }> {
    this.logger.debug(`Executing regle: ${regle.nom} (${regle.declencheur})`);

    // In a microservice architecture, this service doesn't have direct access
    // to contrats/factures. It would:
    // 1. Emit an event to request data from the main backend
    // 2. Or receive events from the main backend with the data

    // For now, we return a placeholder result
    // The actual execution logic would be triggered by events from the main backend

    return {
      success: true,
      actionsCreees: 0,
    };
  }

  async processEvent(event: RelanceEventData): Promise<ProcessEventResult> {
    this.logger.log(`Processing event: ${event.declencheur} for org ${event.organisationId}`);

    const actionsCreated: RelanceAction[] = [];

    try {
      // Find applicable rules
      const regles = await this.regleRelanceService.findByDeclencheur(
        event.organisationId,
        event.declencheur,
      );

      for (const regle of regles) {
        // Check if already executed today
        const alreadyExists = await this.historiqueRelanceService.existsForToday(
          regle.id,
          event.clientId,
          event.contratId,
          event.factureId,
        );

        if (alreadyExists) {
          this.logger.debug(`Relance already executed today for regle ${regle.id}`);
          continue;
        }

        // Create actions based on rule configuration
        const actions = this.createActionsFromRegle(regle, event);
        actionsCreated.push(...actions);

        // Record history
        await this.historiqueRelanceService.create({
          organisationId: event.organisationId,
          regleRelanceId: regle.id,
          clientId: event.clientId,
          contratId: event.contratId,
          factureId: event.factureId,
          resultat: RelanceResultat.SUCCES,
          metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
        });
      }

      return {
        success: true,
        message: `${actionsCreated.length} actions created`,
        actionsCreated,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message,
        actionsCreated: [],
      };
    }
  }

  private createActionsFromRegle(
    regle: RegleRelanceEntity,
    event: RelanceEventData,
  ): RelanceAction[] {
    const actions: RelanceAction[] = [];
    const titre = this.formatTemplate(
      regle.templateTitreTache || this.getDefaultTitre(regle),
      event.metadata,
    );
    const description = this.formatTemplate(
      regle.templateDescriptionTache || this.getDefaultDescription(regle),
      event.metadata,
    );

    if (regle.actionType === 'CREER_TACHE' || regle.actionType === 'TACHE_ET_EMAIL') {
      actions.push({
        type: 'TACHE',
        titre,
        description,
        assigneA: regle.assigneParDefaut || undefined,
        priorite: regle.prioriteTache,
        metadata: {
          regleId: regle.id,
          clientId: event.clientId,
          contratId: event.contratId,
          factureId: event.factureId,
          ...event.metadata,
        },
      });
    }

    if (regle.actionType === 'ENVOYER_EMAIL' || regle.actionType === 'TACHE_ET_EMAIL') {
      actions.push({
        type: 'EMAIL',
        titre,
        description,
        priorite: regle.prioriteTache,
        metadata: {
          regleId: regle.id,
          templateId: regle.templateEmailId,
          clientId: event.clientId,
          ...event.metadata,
        },
      });
    }

    if (regle.actionType === 'NOTIFICATION') {
      actions.push({
        type: 'NOTIFICATION',
        titre,
        description,
        assigneA: regle.assigneParDefaut || undefined,
        priorite: regle.prioriteTache,
        metadata: {
          regleId: regle.id,
          clientId: event.clientId,
          contratId: event.contratId,
          factureId: event.factureId,
          ...event.metadata,
        },
      });
    }

    return actions;
  }

  private formatTemplate(
    template: string,
    metadata?: Record<string, unknown>,
  ): string {
    if (!metadata) return template;

    let result = template;
    for (const [key, value] of Object.entries(metadata)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }

  private getDefaultTitre(regle: RegleRelanceEntity): string {
    switch (regle.declencheur) {
      case RelanceDeclencheur.IMPAYE:
        return 'Relance impayé - Facture {{numeroFacture}}';
      case RelanceDeclencheur.CONTRAT_BIENTOT_EXPIRE:
        return 'Contrat à renouveler - {{reference}}';
      case RelanceDeclencheur.CONTRAT_EXPIRE:
        return 'Contrat expiré - {{reference}}';
      case RelanceDeclencheur.NOUVEAU_CLIENT:
        return 'Bienvenue - Nouveau client';
      case RelanceDeclencheur.INACTIVITE_CLIENT:
        return 'Client inactif - {{nom}}';
      default:
        return `Relance automatique - ${regle.nom}`;
    }
  }

  private getDefaultDescription(regle: RegleRelanceEntity): string {
    switch (regle.declencheur) {
      case RelanceDeclencheur.IMPAYE:
        return 'Une facture est impayée. Montant: {{montant}}€. Merci de contacter le client.';
      case RelanceDeclencheur.CONTRAT_BIENTOT_EXPIRE:
        return 'Le contrat {{reference}} arrive à échéance le {{dateFin}}.';
      case RelanceDeclencheur.CONTRAT_EXPIRE:
        return 'Le contrat {{reference}} a expiré le {{dateFin}}.';
      case RelanceDeclencheur.NOUVEAU_CLIENT:
        return 'Un nouveau client a été créé. Préparez un appel de bienvenue.';
      case RelanceDeclencheur.INACTIVITE_CLIENT:
        return 'Le client {{nom}} est inactif depuis {{joursInactivite}} jours.';
      default:
        return `Action générée par la règle: ${regle.nom}`;
    }
  }

  async getStatistiques(
    organisationId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ) {
    return this.historiqueRelanceService.getStatistiques(
      organisationId,
      dateFrom,
      dateTo,
    );
  }
}
