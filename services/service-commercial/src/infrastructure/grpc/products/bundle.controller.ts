import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  BundleEngineService,
  BundleServiceCode,
  type RecalculateOnServiceChangeInput,
} from '../../persistence/typeorm/repositories/products/bundle-engine.service';
import {
  TypeRemise,
  type BundleCalculatePriceRequest,
  type BundleCalculatePriceResponse,
  type RecalculateClientRequest,
  type RecalculateClientResponse,
} from '@proto/bundle';

@Controller()
export class BundleController {
  constructor(private readonly bundleEngineService: BundleEngineService) {}

  @GrpcMethod('BundleSvc', 'CalculatePrice')
  async calculatePrice(data: BundleCalculatePriceRequest): Promise<BundleCalculatePriceResponse> {
    const services = this.extractServices(data.item_overrides?.map((item) => item.produit_id));
    if (services.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Aucun service a calculer. Utilisez item_overrides[].produit_id.',
      });
    }

    const pricing = await this.bundleEngineService.calculatePrice(data.client_id, services, data.bundle_id || undefined);

    const items = pricing.items.map((item) => ({
      produit_id: item.service,
      nom_produit: this.displayName(item.service),
      quantite: 1,
      prix_unitaire: item.basePrice,
      remise_item: item.discount,
      prix_ligne_ht: item.finalPrice,
    }));

    return {
      bundle_id: data.bundle_id || pricing.configurationId,
      items,
      sous_total_ht: pricing.sousTotalHt,
      remise_bundle: pricing.remiseBundle,
      total_ht: pricing.totalHt,
      tva: 0,
      total_ttc: pricing.totalHt,
      type_remise_appliquee:
        pricing.remiseBundle > 0 ? TypeRemise.TYPE_REMISE_MONTANT_FIXE : TypeRemise.TYPE_REMISE_UNSPECIFIED,
      valeur_remise_appliquee: pricing.remiseBundle,
    };
  }

  @GrpcMethod('BundleSvc', 'RecalculateClient')
  async recalculateClient(data: RecalculateClientRequest): Promise<RecalculateClientResponse> {
    const recalculatePayload: RecalculateOnServiceChangeInput = {
      clientId: data.client_id,
      organisationId: data.organisation_id,
      services: [BundleServiceCode.CONCIERGERIE, BundleServiceCode.JUSTI_PLUS, BundleServiceCode.WINCASH],
      serviceChanged: BundleServiceCode.JUSTI_PLUS,
      action: 'added',
    };

    const pricing = await this.bundleEngineService.recalculateOnServiceChange(recalculatePayload);

    return {
      client_id: data.client_id,
      bundles_evalues: 1,
      eligibilites: [
        {
          bundle_id: pricing.configurationId,
          bundle_nom: 'Conciergerie + Justi+ + Wincash',
          eligible: true,
          raison: '',
          economie_estimee: pricing.remiseBundle,
        },
      ],
    };
  }

  private extractServices(values: (string | undefined)[]): string[] {
    return values.filter((value): value is string => Boolean(value));
  }

  private displayName(service: BundleServiceCode): string {
    if (service === BundleServiceCode.CONCIERGERIE) {
      return 'Conciergerie';
    }

    if (service === BundleServiceCode.JUSTI_PLUS) {
      return 'Justi+';
    }

    if (service === BundleServiceCode.WINCASH) {
      return 'Wincash';
    }

    return service;
  }
}
