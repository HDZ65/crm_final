import { ContratStatus, isValidTransition } from './contrat-status.enum';

describe('ContratStatus Enum', () => {
  describe('isValidTransition', () => {
    describe('valid transitions', () => {
      it('should allow DRAFT → ACTIVE', () => {
        expect(isValidTransition(ContratStatus.DRAFT, ContratStatus.ACTIVE)).toBe(true);
      });

      it('should allow DRAFT → TERMINATED', () => {
        expect(isValidTransition(ContratStatus.DRAFT, ContratStatus.TERMINATED)).toBe(true);
      });

      it('should allow ACTIVE → SUSPENDED', () => {
        expect(isValidTransition(ContratStatus.ACTIVE, ContratStatus.SUSPENDED)).toBe(true);
      });

      it('should allow ACTIVE → TERMINATED', () => {
        expect(isValidTransition(ContratStatus.ACTIVE, ContratStatus.TERMINATED)).toBe(true);
      });

      it('should allow ACTIVE → CLOSED', () => {
        expect(isValidTransition(ContratStatus.ACTIVE, ContratStatus.CLOSED)).toBe(true);
      });

      it('should allow SUSPENDED → ACTIVE', () => {
        expect(isValidTransition(ContratStatus.SUSPENDED, ContratStatus.ACTIVE)).toBe(true);
      });

      it('should allow SUSPENDED → TERMINATED', () => {
        expect(isValidTransition(ContratStatus.SUSPENDED, ContratStatus.TERMINATED)).toBe(true);
      });
    });

    describe('invalid transitions', () => {
      it('should reject TERMINATED → ACTIVE', () => {
        expect(isValidTransition(ContratStatus.TERMINATED, ContratStatus.ACTIVE)).toBe(false);
      });

      it('should reject CLOSED → DRAFT', () => {
        expect(isValidTransition(ContratStatus.CLOSED, ContratStatus.DRAFT)).toBe(false);
      });

      it('should reject DRAFT → SUSPENDED', () => {
        expect(isValidTransition(ContratStatus.DRAFT, ContratStatus.SUSPENDED)).toBe(false);
      });

      it('should reject DRAFT → CLOSED', () => {
        expect(isValidTransition(ContratStatus.DRAFT, ContratStatus.CLOSED)).toBe(false);
      });

      it('should reject SUSPENDED → CLOSED', () => {
        expect(isValidTransition(ContratStatus.SUSPENDED, ContratStatus.CLOSED)).toBe(false);
      });
    });

    describe('terminal states', () => {
      it('should reject TERMINATED → TERMINATED', () => {
        expect(isValidTransition(ContratStatus.TERMINATED, ContratStatus.TERMINATED)).toBe(false);
      });

      it('should reject CLOSED → CLOSED', () => {
        expect(isValidTransition(ContratStatus.CLOSED, ContratStatus.CLOSED)).toBe(false);
      });
    });
  });
});
