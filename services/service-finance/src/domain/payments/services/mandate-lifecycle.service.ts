import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import {
  GoCardlessMandateEntity,
  MandateStatus,
} from '../entities/gocardless-mandate.entity';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateMandateInput {
  clientId: string;
  organisationId: string;
  mandateId: string;
  rum: string;
  scheme?: string;
  bankName?: string;
  accountHolderName?: string;
  accountNumberEnding?: string;
  customerId?: string;
  customerBankAccountId?: string;
}

export interface MandateRevocationResult {
  id: string;
  mandateId: string;
  previousStatus: MandateStatus;
  newStatus: MandateStatus;
  reason?: string;
}

export interface ExpiredMandateResult {
  mandateId: string;
  previousStatus: MandateStatus;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class MandateLifecycleService {
  private readonly logger = new Logger(MandateLifecycleService.name);

  constructor(
    @InjectRepository(GoCardlessMandateEntity)
    private readonly mandateRepo: Repository<GoCardlessMandateEntity>,
  ) {}

  // -----------------------------------------------------------------------
  // createMandate — Create a new mandate with PENDING_CUSTOMER_APPROVAL
  // -----------------------------------------------------------------------

  async createMandate(input: CreateMandateInput): Promise<GoCardlessMandateEntity> {
    const existing = await this.mandateRepo.findOne({
      where: { mandateId: input.mandateId },
    });

    if (existing) {
      throw new Error(`Mandate with GoCardless ID ${input.mandateId} already exists`);
    }

    const mandate = new GoCardlessMandateEntity();
    mandate.clientId = input.clientId;
    mandate.societeId = input.organisationId;
    mandate.mandateId = input.mandateId;
    mandate.rum = input.rum;
    mandate.status = MandateStatus.PENDING_CUSTOMER_APPROVAL;
    mandate.scheme = input.scheme ?? 'sepa_core';
    mandate.bankName = input.bankName ?? null as any;
    mandate.accountHolderName = input.accountHolderName ?? null as any;
    mandate.accountNumberEnding = input.accountNumberEnding ?? null as any;
    mandate.customerId = input.customerId ?? null as any;
    mandate.customerBankAccountId = input.customerBankAccountId ?? null as any;

    const saved = await this.mandateRepo.save(mandate);
    this.logger.log(`Created mandate ${saved.id} (GC: ${input.mandateId}) for client ${input.clientId}`);

    return saved;
  }

  // -----------------------------------------------------------------------
  // activateMandate — Transition mandate to ACTIVE
  // -----------------------------------------------------------------------

  async activateMandate(mandateId: string): Promise<GoCardlessMandateEntity> {
    const mandate = await this.findMandateOrFail(mandateId);

    mandate.transition(MandateStatus.ACTIVE);
    const saved = await this.mandateRepo.save(mandate);

    this.logger.log(`Activated mandate ${mandateId} (was: ${mandate.status})`);
    return saved;
  }

  // -----------------------------------------------------------------------
  // revokeMandate — Cancel a mandate with an optional reason
  // -----------------------------------------------------------------------

  async revokeMandate(mandateId: string, reason?: string): Promise<MandateRevocationResult> {
    const mandate = await this.findMandateOrFail(mandateId);
    const previousStatus = mandate.status;

    mandate.transition(MandateStatus.CANCELLED);
    await this.mandateRepo.save(mandate);

    this.logger.log(
      `Revoked mandate ${mandateId}: ${previousStatus} → CANCELLED${reason ? ` (reason: ${reason})` : ''}`,
    );

    return {
      id: mandate.id,
      mandateId: mandate.mandateId,
      previousStatus,
      newStatus: MandateStatus.CANCELLED,
      reason,
    };
  }

  // -----------------------------------------------------------------------
  // checkExpiredMandates — Find ACTIVE mandates past expiry, mark EXPIRED
  // -----------------------------------------------------------------------

  async checkExpiredMandates(): Promise<ExpiredMandateResult[]> {
    const now = new Date();

    // Find ACTIVE mandates where nextPossibleChargeDate is in the past
    const expired = await this.mandateRepo.find({
      where: {
        status: MandateStatus.ACTIVE,
        nextPossibleChargeDate: LessThan(now),
      },
    });

    const results: ExpiredMandateResult[] = [];

    for (const mandate of expired) {
      const previousStatus = mandate.status;

      if (mandate.canTransitionTo(MandateStatus.EXPIRED)) {
        mandate.transition(MandateStatus.EXPIRED);
        await this.mandateRepo.save(mandate);

        results.push({
          mandateId: mandate.mandateId,
          previousStatus,
        });

        this.logger.log(`Expired mandate ${mandate.mandateId} (charge date: ${mandate.nextPossibleChargeDate})`);
      }
    }

    if (results.length > 0) {
      this.logger.log(`Expired ${results.length} mandate(s)`);
    }

    return results;
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private async findMandateOrFail(mandateId: string): Promise<GoCardlessMandateEntity> {
    const mandate = await this.mandateRepo.findOne({
      where: { mandateId },
    });

    if (!mandate) {
      throw new Error(`Mandate not found: ${mandateId}`);
    }

    return mandate;
  }
}
