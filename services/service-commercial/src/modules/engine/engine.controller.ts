import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CommissionEngineService } from './commission-engine.service';
import { TypeReprise } from '../reprise/entities/reprise-commission.entity';

import type {
  CalculerCommissionRequest,
  CalculerCommissionResponse,
  GenererBordereauRequest,
  GenererBordereauResponse,
  DeclencherRepriseRequest,
  RepriseResponse,
} from '@crm/proto/commission';

const grpcToTypeReprise = (n: number): TypeReprise =>
  [TypeReprise.RESILIATION, TypeReprise.RESILIATION, TypeReprise.IMPAYE, TypeReprise.ANNULATION, TypeReprise.REGULARISATION][n] || TypeReprise.RESILIATION;

@Controller()
export class EngineController {
  constructor(private readonly engine: CommissionEngineService) {}

  @GrpcMethod('CommissionService', 'CalculerCommission')
  async calculer(req: CalculerCommissionRequest): Promise<CalculerCommissionResponse> {
    try {
      const result = await this.engine.calculerCommission({
        organisationId: req.organisation_id,
        apporteurId: req.apporteur_id,
        contratId: req.contrat_id,
        produitId: req.produit_id,
        typeProduit: req.type_produit,
        profilRemuneration: req.profil_remuneration,
        societeId: req.societe_id,
        canalVente: req.canal_vente,
        montantBase: parseFloat(req.montant_base),
        periode: req.periode,
      });

      return {
        commission: result.commission as unknown as CalculerCommissionResponse['commission'],
        bareme_applique: result.baremeApplique as unknown as CalculerCommissionResponse['bareme_applique'],
        primes: result.primes.map(p => ({
          palier_id: p.palierId,
          palier_nom: p.palierNom,
          montant: String(p.montant),
          type: p.type,
        })),
        montant_total: String(result.montantTotal),
      };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'GenererBordereau')
  async genererBordereau(req: GenererBordereauRequest): Promise<GenererBordereauResponse> {
    try {
      const result = await this.engine.genererBordereau(
        req.organisation_id,
        req.apporteur_id,
        req.periode,
        req.cree_par,
      );

      return {
        bordereau: result.bordereau as unknown as GenererBordereauResponse['bordereau'],
        summary: {
          nombre_commissions: result.summary.nombreCommissions,
          nombre_reprises: result.summary.nombreReprises,
          nombre_primes: result.summary.nombrePrimes,
          total_brut: String(result.summary.totalBrut),
          total_reprises: String(result.summary.totalReprises),
          total_net: String(result.summary.totalNet),
        },
      };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('CommissionService', 'DeclencherReprise')
  async declencherReprise(req: DeclencherRepriseRequest): Promise<RepriseResponse> {
    try {
      const reprise = await this.engine.declencherReprise(
        req.commission_id,
        grpcToTypeReprise(req.type_reprise),
        new Date(req.date_evenement),
        req.motif,
      );
      return { reprise: reprise as unknown as RepriseResponse['reprise'] };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}
