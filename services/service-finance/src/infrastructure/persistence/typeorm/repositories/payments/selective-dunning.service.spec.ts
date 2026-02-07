import { describe, expect, it } from 'bun:test';
import { ScheduleStatus } from '../../../../../domain/payments/entities/schedule.entity';
import { SelectiveDunningService } from './selective-dunning.service';

describe('SelectiveDunningService', () => {
  it('recalculates bundle discounts when conciergerie is unpaid', async () => {
    let removeDiscountsCalled = 0;

    const scheduleRepository = {
      find: async () => [],
      save: async () => [],
    };

    const consolidatedBillingService = {
      removeBundleDiscountsForClient: async () => {
        removeDiscountsCalled += 1;
        return {
          factureId: 'fac-1',
          updatedLines: 2,
        };
      },
    };

    const service = new SelectiveDunningService(
      scheduleRepository as any,
      consolidatedBillingService as any,
    );

    const result = await service.handleServiceNonPayment({
      organisationId: 'org-1',
      clientBaseId: 'client-1',
      serviceCode: 'conciergerie',
      factureId: 'fac-1',
    });

    expect(removeDiscountsCalled).toBe(1);
    expect(result.action).toBe('DISCOUNTS_RECALCULATED');
    expect(result.updatedLines).toBe(2);
    expect(result.suspendedScheduleIds).toEqual([]);
  });

  it('suspends only the unpaid service schedules for non-conciergerie defaults', async () => {
    const scheduleA = {
      id: 'sch-justi-1',
      status: ScheduleStatus.ACTIVE,
      metadata: { service_code: 'JUSTI_PLUS' },
    };

    const scheduleB = {
      id: 'sch-wincash-1',
      status: ScheduleStatus.ACTIVE,
      metadata: { service_code: 'WINCASH' },
    };

    const scheduleC = {
      id: 'sch-justi-2',
      status: ScheduleStatus.ACTIVE,
      metadata: { service_code: 'JUSTI_PLUS' },
    };

    let savedSchedules: any[] = [];
    const scheduleRepository = {
      find: async () => [scheduleA, scheduleB, scheduleC],
      save: async (schedules: any[]) => {
        savedSchedules = schedules;
        return schedules;
      },
    };

    let removeDiscountsCalled = 0;
    const consolidatedBillingService = {
      removeBundleDiscountsForClient: async () => {
        removeDiscountsCalled += 1;
        return {
          factureId: null,
          updatedLines: 0,
        };
      },
    };

    const service = new SelectiveDunningService(
      scheduleRepository as any,
      consolidatedBillingService as any,
    );

    const result = await service.handleServiceNonPayment({
      organisationId: 'org-1',
      clientBaseId: 'client-1',
      serviceCode: 'justi-plus',
      reason: 'UNPAID',
    });

    expect(removeDiscountsCalled).toBe(0);
    expect(result.action).toBe('SERVICE_SUSPENDED');
    expect(result.updatedLines).toBe(0);
    expect(result.suspendedScheduleIds).toEqual(['sch-justi-1', 'sch-justi-2']);
    expect(savedSchedules).toHaveLength(2);
    expect(savedSchedules[0].status).toBe(ScheduleStatus.PAUSED);
    expect(savedSchedules[1].status).toBe(ScheduleStatus.PAUSED);
    expect(scheduleB.status).toBe(ScheduleStatus.ACTIVE);
  });
});
