import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigurationResolverService, ConfigurationError } from './configuration-resolver.service.js';
import { ContractDebitConfigurationEntity } from './entities/contract-debit-configuration.entity.js';
import { ClientDebitConfigurationEntity } from './entities/client-debit-configuration.entity.js';
import { CompanyDebitConfigurationEntity } from './entities/company-debit-configuration.entity.js';
import { SystemDebitConfigurationEntity, DebitDateMode, DebitBatch, DateShiftStrategy } from './entities/system-debit-configuration.entity.js';
describe('ConfigurationResolverService', () => {
    let service;
    const mockContractRepo = { findOne: jest.fn() };
    const mockClientRepo = { findOne: jest.fn() };
    const mockCompanyRepo = { findOne: jest.fn() };
    const mockSystemRepo = { findOne: jest.fn() };
    const baseConfig = {
        mode: DebitDateMode.BATCH,
        batch: DebitBatch.L1,
        fixedDay: null,
        shiftStrategy: DateShiftStrategy.NEXT_BUSINESS_DAY,
        holidayZoneId: 'zone-fr',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const mockContractConfig = {
        ...baseConfig,
        id: 'contract-config-1',
        organisationId: 'org-1',
        contratId: 'contrat-1',
    };
    const mockClientConfig = {
        ...baseConfig,
        id: 'client-config-1',
        organisationId: 'org-1',
        clientId: 'client-1',
        batch: DebitBatch.L2,
    };
    const mockCompanyConfig = {
        ...baseConfig,
        id: 'company-config-1',
        organisationId: 'org-1',
        societeId: 'societe-1',
        batch: DebitBatch.L3,
        cutoffConfigId: null,
    };
    const mockSystemConfig = {
        id: 'system-config-1',
        organisationId: 'org-1',
        defaultMode: DebitDateMode.BATCH,
        defaultBatch: DebitBatch.L4,
        defaultFixedDay: null,
        shiftStrategy: DateShiftStrategy.NEXT_BUSINESS_DAY,
        holidayZoneId: 'zone-fr',
        cutoffConfigId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                ConfigurationResolverService,
                { provide: getRepositoryToken(ContractDebitConfigurationEntity), useValue: mockContractRepo },
                { provide: getRepositoryToken(ClientDebitConfigurationEntity), useValue: mockClientRepo },
                { provide: getRepositoryToken(CompanyDebitConfigurationEntity), useValue: mockCompanyRepo },
                { provide: getRepositoryToken(SystemDebitConfigurationEntity), useValue: mockSystemRepo },
            ],
        }).compile();
        service = module.get(ConfigurationResolverService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('resolve', () => {
        it('should resolve contract-level configuration (highest priority)', async () => {
            mockContractRepo.findOne.mockResolvedValue(mockContractConfig);
            const result = await service.resolve({
                organisationId: 'org-1',
                contratId: 'contrat-1',
                clientId: 'client-1',
                societeId: 'societe-1',
            });
            expect(result.appliedLevel).toBe('contract');
            expect(result.appliedConfigId).toBe('contract-config-1');
            expect(result.batch).toBe(DebitBatch.L1);
            expect(mockClientRepo.findOne).not.toHaveBeenCalled();
            expect(mockCompanyRepo.findOne).not.toHaveBeenCalled();
            expect(mockSystemRepo.findOne).not.toHaveBeenCalled();
        });
        it('should resolve client-level configuration when contract config not found', async () => {
            mockContractRepo.findOne.mockResolvedValue(null);
            mockClientRepo.findOne.mockResolvedValue(mockClientConfig);
            const result = await service.resolve({
                organisationId: 'org-1',
                contratId: 'contrat-1',
                clientId: 'client-1',
                societeId: 'societe-1',
            });
            expect(result.appliedLevel).toBe('client');
            expect(result.appliedConfigId).toBe('client-config-1');
            expect(result.batch).toBe(DebitBatch.L2);
            expect(mockCompanyRepo.findOne).not.toHaveBeenCalled();
            expect(mockSystemRepo.findOne).not.toHaveBeenCalled();
        });
        it('should resolve company-level configuration when client config not found', async () => {
            mockContractRepo.findOne.mockResolvedValue(null);
            mockClientRepo.findOne.mockResolvedValue(null);
            mockCompanyRepo.findOne.mockResolvedValue(mockCompanyConfig);
            const result = await service.resolve({
                organisationId: 'org-1',
                contratId: 'contrat-1',
                clientId: 'client-1',
                societeId: 'societe-1',
            });
            expect(result.appliedLevel).toBe('company');
            expect(result.appliedConfigId).toBe('company-config-1');
            expect(result.batch).toBe(DebitBatch.L3);
            expect(mockSystemRepo.findOne).not.toHaveBeenCalled();
        });
        it('should resolve system-level configuration (lowest priority fallback)', async () => {
            mockContractRepo.findOne.mockResolvedValue(null);
            mockClientRepo.findOne.mockResolvedValue(null);
            mockCompanyRepo.findOne.mockResolvedValue(null);
            mockSystemRepo.findOne.mockResolvedValue(mockSystemConfig);
            const result = await service.resolve({
                organisationId: 'org-1',
                contratId: 'contrat-1',
                clientId: 'client-1',
                societeId: 'societe-1',
            });
            expect(result.appliedLevel).toBe('system');
            expect(result.appliedConfigId).toBe('system-config-1');
            expect(result.batch).toBe(DebitBatch.L4);
        });
        it('should skip contract lookup when contratId not provided', async () => {
            mockClientRepo.findOne.mockResolvedValue(mockClientConfig);
            const result = await service.resolve({
                organisationId: 'org-1',
                clientId: 'client-1',
                societeId: 'societe-1',
            });
            expect(result.appliedLevel).toBe('client');
            expect(mockContractRepo.findOne).not.toHaveBeenCalled();
        });
        it('should skip client lookup when clientId not provided', async () => {
            mockCompanyRepo.findOne.mockResolvedValue(mockCompanyConfig);
            const result = await service.resolve({
                organisationId: 'org-1',
                societeId: 'societe-1',
            });
            expect(result.appliedLevel).toBe('company');
            expect(mockContractRepo.findOne).not.toHaveBeenCalled();
            expect(mockClientRepo.findOne).not.toHaveBeenCalled();
        });
        it('should throw ConfigurationError when no configuration found at any level', async () => {
            mockContractRepo.findOne.mockResolvedValue(null);
            mockClientRepo.findOne.mockResolvedValue(null);
            mockCompanyRepo.findOne.mockResolvedValue(null);
            mockSystemRepo.findOne.mockResolvedValue(null);
            await expect(service.resolve({
                organisationId: 'org-1',
                contratId: 'contrat-1',
                clientId: 'client-1',
                societeId: 'societe-1',
            })).rejects.toThrow(ConfigurationError);
        });
        it('should throw ConfigurationError when holidayZoneId is missing', async () => {
            const configWithoutZone = { ...mockContractConfig, holidayZoneId: null };
            mockContractRepo.findOne.mockResolvedValue(configWithoutZone);
            await expect(service.resolve({
                organisationId: 'org-1',
                contratId: 'contrat-1',
            })).rejects.toThrow(ConfigurationError);
        });
    });
    describe('getResolutionTrace', () => {
        it('should return all available configurations', async () => {
            mockContractRepo.findOne.mockResolvedValue(mockContractConfig);
            mockClientRepo.findOne.mockResolvedValue(mockClientConfig);
            mockCompanyRepo.findOne.mockResolvedValue(mockCompanyConfig);
            mockSystemRepo.findOne.mockResolvedValue(mockSystemConfig);
            const result = await service.getResolutionTrace({
                organisationId: 'org-1',
                contratId: 'contrat-1',
                clientId: 'client-1',
                societeId: 'societe-1',
            });
            expect(result.contractConfig).toBeDefined();
            expect(result.clientConfig).toBeDefined();
            expect(result.companyConfig).toBeDefined();
            expect(result.systemConfig).toBeDefined();
            expect(result.resolvedLevel).toBe('contract');
        });
        it('should report correct resolved level based on priority', async () => {
            mockContractRepo.findOne.mockResolvedValue(null);
            mockClientRepo.findOne.mockResolvedValue(null);
            mockCompanyRepo.findOne.mockResolvedValue(mockCompanyConfig);
            mockSystemRepo.findOne.mockResolvedValue(mockSystemConfig);
            const result = await service.getResolutionTrace({
                organisationId: 'org-1',
                contratId: 'contrat-1',
                clientId: 'client-1',
                societeId: 'societe-1',
            });
            expect(result.contractConfig).toBeUndefined();
            expect(result.clientConfig).toBeUndefined();
            expect(result.companyConfig).toBeDefined();
            expect(result.systemConfig).toBeDefined();
            expect(result.resolvedLevel).toBe('company');
        });
    });
});
//# sourceMappingURL=configuration-resolver.service.spec.js.map