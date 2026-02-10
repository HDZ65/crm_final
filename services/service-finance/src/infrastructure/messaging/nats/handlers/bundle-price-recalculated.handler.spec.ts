import { describe, expect, it } from 'bun:test';
import { BundlePriceRecalculatedHandler } from './bundle-price-recalculated.handler';

describe('BundlePriceRecalculatedHandler', () => {
  it('delegates bundle.price.recalculated processing to consolidated billing service', async () => {
    let called = 0;
    let receivedPayload: any;

    const consolidatedBillingService = {
      handleBundlePriceRecalculated: async (payload: any) => {
        called += 1;
        receivedPayload = payload;
        return {
          id: 'fac-42',
        };
      },
    };

    const handler = new BundlePriceRecalculatedHandler(
      consolidatedBillingService as any,
    );

    await handler.handleBundlePriceRecalculated({
      factureId: 'fac-42',
      services: [
        {
          produitId: 'prod-justi',
          prixUnitaire: 5.9,
        },
      ],
    });

    expect(called).toBe(1);
    expect(receivedPayload.factureId).toBe('fac-42');
  });
});
