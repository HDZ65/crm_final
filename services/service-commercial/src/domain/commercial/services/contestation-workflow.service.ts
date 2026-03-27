import { Injectable } from '@nestjs/common';
import { DomainException } from '@crm/shared-kernel';
import { StatutContestation } from '../entities/contestation-commission.entity';

@Injectable()
export class ContestationWorkflowService {
  calculerDateLimite(datePublication: Date): Date {
    const dateLimite = new Date(datePublication);
    dateLimite.setMonth(dateLimite.getMonth() + 2);
    return dateLimite;
  }

  verifierDelaiContestation(datePublication: Date, dateContestation: Date): void {
    const dateLimite = this.calculerDateLimite(datePublication);
    if (dateContestation.getTime() > dateLimite.getTime()) {
      throw new DomainException(
        'Le delai de contestation de 2 mois est depasse',
        'DEADLINE_EXCEEDED',
      );
    }
  }

  validerResolution(commentaire: string): void {
    if (!commentaire || !commentaire.trim()) {
      throw new DomainException('Le commentaire de resolution est obligatoire', 'COMMENT_REQUIRED');
    }
  }

  determinerStatutResolution(acceptee: boolean, commentaire: string): StatutContestation {
    this.validerResolution(commentaire);
    return acceptee ? StatutContestation.ACCEPTEE : StatutContestation.REJETEE;
  }
}

export { StatutContestation };
