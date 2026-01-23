import {
  PortalPaymentSessionEntity,
  PortalSessionStatus,
  PortalSessionAction,
} from '../entities/portal-session.entity';

describe('PortalPaymentSessionEntity State Machine', () => {
  let session: PortalPaymentSessionEntity;

  beforeEach(() => {
    session = new PortalPaymentSessionEntity();
    session.id = 'test-session-id';
    session.status = PortalSessionStatus.CREATED;
    session.expiresAt = new Date(Date.now() + 60000);
    session.maxUses = 1;
    session.useCount = 0;
    session.allowedActions = [PortalSessionAction.PAY_BY_CARD];
  });

  describe('canTransitionTo', () => {
    describe('from CREATED', () => {
      it('should allow transition to ACTIVE', () => {
        session.status = PortalSessionStatus.CREATED;
        expect(session.canTransitionTo(PortalSessionStatus.ACTIVE)).toBe(true);
      });

      it('should allow transition to EXPIRED', () => {
        session.status = PortalSessionStatus.CREATED;
        expect(session.canTransitionTo(PortalSessionStatus.EXPIRED)).toBe(true);
      });

      it('should allow transition to CANCELLED', () => {
        session.status = PortalSessionStatus.CREATED;
        expect(session.canTransitionTo(PortalSessionStatus.CANCELLED)).toBe(true);
      });

      it('should NOT allow transition to REDIRECTED', () => {
        session.status = PortalSessionStatus.CREATED;
        expect(session.canTransitionTo(PortalSessionStatus.REDIRECTED)).toBe(false);
      });

      it('should NOT allow transition to COMPLETED', () => {
        session.status = PortalSessionStatus.CREATED;
        expect(session.canTransitionTo(PortalSessionStatus.COMPLETED)).toBe(false);
      });

      it('should NOT allow transition to FAILED', () => {
        session.status = PortalSessionStatus.CREATED;
        expect(session.canTransitionTo(PortalSessionStatus.FAILED)).toBe(false);
      });
    });

    describe('from ACTIVE', () => {
      it('should allow transition to REDIRECTED', () => {
        session.status = PortalSessionStatus.ACTIVE;
        expect(session.canTransitionTo(PortalSessionStatus.REDIRECTED)).toBe(true);
      });

      it('should allow transition to EXPIRED', () => {
        session.status = PortalSessionStatus.ACTIVE;
        expect(session.canTransitionTo(PortalSessionStatus.EXPIRED)).toBe(true);
      });

      it('should allow transition to CANCELLED', () => {
        session.status = PortalSessionStatus.ACTIVE;
        expect(session.canTransitionTo(PortalSessionStatus.CANCELLED)).toBe(true);
      });

      it('should NOT allow transition to CREATED', () => {
        session.status = PortalSessionStatus.ACTIVE;
        expect(session.canTransitionTo(PortalSessionStatus.CREATED)).toBe(false);
      });

      it('should NOT allow transition to COMPLETED', () => {
        session.status = PortalSessionStatus.ACTIVE;
        expect(session.canTransitionTo(PortalSessionStatus.COMPLETED)).toBe(false);
      });
    });

    describe('from REDIRECTED', () => {
      it('should allow transition to COMPLETED', () => {
        session.status = PortalSessionStatus.REDIRECTED;
        expect(session.canTransitionTo(PortalSessionStatus.COMPLETED)).toBe(true);
      });

      it('should allow transition to FAILED', () => {
        session.status = PortalSessionStatus.REDIRECTED;
        expect(session.canTransitionTo(PortalSessionStatus.FAILED)).toBe(true);
      });

      it('should allow transition to EXPIRED', () => {
        session.status = PortalSessionStatus.REDIRECTED;
        expect(session.canTransitionTo(PortalSessionStatus.EXPIRED)).toBe(true);
      });

      it('should NOT allow transition to ACTIVE', () => {
        session.status = PortalSessionStatus.REDIRECTED;
        expect(session.canTransitionTo(PortalSessionStatus.ACTIVE)).toBe(false);
      });

      it('should NOT allow transition to CANCELLED', () => {
        session.status = PortalSessionStatus.REDIRECTED;
        expect(session.canTransitionTo(PortalSessionStatus.CANCELLED)).toBe(false);
      });
    });

    describe('from terminal states', () => {
      const terminalStates = [
        PortalSessionStatus.COMPLETED,
        PortalSessionStatus.FAILED,
        PortalSessionStatus.EXPIRED,
        PortalSessionStatus.CANCELLED,
      ];

      const allStates = Object.values(PortalSessionStatus);

      terminalStates.forEach((terminalState) => {
        describe(`from ${terminalState}`, () => {
          allStates.forEach((targetState) => {
            it(`should NOT allow transition to ${targetState}`, () => {
              session.status = terminalState;
              expect(session.canTransitionTo(targetState)).toBe(false);
            });
          });
        });
      });
    });
  });

  describe('isTerminal', () => {
    it('should return true for COMPLETED', () => {
      session.status = PortalSessionStatus.COMPLETED;
      expect(session.isTerminal()).toBe(true);
    });

    it('should return true for FAILED', () => {
      session.status = PortalSessionStatus.FAILED;
      expect(session.isTerminal()).toBe(true);
    });

    it('should return true for EXPIRED', () => {
      session.status = PortalSessionStatus.EXPIRED;
      expect(session.isTerminal()).toBe(true);
    });

    it('should return true for CANCELLED', () => {
      session.status = PortalSessionStatus.CANCELLED;
      expect(session.isTerminal()).toBe(true);
    });

    it('should return false for CREATED', () => {
      session.status = PortalSessionStatus.CREATED;
      expect(session.isTerminal()).toBe(false);
    });

    it('should return false for ACTIVE', () => {
      session.status = PortalSessionStatus.ACTIVE;
      expect(session.isTerminal()).toBe(false);
    });

    it('should return false for REDIRECTED', () => {
      session.status = PortalSessionStatus.REDIRECTED;
      expect(session.isTerminal()).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('should return true when expiresAt is in the past', () => {
      session.expiresAt = new Date(Date.now() - 1000);
      expect(session.isExpired()).toBe(true);
    });

    it('should return false when expiresAt is in the future', () => {
      session.expiresAt = new Date(Date.now() + 60000);
      expect(session.isExpired()).toBe(false);
    });

    it('should handle edge case at exact expiry time', () => {
      session.expiresAt = new Date(Date.now());
      expect(session.isExpired()).toBe(true);
    });
  });

  describe('isActive', () => {
    it('should return true when status is ACTIVE and not expired', () => {
      session.status = PortalSessionStatus.ACTIVE;
      session.expiresAt = new Date(Date.now() + 60000);
      expect(session.isActive()).toBe(true);
    });

    it('should return false when status is ACTIVE but expired', () => {
      session.status = PortalSessionStatus.ACTIVE;
      session.expiresAt = new Date(Date.now() - 1000);
      expect(session.isActive()).toBe(false);
    });

    it('should return false when status is not ACTIVE', () => {
      session.status = PortalSessionStatus.CREATED;
      session.expiresAt = new Date(Date.now() + 60000);
      expect(session.isActive()).toBe(false);
    });
  });

  describe('canConsume', () => {
    it('should return true when not expired, not consumed, and uses available', () => {
      session.useCount = 0;
      session.maxUses = 1;
      session.consumedAt = null;
      session.expiresAt = new Date(Date.now() + 60000);
      expect(session.canConsume()).toBe(true);
    });

    it('should return false when already consumed', () => {
      session.useCount = 0;
      session.maxUses = 1;
      session.consumedAt = new Date();
      session.expiresAt = new Date(Date.now() + 60000);
      expect(session.canConsume()).toBe(false);
    });

    it('should return false when max uses reached', () => {
      session.useCount = 1;
      session.maxUses = 1;
      session.consumedAt = null;
      session.expiresAt = new Date(Date.now() + 60000);
      expect(session.canConsume()).toBe(false);
    });

    it('should return false when expired', () => {
      session.useCount = 0;
      session.maxUses = 1;
      session.consumedAt = null;
      session.expiresAt = new Date(Date.now() - 1000);
      expect(session.canConsume()).toBe(false);
    });

    it('should allow multiple uses when maxUses > 1', () => {
      session.useCount = 0;
      session.maxUses = 3;
      session.consumedAt = null;
      session.expiresAt = new Date(Date.now() + 60000);
      
      expect(session.canConsume()).toBe(true);
      
      session.useCount = 1;
      expect(session.canConsume()).toBe(true);
      
      session.useCount = 2;
      expect(session.canConsume()).toBe(true);
      
      session.useCount = 3;
      expect(session.canConsume()).toBe(false);
    });
  });

  describe('hasAction', () => {
    it('should return true for allowed action', () => {
      session.allowedActions = [PortalSessionAction.PAY_BY_CARD, PortalSessionAction.VIEW_PAYMENT];
      expect(session.hasAction(PortalSessionAction.PAY_BY_CARD)).toBe(true);
      expect(session.hasAction(PortalSessionAction.VIEW_PAYMENT)).toBe(true);
    });

    it('should return false for disallowed action', () => {
      session.allowedActions = [PortalSessionAction.PAY_BY_CARD];
      expect(session.hasAction(PortalSessionAction.SETUP_SEPA)).toBe(false);
      expect(session.hasAction(PortalSessionAction.PAY_BY_SEPA)).toBe(false);
    });

    it('should return false for empty allowed actions', () => {
      session.allowedActions = [];
      expect(session.hasAction(PortalSessionAction.PAY_BY_CARD)).toBe(false);
    });
  });
});

describe('State Machine Integration Scenarios', () => {
  let session: PortalPaymentSessionEntity;

  beforeEach(() => {
    session = new PortalPaymentSessionEntity();
    session.id = 'test-session-id';
    session.expiresAt = new Date(Date.now() + 900000);
    session.maxUses = 1;
    session.useCount = 0;
    session.allowedActions = [PortalSessionAction.PAY_BY_CARD];
  });

  describe('Happy Path: CREATED → ACTIVE → REDIRECTED → COMPLETED', () => {
    it('should allow full payment flow', () => {
      session.status = PortalSessionStatus.CREATED;
      expect(session.canTransitionTo(PortalSessionStatus.ACTIVE)).toBe(true);

      session.status = PortalSessionStatus.ACTIVE;
      expect(session.canTransitionTo(PortalSessionStatus.REDIRECTED)).toBe(true);

      session.status = PortalSessionStatus.REDIRECTED;
      expect(session.canTransitionTo(PortalSessionStatus.COMPLETED)).toBe(true);

      session.status = PortalSessionStatus.COMPLETED;
      expect(session.isTerminal()).toBe(true);
    });
  });

  describe('Failure Path: CREATED → ACTIVE → REDIRECTED → FAILED', () => {
    it('should allow payment failure flow', () => {
      session.status = PortalSessionStatus.CREATED;
      expect(session.canTransitionTo(PortalSessionStatus.ACTIVE)).toBe(true);

      session.status = PortalSessionStatus.ACTIVE;
      expect(session.canTransitionTo(PortalSessionStatus.REDIRECTED)).toBe(true);

      session.status = PortalSessionStatus.REDIRECTED;
      expect(session.canTransitionTo(PortalSessionStatus.FAILED)).toBe(true);

      session.status = PortalSessionStatus.FAILED;
      expect(session.isTerminal()).toBe(true);
    });
  });

  describe('Expiration at any non-terminal state', () => {
    const nonTerminalStates = [
      PortalSessionStatus.CREATED,
      PortalSessionStatus.ACTIVE,
      PortalSessionStatus.REDIRECTED,
    ];

    nonTerminalStates.forEach((state) => {
      it(`should allow expiration from ${state}`, () => {
        session.status = state;
        expect(session.canTransitionTo(PortalSessionStatus.EXPIRED)).toBe(true);
      });
    });
  });

  describe('Cancellation', () => {
    it('should allow cancellation from CREATED', () => {
      session.status = PortalSessionStatus.CREATED;
      expect(session.canTransitionTo(PortalSessionStatus.CANCELLED)).toBe(true);
    });

    it('should allow cancellation from ACTIVE', () => {
      session.status = PortalSessionStatus.ACTIVE;
      expect(session.canTransitionTo(PortalSessionStatus.CANCELLED)).toBe(true);
    });

    it('should NOT allow cancellation from REDIRECTED', () => {
      session.status = PortalSessionStatus.REDIRECTED;
      expect(session.canTransitionTo(PortalSessionStatus.CANCELLED)).toBe(false);
    });
  });

  describe('Backward transitions are forbidden', () => {
    it('should NOT allow ACTIVE → CREATED', () => {
      session.status = PortalSessionStatus.ACTIVE;
      expect(session.canTransitionTo(PortalSessionStatus.CREATED)).toBe(false);
    });

    it('should NOT allow REDIRECTED → ACTIVE', () => {
      session.status = PortalSessionStatus.REDIRECTED;
      expect(session.canTransitionTo(PortalSessionStatus.ACTIVE)).toBe(false);
    });

    it('should NOT allow REDIRECTED → CREATED', () => {
      session.status = PortalSessionStatus.REDIRECTED;
      expect(session.canTransitionTo(PortalSessionStatus.CREATED)).toBe(false);
    });
  });

  describe('Skip transitions are forbidden', () => {
    it('should NOT allow CREATED → REDIRECTED (skip ACTIVE)', () => {
      session.status = PortalSessionStatus.CREATED;
      expect(session.canTransitionTo(PortalSessionStatus.REDIRECTED)).toBe(false);
    });

    it('should NOT allow CREATED → COMPLETED (skip ACTIVE and REDIRECTED)', () => {
      session.status = PortalSessionStatus.CREATED;
      expect(session.canTransitionTo(PortalSessionStatus.COMPLETED)).toBe(false);
    });

    it('should NOT allow ACTIVE → COMPLETED (skip REDIRECTED)', () => {
      session.status = PortalSessionStatus.ACTIVE;
      expect(session.canTransitionTo(PortalSessionStatus.COMPLETED)).toBe(false);
    });
  });
});
