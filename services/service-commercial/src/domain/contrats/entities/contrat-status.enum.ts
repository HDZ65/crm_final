export enum ContratStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  CLOSED = 'CLOSED',
}

export const CONTRAT_TRANSITIONS: Record<ContratStatus, ContratStatus[]> = {
  [ContratStatus.DRAFT]: [ContratStatus.ACTIVE, ContratStatus.TERMINATED],
  [ContratStatus.ACTIVE]: [ContratStatus.SUSPENDED, ContratStatus.TERMINATED, ContratStatus.CLOSED],
  [ContratStatus.SUSPENDED]: [ContratStatus.ACTIVE, ContratStatus.TERMINATED],
  [ContratStatus.TERMINATED]: [],
  [ContratStatus.CLOSED]: [],
};

export function isValidTransition(from: ContratStatus, to: ContratStatus): boolean {
  return CONTRAT_TRANSITIONS[from]?.includes(to) ?? false;
}
