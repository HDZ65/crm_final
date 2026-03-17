import { Injectable, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import {
  type ActivationReelleEventPayload,
  ProvisioningSagaService,
} from '../../../../domain/provisioning/services';

// ---------------------------------------------------------------------------
// Payload brute entrante (tolère snake_case et camelCase)
// ---------------------------------------------------------------------------

interface IncomingActivationPayload {
  contratId?: string;
  contrat_id?: string;
  source?: 'SIM_LIVREE' | 'PREMIERE_CONNEXION';
  occurredAt?: string;
  occurred_at?: string;
  correlationId?: string;
  correlation_id?: string;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

@Injectable()
export class ActivationReelleHandler implements OnModuleInit {
  constructor(
    private readonly natsService: NatsService,
    private readonly sagaService: ProvisioningSagaService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Écouter les deux sujets : livraison SIM et première connexion réseau
    await this.natsService.subscribe<IncomingActivationPayload>(
      'crm.provisioning.sim.livree',
      (payload) => this.handle(payload, 'SIM_LIVREE'),
    );

    await this.natsService.subscribe<IncomingActivationPayload>(
      'crm.telecom.premiere_connexion',
      (payload) => this.handle(payload, 'PREMIERE_CONNEXION'),
    );
  }

  async handle(
    payload: IncomingActivationPayload,
    defaultSource: 'SIM_LIVREE' | 'PREMIERE_CONNEXION',
  ): Promise<void> {
    const contratId = payload.contratId || payload.contrat_id;
    if (!contratId) {
      return;
    }

    const event: ActivationReelleEventPayload = {
      contratId,
      source: payload.source || defaultSource,
      occurredAt: payload.occurredAt || payload.occurred_at,
      correlationId: payload.correlationId || payload.correlation_id,
    };

    await this.sagaService.processActivationReelle(event);
  }
}
