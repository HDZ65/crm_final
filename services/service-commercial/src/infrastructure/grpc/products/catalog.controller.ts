import { Controller } from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import type { CalculatePriceRequest, CalculatePriceResponse } from '@proto/products';
import { TarificationService } from '../../../domain/products/services/tarification.engine';

@Controller()
export class CatalogController {
  constructor(private readonly tarificationService: TarificationService) {}

  @GrpcMethod('CatalogService', 'CalculatePrice')
  async calculatePrice(data: CalculatePriceRequest): Promise<CalculatePriceResponse> {
    if (!data.produit_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'produit_id est requis',
      });
    }

    if (data.quantite <= 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'quantite doit etre superieure a 0',
      });
    }

    try {
      const prix = await this.tarificationService.calculate(data.produit_id, data.quantite, {
        grilleTarifaireId: data.grille_tarifaire_id || undefined,
        remiseAdditionnelle: data.remise_additionnelle,
      });

      return {
        prix_unitaire: prix.prixUnitaire,
        prix_apres_remise: prix.prixApresRemise,
        prix_total_ht: prix.prixTotalHt,
        tva: prix.tva,
        prix_total_ttc: prix.prixTotalTtc,
        promotion_appliquee: prix.promotionAppliquee,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Erreur de calcul tarifaire';
      const code = message.includes('introuvable') ? status.NOT_FOUND : status.INTERNAL;

      throw new RpcException({
        code,
        message,
      });
    }
  }
}
