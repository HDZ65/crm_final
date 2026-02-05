import { SystemDebitConfigurationEntity } from '../entities/system-debit-configuration.entity';
import { CompanyDebitConfigurationEntity } from '../entities/company-debit-configuration.entity';
import { ClientDebitConfigurationEntity } from '../entities/client-debit-configuration.entity';
import { ContractDebitConfigurationEntity } from '../entities/contract-debit-configuration.entity';
import { CutoffConfigurationEntity } from '../entities/cutoff-configuration.entity';

export interface IConfigurationRepository {
  findSystemConfig(organisationId: string): Promise<SystemDebitConfigurationEntity | null>;
  findCompanyConfig(societeId: string): Promise<CompanyDebitConfigurationEntity | null>;
  findClientConfig(clientId: string): Promise<ClientDebitConfigurationEntity | null>;
  findContractConfig(contratId: string): Promise<ContractDebitConfigurationEntity | null>;
  findCutoffConfig(id: string): Promise<CutoffConfigurationEntity | null>;
  saveSystemConfig(entity: SystemDebitConfigurationEntity): Promise<SystemDebitConfigurationEntity>;
  saveCompanyConfig(entity: CompanyDebitConfigurationEntity): Promise<CompanyDebitConfigurationEntity>;
  saveClientConfig(entity: ClientDebitConfigurationEntity): Promise<ClientDebitConfigurationEntity>;
  saveContractConfig(entity: ContractDebitConfigurationEntity): Promise<ContractDebitConfigurationEntity>;
}
