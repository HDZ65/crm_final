import {
  GoCardlessMandateEntity,
  MandateStatus,
  canTransitionMandate,
  isTerminalMandateStatus,
} from '../../entities/gocardless-mandate.entity';

// ==========================================================================
// Helper: create a mandate entity in a given status
// ==========================================================================

function makeMandateInStatus(status: MandateStatus): GoCardlessMandateEntity {
  const m = new GoCardlessMandateEntity();
  m.id = 'test-uuid';
  m.clientId = 'client-1';
  m.societeId = 'org-1';
  m.mandateId = 'MD0001';
  m.rum = 'GC-MD0001';
  m.status = status;
  m.scheme = 'sepa_core';
  m.createdAt = new Date();
  m.updatedAt = new Date();
  return m;
}

// ==========================================================================
// Tests
// ==========================================================================

describe('GoCardless Mandate Lifecycle', () => {
  // -----------------------------------------------------------------------
  // canTransitionMandate() — standalone function
  // -----------------------------------------------------------------------

  describe('canTransitionMandate()', () => {
    it('PENDING_CUSTOMER_APPROVAL → PENDING_SUBMISSION is valid', () => {
      expect(canTransitionMandate(MandateStatus.PENDING_CUSTOMER_APPROVAL, MandateStatus.PENDING_SUBMISSION)).toBe(true);
    });

    it('PENDING_CUSTOMER_APPROVAL → CANCELLED is valid', () => {
      expect(canTransitionMandate(MandateStatus.PENDING_CUSTOMER_APPROVAL, MandateStatus.CANCELLED)).toBe(true);
    });

    it('PENDING_SUBMISSION → SUBMITTED is valid', () => {
      expect(canTransitionMandate(MandateStatus.PENDING_SUBMISSION, MandateStatus.SUBMITTED)).toBe(true);
    });

    it('PENDING_SUBMISSION → FAILED is valid', () => {
      expect(canTransitionMandate(MandateStatus.PENDING_SUBMISSION, MandateStatus.FAILED)).toBe(true);
    });

    it('PENDING_SUBMISSION → CANCELLED is valid', () => {
      expect(canTransitionMandate(MandateStatus.PENDING_SUBMISSION, MandateStatus.CANCELLED)).toBe(true);
    });

    it('SUBMITTED → ACTIVE is valid', () => {
      expect(canTransitionMandate(MandateStatus.SUBMITTED, MandateStatus.ACTIVE)).toBe(true);
    });

    it('SUBMITTED → FAILED is valid', () => {
      expect(canTransitionMandate(MandateStatus.SUBMITTED, MandateStatus.FAILED)).toBe(true);
    });

    it('ACTIVE → CANCELLED is valid', () => {
      expect(canTransitionMandate(MandateStatus.ACTIVE, MandateStatus.CANCELLED)).toBe(true);
    });

    it('ACTIVE → EXPIRED is valid', () => {
      expect(canTransitionMandate(MandateStatus.ACTIVE, MandateStatus.EXPIRED)).toBe(true);
    });

    it('ACTIVE → CONSUMED is valid', () => {
      expect(canTransitionMandate(MandateStatus.ACTIVE, MandateStatus.CONSUMED)).toBe(true);
    });

    it('ACTIVE → SUSPENDED_BY_PAYER is valid', () => {
      expect(canTransitionMandate(MandateStatus.ACTIVE, MandateStatus.SUSPENDED_BY_PAYER)).toBe(true);
    });

    it('SUSPENDED_BY_PAYER → ACTIVE is valid (reinstatement)', () => {
      expect(canTransitionMandate(MandateStatus.SUSPENDED_BY_PAYER, MandateStatus.ACTIVE)).toBe(true);
    });

    // Invalid transitions
    it('CANCELLED → ACTIVE is invalid (terminal state)', () => {
      expect(canTransitionMandate(MandateStatus.CANCELLED, MandateStatus.ACTIVE)).toBe(false);
    });

    it('FAILED → ACTIVE is invalid (terminal state)', () => {
      expect(canTransitionMandate(MandateStatus.FAILED, MandateStatus.ACTIVE)).toBe(false);
    });

    it('EXPIRED → ACTIVE is invalid (terminal state)', () => {
      expect(canTransitionMandate(MandateStatus.EXPIRED, MandateStatus.ACTIVE)).toBe(false);
    });

    it('CONSUMED → ACTIVE is invalid (terminal state)', () => {
      expect(canTransitionMandate(MandateStatus.CONSUMED, MandateStatus.ACTIVE)).toBe(false);
    });

    it('PENDING_CUSTOMER_APPROVAL → ACTIVE is invalid (skip not allowed)', () => {
      expect(canTransitionMandate(MandateStatus.PENDING_CUSTOMER_APPROVAL, MandateStatus.ACTIVE)).toBe(false);
    });

    it('ACTIVE → PENDING_SUBMISSION is invalid (backward transition)', () => {
      expect(canTransitionMandate(MandateStatus.ACTIVE, MandateStatus.PENDING_SUBMISSION)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // isTerminalMandateStatus()
  // -----------------------------------------------------------------------

  describe('isTerminalMandateStatus()', () => {
    it('FAILED is terminal', () => {
      expect(isTerminalMandateStatus(MandateStatus.FAILED)).toBe(true);
    });

    it('CANCELLED is terminal', () => {
      expect(isTerminalMandateStatus(MandateStatus.CANCELLED)).toBe(true);
    });

    it('EXPIRED is terminal', () => {
      expect(isTerminalMandateStatus(MandateStatus.EXPIRED)).toBe(true);
    });

    it('CONSUMED is terminal', () => {
      expect(isTerminalMandateStatus(MandateStatus.CONSUMED)).toBe(true);
    });

    it('BLOCKED is terminal', () => {
      expect(isTerminalMandateStatus(MandateStatus.BLOCKED)).toBe(true);
    });

    it('ACTIVE is NOT terminal', () => {
      expect(isTerminalMandateStatus(MandateStatus.ACTIVE)).toBe(false);
    });

    it('PENDING_SUBMISSION is NOT terminal', () => {
      expect(isTerminalMandateStatus(MandateStatus.PENDING_SUBMISSION)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // GoCardlessMandateEntity instance methods
  // -----------------------------------------------------------------------

  describe('GoCardlessMandateEntity.canTransitionTo()', () => {
    it('returns true for valid transition', () => {
      const mandate = makeMandateInStatus(MandateStatus.PENDING_SUBMISSION);
      expect(mandate.canTransitionTo(MandateStatus.ACTIVE)).toBe(false);
      expect(mandate.canTransitionTo(MandateStatus.SUBMITTED)).toBe(true);
    });

    it('returns false for terminal state', () => {
      const mandate = makeMandateInStatus(MandateStatus.CANCELLED);
      expect(mandate.canTransitionTo(MandateStatus.ACTIVE)).toBe(false);
    });
  });

  describe('GoCardlessMandateEntity.transition()', () => {
    it('transitions PENDING_SUBMISSION → SUBMITTED successfully', () => {
      const mandate = makeMandateInStatus(MandateStatus.PENDING_SUBMISSION);
      mandate.transition(MandateStatus.SUBMITTED);
      expect(mandate.status).toBe(MandateStatus.SUBMITTED);
    });

    it('transitions SUBMITTED → ACTIVE successfully', () => {
      const mandate = makeMandateInStatus(MandateStatus.SUBMITTED);
      mandate.transition(MandateStatus.ACTIVE);
      expect(mandate.status).toBe(MandateStatus.ACTIVE);
    });

    it('transitions ACTIVE → CANCELLED successfully', () => {
      const mandate = makeMandateInStatus(MandateStatus.ACTIVE);
      mandate.transition(MandateStatus.CANCELLED);
      expect(mandate.status).toBe(MandateStatus.CANCELLED);
    });

    it('transitions ACTIVE → EXPIRED successfully', () => {
      const mandate = makeMandateInStatus(MandateStatus.ACTIVE);
      mandate.transition(MandateStatus.EXPIRED);
      expect(mandate.status).toBe(MandateStatus.EXPIRED);
    });

    it('throws on invalid transition CANCELLED → ACTIVE', () => {
      const mandate = makeMandateInStatus(MandateStatus.CANCELLED);
      expect(() => mandate.transition(MandateStatus.ACTIVE)).toThrow(
        'Invalid mandate transition: cancelled → active',
      );
    });

    it('throws on invalid transition FAILED → SUBMITTED', () => {
      const mandate = makeMandateInStatus(MandateStatus.FAILED);
      expect(() => mandate.transition(MandateStatus.SUBMITTED)).toThrow(
        'Invalid mandate transition: failed → submitted',
      );
    });

    it('throws on invalid skip PENDING_CUSTOMER_APPROVAL → ACTIVE', () => {
      const mandate = makeMandateInStatus(MandateStatus.PENDING_CUSTOMER_APPROVAL);
      expect(() => mandate.transition(MandateStatus.ACTIVE)).toThrow(
        'Invalid mandate transition',
      );
    });
  });

  // -----------------------------------------------------------------------
  // isTerminal() instance method
  // -----------------------------------------------------------------------

  describe('GoCardlessMandateEntity.isTerminal()', () => {
    it('returns true for CANCELLED mandate', () => {
      const mandate = makeMandateInStatus(MandateStatus.CANCELLED);
      expect(mandate.isTerminal()).toBe(true);
    });

    it('returns false for ACTIVE mandate', () => {
      const mandate = makeMandateInStatus(MandateStatus.ACTIVE);
      expect(mandate.isTerminal()).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // isActive() / canCharge()
  // -----------------------------------------------------------------------

  describe('Business methods', () => {
    it('isActive() returns true only for ACTIVE status', () => {
      expect(makeMandateInStatus(MandateStatus.ACTIVE).isActive()).toBe(true);
      expect(makeMandateInStatus(MandateStatus.PENDING_SUBMISSION).isActive()).toBe(false);
      expect(makeMandateInStatus(MandateStatus.CANCELLED).isActive()).toBe(false);
    });

    it('canCharge() returns true only for ACTIVE status', () => {
      expect(makeMandateInStatus(MandateStatus.ACTIVE).canCharge()).toBe(true);
      expect(makeMandateInStatus(MandateStatus.EXPIRED).canCharge()).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Full lifecycle: happy path
  // -----------------------------------------------------------------------

  describe('Full lifecycle happy path', () => {
    it('traverses PENDING_CUSTOMER_APPROVAL → PENDING_SUBMISSION → SUBMITTED → ACTIVE → EXPIRED', () => {
      const mandate = makeMandateInStatus(MandateStatus.PENDING_CUSTOMER_APPROVAL);

      mandate.transition(MandateStatus.PENDING_SUBMISSION);
      expect(mandate.status).toBe(MandateStatus.PENDING_SUBMISSION);

      mandate.transition(MandateStatus.SUBMITTED);
      expect(mandate.status).toBe(MandateStatus.SUBMITTED);

      mandate.transition(MandateStatus.ACTIVE);
      expect(mandate.status).toBe(MandateStatus.ACTIVE);
      expect(mandate.isActive()).toBe(true);
      expect(mandate.canCharge()).toBe(true);

      mandate.transition(MandateStatus.EXPIRED);
      expect(mandate.status).toBe(MandateStatus.EXPIRED);
      expect(mandate.isTerminal()).toBe(true);
      expect(mandate.isActive()).toBe(false);
    });

    it('allows cancellation from any non-terminal pre-active state', () => {
      const m1 = makeMandateInStatus(MandateStatus.PENDING_CUSTOMER_APPROVAL);
      m1.transition(MandateStatus.CANCELLED);
      expect(m1.status).toBe(MandateStatus.CANCELLED);

      const m2 = makeMandateInStatus(MandateStatus.PENDING_SUBMISSION);
      m2.transition(MandateStatus.CANCELLED);
      expect(m2.status).toBe(MandateStatus.CANCELLED);

      const m3 = makeMandateInStatus(MandateStatus.SUBMITTED);
      m3.transition(MandateStatus.CANCELLED);
      expect(m3.status).toBe(MandateStatus.CANCELLED);

      const m4 = makeMandateInStatus(MandateStatus.ACTIVE);
      m4.transition(MandateStatus.CANCELLED);
      expect(m4.status).toBe(MandateStatus.CANCELLED);
    });
  });
});
