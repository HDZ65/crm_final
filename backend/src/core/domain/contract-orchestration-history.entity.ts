import { BaseEntity } from './base.entity';

export type OrchestrationOperation =
  | 'activate'
  | 'suspend'
  | 'terminate'
  | 'port_in';

export type OrchestrationStatus = 'pending' | 'success' | 'failure';

export interface ContractOrchestrationHistoryProps {
  id?: string;
  contractId: string;
  operation: OrchestrationOperation;
  status: OrchestrationStatus;
  payload?: Record<string, unknown> | null;
  responsePayload?: Record<string, unknown> | null;
  errorMessage?: string | null;
  startedAt: Date;
  finishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContractOrchestrationHistoryEntity extends BaseEntity {
  contractId: string;
  operation: OrchestrationOperation;
  status: OrchestrationStatus;
  payload?: Record<string, unknown> | null;
  responsePayload?: Record<string, unknown> | null;
  errorMessage?: string | null;
  startedAt: Date;
  finishedAt?: Date | null;

  constructor(props: ContractOrchestrationHistoryProps) {
    super(props);
    this.contractId = props.contractId;
    this.operation = props.operation;
    this.status = props.status;
    this.payload = props.payload ?? null;
    this.responsePayload = props.responsePayload ?? null;
    this.errorMessage = props.errorMessage ?? null;
    this.startedAt = props.startedAt;
    this.finishedAt = props.finishedAt ?? null;
  }
}
