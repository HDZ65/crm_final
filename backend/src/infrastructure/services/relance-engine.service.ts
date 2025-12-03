import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import type { TacheRepositoryPort } from '../../core/port/tache-repository.port';
import type { RegleRelanceRepositoryPort } from '../../core/port/regle-relance-repository.port';
import type { HistoriqueRelanceRepositoryPort } from '../../core/port/historique-relance-repository.port';
import type { ContratRepositoryPort } from '../../core/port/contrat-repository.port';
import type { FactureRepositoryPort } from '../../core/port/facture-repository.port';
import { TacheEntity, TacheType, TachePriorite } from '../../core/domain/tache.entity';
import { HistoriqueRelanceEntity } from '../../core/domain/historique-relance.entity';
import { RegleRelanceEntity, RelanceDeclencheur } from '../../core/domain/regle-relance.entity';
import { NotificationService } from './notification.service';

interface RelanceContext {
  organisationId: string;
  clientId?: string;
  contratId?: string;
  factureId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class RelanceEngineService {
  private readonly logger = new Logger(RelanceEngineService.name);

  constructor(
    @Inject('TacheRepositoryPort')
    private readonly tacheRepository: TacheRepositoryPort,
    @Inject('RegleRelanceRepositoryPort')
    private readonly regleRelanceRepository: RegleRelanceRepositoryPort,
    @Inject('HistoriqueRelanceRepositoryPort')
    private readonly historiqueRelanceRepository: HistoriqueRelanceRepositoryPort,
    @Inject('ContratRepositoryPort')
    private readonly contratRepository: ContratRepositoryPort,
    @Inject('FactureRepositoryPort')
    private readonly factureRepository: FactureRepositoryPort,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
  ) {}

  // Exécution toutes les heures (peut être ajusté)
  @Cron(CronExpression.EVERY_HOUR)
  async executeRelances(): Promise<void> {
    this.logger.log('Démarrage du moteur de relances automatiques...');

    try {
      // Récupérer toutes les organisations distinctes avec des règles actives
      const allRegles = await this.regleRelanceRepository.findAll();
      const organisationIds = [...new Set(allRegles.filter(r => r.actif).map(r => r.organisationId))];

      for (const organisationId of organisationIds) {
        await this.executeRelancesForOrganisation(organisationId);
      }

      this.logger.log('Moteur de relances automatiques terminé avec succès');
    } catch (error) {
      this.logger.error('Erreur lors de l\'exécution du moteur de relances', error);
    }
  }

  async executeRelancesForOrganisation(organisationId: string): Promise<void> {
    this.logger.debug(`Traitement des relances pour l'organisation ${organisationId}`);

    const reglesActives = await this.regleRelanceRepository.findActives(organisationId);

    for (const regle of reglesActives) {
      try {
        await this.executeRegle(regle);
      } catch (error) {
        this.logger.error(`Erreur lors de l'exécution de la règle ${regle.id}`, error);
      }
    }
  }

  private async executeRegle(regle: RegleRelanceEntity): Promise<void> {
    this.logger.debug(`Exécution de la règle: ${regle.nom} (${regle.declencheur})`);

    switch (regle.declencheur) {
      case 'IMPAYE':
        await this.processImpaye(regle);
        break;
      case 'CONTRAT_BIENTOT_EXPIRE':
        await this.processContratBientotExpire(regle);
        break;
      case 'CONTRAT_EXPIRE':
        await this.processContratExpire(regle);
        break;
      default:
        this.logger.warn(`Déclencheur non supporté: ${regle.declencheur}`);
    }
  }

  private async processImpaye(regle: RegleRelanceEntity): Promise<void> {
    // Trouver les factures impayées depuis plus de X jours
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - regle.delaiJours);

    const factures = await this.dataSource.query(`
      SELECT f.* FROM factures f
      JOIN statut_factures sf ON f."statutId" = sf.id
      WHERE f."organisationId" = $1
        AND sf.code IN ('IMPAYE', 'EN_RETARD', 'EMISE')
        AND f."dateEcheance" <= $2
    `, [regle.organisationId, dateLimit]);

    for (const facture of factures) {
      await this.createRelanceIfNeeded(regle, {
        organisationId: regle.organisationId,
        clientId: facture.clientId,
        factureId: facture.id,
        metadata: {
          montant: facture.montantTTC,
          dateEcheance: facture.dateEcheance,
          numeroFacture: facture.numero,
        },
      });
    }
  }

  private async processContratBientotExpire(regle: RegleRelanceEntity): Promise<void> {
    // Trouver les contrats qui expirent dans X jours
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() + regle.delaiJours);

    const contrats = await this.dataSource.query(`
      SELECT c.* FROM contrats c
      JOIN statut_contrats sc ON c."statutContratId" = sc.id
      WHERE c."organisationId" = $1
        AND sc.code = 'ACTIF'
        AND c."dateFin" <= $2
        AND c."dateFin" > NOW()
        AND (c."reconduireAutomatiquement" = false OR c."reconduireAutomatiquement" IS NULL)
    `, [regle.organisationId, dateLimit]);

    for (const contrat of contrats) {
      await this.createRelanceIfNeeded(regle, {
        organisationId: regle.organisationId,
        clientId: contrat.clientId,
        contratId: contrat.id,
        metadata: {
          dateFin: contrat.dateFin,
          reference: contrat.reference,
        },
      });
    }
  }

  private async processContratExpire(regle: RegleRelanceEntity): Promise<void> {
    // Trouver les contrats expirés depuis X jours
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - regle.delaiJours);

    const contrats = await this.dataSource.query(`
      SELECT c.* FROM contrats c
      JOIN statut_contrats sc ON c."statutContratId" = sc.id
      WHERE c."organisationId" = $1
        AND sc.code IN ('EXPIRE', 'ACTIF')
        AND c."dateFin" <= NOW()
        AND c."dateFin" >= $2
    `, [regle.organisationId, dateLimit]);

    for (const contrat of contrats) {
      await this.createRelanceIfNeeded(regle, {
        organisationId: regle.organisationId,
        clientId: contrat.clientId,
        contratId: contrat.id,
        metadata: {
          dateFin: contrat.dateFin,
          reference: contrat.reference,
        },
      });
    }
  }

  private async createRelanceIfNeeded(
    regle: RegleRelanceEntity,
    context: RelanceContext,
  ): Promise<void> {
    // Vérifier si une relance a déjà été faite aujourd'hui pour cette règle et ce contexte
    const alreadyExists = await this.historiqueRelanceRepository.existsForToday(
      regle.id,
      context.clientId,
      context.contratId,
      context.factureId,
    );

    if (alreadyExists) {
      this.logger.debug(`Relance déjà effectuée aujourd'hui pour la règle ${regle.id}`);
      return;
    }

    let tacheCreeeId: string | undefined;
    let resultat: 'SUCCES' | 'ECHEC' = 'SUCCES';
    let messageErreur: string | undefined;

    try {
      // Créer la tâche si nécessaire
      if (regle.actionType === 'CREER_TACHE' || regle.actionType === 'TACHE_ET_EMAIL') {
        const tache = await this.createTacheFromRegle(regle, context);
        tacheCreeeId = tache.id;
      }

      // Créer la notification si nécessaire
      if (regle.actionType === 'NOTIFICATION' || regle.actionType === 'TACHE_ET_EMAIL') {
        await this.createNotificationFromRegle(regle, context);
      }

      // TODO: Envoyer l'email si nécessaire (regle.actionType === 'ENVOYER_EMAIL' || 'TACHE_ET_EMAIL')
    } catch (error) {
      resultat = 'ECHEC';
      messageErreur = error instanceof Error ? error.message : 'Erreur inconnue';
      this.logger.error(`Erreur lors de la création de la relance`, error);
    }

    // Enregistrer l'historique
    const historique = new HistoriqueRelanceEntity({
      organisationId: context.organisationId,
      regleRelanceId: regle.id,
      clientId: context.clientId,
      contratId: context.contratId,
      factureId: context.factureId,
      tacheCreeeId,
      dateExecution: new Date(),
      resultat,
      messageErreur,
      metadata: context.metadata,
    });

    await this.historiqueRelanceRepository.create(historique);
  }

  private async createTacheFromRegle(
    regle: RegleRelanceEntity,
    context: RelanceContext,
  ): Promise<TacheEntity> {
    const titre = this.formatTemplate(regle.templateTitreTache || this.getDefaultTitre(regle), context);
    const description = this.formatTemplate(regle.templateDescriptionTache || this.getDefaultDescription(regle), context);

    const tache = new TacheEntity({
      organisationId: context.organisationId,
      titre,
      description,
      type: this.getTypeFromDeclencheur(regle.declencheur),
      priorite: regle.prioriteTache as TachePriorite,
      statut: 'A_FAIRE',
      dateEcheance: this.getDateEcheance(regle),
      assigneA: regle.assigneParDefaut || 'system',
      creePar: 'system',
      clientId: context.clientId,
      contratId: context.contratId,
      factureId: context.factureId,
      regleRelanceId: regle.id,
      metadata: context.metadata,
    });

    return await this.tacheRepository.create(tache);
  }

  private async createNotificationFromRegle(
    regle: RegleRelanceEntity,
    context: RelanceContext,
  ): Promise<void> {
    const titre = this.formatTemplate(regle.templateTitreTache || this.getDefaultTitre(regle), context);
    const message = this.formatTemplate(regle.templateDescriptionTache || this.getDefaultDescription(regle), context);

    if (regle.assigneParDefaut) {
      await this.notificationService.createAndBroadcast({
        organisationId: context.organisationId,
        utilisateurId: regle.assigneParDefaut,
        type: this.getNotificationTypeFromDeclencheur(regle.declencheur),
        titre,
        message,
        metadata: context.metadata,
        lienUrl: this.getLienFromContext(context),
      });
    }
  }

  private formatTemplate(template: string, context: RelanceContext): string {
    let result = template;
    if (context.metadata) {
      for (const [key, value] of Object.entries(context.metadata)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
    }
    return result;
  }

  private getDefaultTitre(regle: RegleRelanceEntity): string {
    switch (regle.declencheur) {
      case 'IMPAYE':
        return 'Relance impayé - Facture {{numeroFacture}}';
      case 'CONTRAT_BIENTOT_EXPIRE':
        return 'Contrat à renouveler - {{reference}}';
      case 'CONTRAT_EXPIRE':
        return 'Contrat expiré - {{reference}}';
      default:
        return `Relance automatique - ${regle.nom}`;
    }
  }

  private getDefaultDescription(regle: RegleRelanceEntity): string {
    switch (regle.declencheur) {
      case 'IMPAYE':
        return 'Une facture est impayée depuis plus de {{delai}} jours. Montant: {{montant}}€. Merci de contacter le client pour effectuer le recouvrement.';
      case 'CONTRAT_BIENTOT_EXPIRE':
        return 'Le contrat {{reference}} arrive à échéance le {{dateFin}}. Veuillez contacter le client pour proposer un renouvellement.';
      case 'CONTRAT_EXPIRE':
        return 'Le contrat {{reference}} a expiré le {{dateFin}}. Veuillez contacter le client pour régulariser la situation.';
      default:
        return `Action automatique générée par la règle: ${regle.nom}`;
    }
  }

  private getTypeFromDeclencheur(declencheur: RelanceDeclencheur): TacheType {
    switch (declencheur) {
      case 'IMPAYE':
        return 'RELANCE_IMPAYE';
      case 'CONTRAT_BIENTOT_EXPIRE':
      case 'CONTRAT_EXPIRE':
        return 'RELANCE_CONTRAT';
      default:
        return 'AUTRE';
    }
  }

  private getNotificationTypeFromDeclencheur(declencheur: RelanceDeclencheur): string {
    switch (declencheur) {
      case 'IMPAYE':
        return 'IMPAYE';
      case 'CONTRAT_BIENTOT_EXPIRE':
        return 'CONTRAT_BIENTOT_EXPIRE';
      case 'CONTRAT_EXPIRE':
        return 'CONTRAT_EXPIRE';
      default:
        return 'RAPPEL';
    }
  }

  private getDateEcheance(regle: RegleRelanceEntity): Date {
    const date = new Date();
    // Par défaut, l'échéance est dans 3 jours ouvrés
    date.setDate(date.getDate() + 3);
    return date;
  }

  private getLienFromContext(context: RelanceContext): string {
    if (context.clientId) {
      return `/clients/${context.clientId}`;
    }
    if (context.contratId) {
      return `/contrats/${context.contratId}`;
    }
    return '/taches';
  }

  // Méthode pour exécuter manuellement (pour les tests ou l'API)
  async executeManually(organisationId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.executeRelancesForOrganisation(organisationId);
      return { success: true, message: 'Relances exécutées avec succès' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
}
