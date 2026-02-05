/**
 * Payment State Machine
 * 
 * Gère les transitions de statut des paiements avec validation stricte.
 * Aucune transition invalide ne peut être effectuée.
 * 
 * Diagramme des transitions autorisées:
 * 
 *                                    ┌─────────────┐
 *                                    │   PENDING   │
 *                                    └──────┬──────┘
 *                                           │
 *                          ┌────────────────┼────────────────┐
 *                          ▼                ▼                ▼
 *                   ┌───────────┐    ┌───────────┐    ┌───────────┐
 *                   │ SUBMITTED │    │ CANCELLED │    │  FAILED   │
 *                   └─────┬─────┘    └───────────┘    └───────────┘
 *                         │
 *              ┌──────────┼──────────┐
 *              ▼          ▼          ▼
 *       ┌───────────┐┌─────────┐┌───────────┐
 *       │   PAID    ││ REJECTED││ CANCELLED │
 *       └─────┬─────┘└─────────┘└───────────┘
 *             │
 *             ▼
 *       ┌───────────┐
 *       │ REFUNDED  │
 *       └───────────┘
 */

import { BadRequestException } from '@nestjs/common';

/**
 * Statuts conformes au référentiel SEPA/CB
 * Synchronisés avec le proto payment.proto
 */
export enum PaymentStatus {
  /** Paiement créé, en attente de soumission */
  PENDING = 'PENDING',
  
  /** Paiement soumis au PSP (en cours de traitement) */
  SUBMITTED = 'SUBMITTED',
  
  /** Paiement accepté et encaissé */
  PAID = 'PAID',
  
  /** Paiement rejeté par le PSP ou la banque */
  REJECTED = 'REJECTED',
  
  /** Paiement remboursé (total ou partiel) */
  REFUNDED = 'REFUNDED',
  
  /** Paiement annulé avant soumission */
  CANCELLED = 'CANCELLED',
  
  /** Paiement échoué (erreur technique) */
  FAILED = 'FAILED',
}

/**
 * Matrice des transitions autorisées
 * Clé = état source, Valeur = états cibles autorisés
 */
const ALLOWED_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [
    PaymentStatus.SUBMITTED,
    PaymentStatus.CANCELLED,
    PaymentStatus.FAILED,
  ],
  [PaymentStatus.SUBMITTED]: [
    PaymentStatus.PAID,
    PaymentStatus.REJECTED,
    PaymentStatus.CANCELLED,
    PaymentStatus.FAILED,
  ],
  [PaymentStatus.PAID]: [
    PaymentStatus.REFUNDED,
  ],
  [PaymentStatus.REJECTED]: [],  // État terminal
  [PaymentStatus.REFUNDED]: [],  // État terminal
  [PaymentStatus.CANCELLED]: [], // État terminal
  [PaymentStatus.FAILED]: [
    PaymentStatus.PENDING, // Retry possible
  ],
};

/**
 * États terminaux - aucune transition possible
 */
export const TERMINAL_STATUSES: PaymentStatus[] = [
  PaymentStatus.REJECTED,
  PaymentStatus.REFUNDED,
  PaymentStatus.CANCELLED,
];

/**
 * États qui indiquent un paiement réussi
 */
export const SUCCESS_STATUSES: PaymentStatus[] = [
  PaymentStatus.PAID,
  PaymentStatus.REFUNDED,
];

/**
 * États qui indiquent un échec
 */
export const FAILURE_STATUSES: PaymentStatus[] = [
  PaymentStatus.REJECTED,
  PaymentStatus.CANCELLED,
  PaymentStatus.FAILED,
];

/**
 * Exception pour transition de statut invalide
 */
export class InvalidPaymentTransitionError extends BadRequestException {
  constructor(
    public readonly fromStatus: PaymentStatus,
    public readonly toStatus: PaymentStatus,
    public readonly paymentId?: string,
  ) {
    const id = paymentId ? ` (ID: ${paymentId})` : '';
    super(
      `Transition de paiement invalide${id}: ${fromStatus} → ${toStatus}. ` +
      `Transitions autorisées depuis ${fromStatus}: [${ALLOWED_TRANSITIONS[fromStatus].join(', ') || 'aucune'}]`
    );
  }
}

/**
 * Service de machine d'état pour les paiements
 */
export class PaymentStateMachine {
  /**
   * Vérifie si une transition est autorisée
   */
  static canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
    const allowedTargets = ALLOWED_TRANSITIONS[from];
    return allowedTargets?.includes(to) ?? false;
  }

  /**
   * Valide une transition et throw si invalide
   */
  static validateTransition(
    from: PaymentStatus,
    to: PaymentStatus,
    paymentId?: string,
  ): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidPaymentTransitionError(from, to, paymentId);
    }
  }

  /**
   * Retourne les transitions possibles depuis un état donné
   */
  static getAvailableTransitions(from: PaymentStatus): PaymentStatus[] {
    return ALLOWED_TRANSITIONS[from] ?? [];
  }

  /**
   * Vérifie si un état est terminal (aucune transition possible)
   */
  static isTerminal(status: PaymentStatus): boolean {
    return TERMINAL_STATUSES.includes(status);
  }

  /**
   * Vérifie si un état indique un succès
   */
  static isSuccess(status: PaymentStatus): boolean {
    return SUCCESS_STATUSES.includes(status);
  }

  /**
   * Vérifie si un état indique un échec
   */
  static isFailure(status: PaymentStatus): boolean {
    return FAILURE_STATUSES.includes(status);
  }

  /**
   * Convertit un statut legacy (ancien format) vers le nouveau format
   * Utile pour la migration
   */
  static fromLegacyStatus(legacyStatus: string): PaymentStatus {
    const mapping: Record<string, PaymentStatus> = {
      'pending': PaymentStatus.PENDING,
      'processing': PaymentStatus.SUBMITTED,
      'succeeded': PaymentStatus.PAID,
      'failed': PaymentStatus.FAILED,
      'cancelled': PaymentStatus.CANCELLED,
      'refunded': PaymentStatus.REFUNDED,
      'partially_refunded': PaymentStatus.REFUNDED, // Traité comme REFUNDED
    };

    const mapped = mapping[legacyStatus.toLowerCase()];
    if (!mapped) {
      throw new BadRequestException(
        `Statut de paiement inconnu: ${legacyStatus}. ` +
        `Statuts valides: ${Object.values(PaymentStatus).join(', ')}`
      );
    }

    return mapped;
  }

  /**
   * Convertit vers le format legacy (pour rétrocompatibilité)
   */
  static toLegacyStatus(status: PaymentStatus): string {
    const mapping: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'pending',
      [PaymentStatus.SUBMITTED]: 'processing',
      [PaymentStatus.PAID]: 'succeeded',
      [PaymentStatus.REJECTED]: 'failed',
      [PaymentStatus.REFUNDED]: 'refunded',
      [PaymentStatus.CANCELLED]: 'cancelled',
      [PaymentStatus.FAILED]: 'failed',
    };

    return mapping[status];
  }
}

/**
 * Statuts des mandats SEPA (GoCardless)
 */
export enum MandateStatus {
  /** En attente d'approbation client */
  PENDING_CUSTOMER_APPROVAL = 'PENDING_CUSTOMER_APPROVAL',
  
  /** En attente de soumission à la banque */
  PENDING_SUBMISSION = 'PENDING_SUBMISSION',
  
  /** Soumis à la banque */
  SUBMITTED = 'SUBMITTED',
  
  /** Mandat actif et utilisable */
  ACTIVE = 'ACTIVE',
  
  /** Suspendu par le payeur */
  SUSPENDED_BY_PAYER = 'SUSPENDED_BY_PAYER',
  
  /** Échec de création */
  FAILED = 'FAILED',
  
  /** Annulé */
  CANCELLED = 'CANCELLED',
  
  /** Expiré */
  EXPIRED = 'EXPIRED',
  
  /** Consommé (one-off) */
  CONSUMED = 'CONSUMED',
  
  /** Bloqué */
  BLOCKED = 'BLOCKED',
}

/**
 * Transitions autorisées pour les mandats
 */
const MANDATE_TRANSITIONS: Record<MandateStatus, MandateStatus[]> = {
  [MandateStatus.PENDING_CUSTOMER_APPROVAL]: [
    MandateStatus.PENDING_SUBMISSION,
    MandateStatus.FAILED,
    MandateStatus.CANCELLED,
  ],
  [MandateStatus.PENDING_SUBMISSION]: [
    MandateStatus.SUBMITTED,
    MandateStatus.FAILED,
    MandateStatus.CANCELLED,
  ],
  [MandateStatus.SUBMITTED]: [
    MandateStatus.ACTIVE,
    MandateStatus.FAILED,
    MandateStatus.CANCELLED,
  ],
  [MandateStatus.ACTIVE]: [
    MandateStatus.SUSPENDED_BY_PAYER,
    MandateStatus.CANCELLED,
    MandateStatus.EXPIRED,
    MandateStatus.CONSUMED,
    MandateStatus.BLOCKED,
  ],
  [MandateStatus.SUSPENDED_BY_PAYER]: [
    MandateStatus.ACTIVE,
    MandateStatus.CANCELLED,
    MandateStatus.EXPIRED,
  ],
  [MandateStatus.FAILED]: [],
  [MandateStatus.CANCELLED]: [],
  [MandateStatus.EXPIRED]: [],
  [MandateStatus.CONSUMED]: [],
  [MandateStatus.BLOCKED]: [
    MandateStatus.ACTIVE,
    MandateStatus.CANCELLED,
  ],
};

/**
 * Service de machine d'état pour les mandats SEPA
 */
export class MandateStateMachine {
  static canTransition(from: MandateStatus, to: MandateStatus): boolean {
    const allowedTargets = MANDATE_TRANSITIONS[from];
    return allowedTargets?.includes(to) ?? false;
  }

  static validateTransition(
    from: MandateStatus,
    to: MandateStatus,
    mandateId?: string,
  ): void {
    if (!this.canTransition(from, to)) {
      const id = mandateId ? ` (ID: ${mandateId})` : '';
      throw new BadRequestException(
        `Transition de mandat invalide${id}: ${from} → ${to}. ` +
        `Transitions autorisées depuis ${from}: [${MANDATE_TRANSITIONS[from].join(', ') || 'aucune'}]`
      );
    }
  }

  static isActive(status: MandateStatus): boolean {
    return status === MandateStatus.ACTIVE;
  }

  static isTerminal(status: MandateStatus): boolean {
    return [
      MandateStatus.FAILED,
      MandateStatus.CANCELLED,
      MandateStatus.EXPIRED,
      MandateStatus.CONSUMED,
    ].includes(status);
  }
}
