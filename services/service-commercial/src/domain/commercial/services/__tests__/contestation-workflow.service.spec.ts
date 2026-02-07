import { describe, expect, it } from 'bun:test';
import { DomainException } from '@crm/shared-kernel';
import {
  ContestationWorkflowService,
  StatutContestation,
} from '../contestation-workflow.service';

describe('ContestationWorkflowService', () => {
  const service = new ContestationWorkflowService();

  it('accepte une contestation dans le delai de 2 mois', () => {
    const datePublication = new Date('2026-01-15T00:00:00.000Z');
    const dateContestation = new Date('2026-03-15T00:00:00.000Z');

    const dateLimite = service.calculerDateLimite(datePublication);

    expect(dateLimite.toISOString()).toBe('2026-03-15T00:00:00.000Z');
    expect(() => service.verifierDelaiContestation(datePublication, dateContestation)).not.toThrow();
  });

  it('rejette une contestation hors delai avec DEADLINE_EXCEEDED', () => {
    const datePublication = new Date('2026-01-15T00:00:00.000Z');
    const dateContestation = new Date('2026-03-16T00:00:00.000Z');

    expect(() => service.verifierDelaiContestation(datePublication, dateContestation)).toThrow(DomainException);
    expect(() => service.verifierDelaiContestation(datePublication, dateContestation)).toThrow(
      'Le delai de contestation de 2 mois est depasse',
    );
  });

  it('exige un commentaire pour resoudre une contestation', () => {
    expect(() => service.validerResolution('   ')).toThrow(DomainException);
  });

  it('retourne le statut acceptee quand decision acceptee', () => {
    const statut = service.determinerStatutResolution(true, 'Correction justifiee');
    expect(statut).toBe(StatutContestation.ACCEPTEE);
  });

  it('retourne le statut rejetee quand decision rejetee', () => {
    const statut = service.determinerStatutResolution(false, 'Elements contractuels conformes');
    expect(statut).toBe(StatutContestation.REJETEE);
  });
});
