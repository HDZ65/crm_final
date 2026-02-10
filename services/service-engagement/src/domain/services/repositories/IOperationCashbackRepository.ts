import {
  OperationCashback,
  CashbackStatut,
  CashbackType,
} from '../entities/operation-cashback.entity';

export interface IOperationCashbackRepository {
  findById(id: string): Promise<OperationCashback | null>;
  findAll(
    filters?: {
      organisationId?: string;
      clientId?: string;
      statut?: CashbackStatut;
      type?: CashbackType;
      search?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: OperationCashback[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findByClient(
    clientId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: OperationCashback[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  save(entity: OperationCashback): Promise<OperationCashback>;
  delete(id: string): Promise<boolean>;
}
