import { ReportNegatifEntity } from '../entities/report-negatif.entity';

export interface IReportNegatifRepository {
  findById(id: string): Promise<ReportNegatifEntity | null>;
  findAll(filters?: {
    organisationId?: string;
    apporteurId?: string;
    statutReport?: string;
  }): Promise<ReportNegatifEntity[]>;
  save(entity: ReportNegatifEntity): Promise<ReportNegatifEntity>;
  delete(id: string): Promise<void>;
}
