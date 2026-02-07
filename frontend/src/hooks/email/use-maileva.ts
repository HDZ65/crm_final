/**
 * React hooks pour utiliser les services Maileva via gRPC (logistics service)
 * Migrated from REST to gRPC — Wave 3 Task 8
 *
 * These hooks wrap the logistics gRPC client for label generation,
 * shipment tracking, pricing simulation, and address validation.
 */

import { useState, useCallback } from 'react';
import { logistics } from '@/lib/grpc/clients/logistics';
import type {
  GenerateLabelRequest,
  LabelResponse,
  TrackingResponse,
  SimulatePricingRequest,
  PricingResponse,
  AddressValidationResponse,
} from '@proto/logistics/logistics';

// ============================================================================
// Hook: useMailevaLabel - Générer une étiquette d'envoi via gRPC
// ============================================================================

export function useMailevaLabel() {
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<LabelResponse | null>(null);

  const generateLabel = useCallback(
    async (request: GenerateLabelRequest): Promise<LabelResponse> => {
      setError(null);

      try {
        const result = await logistics.generateLabel(request);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        setError(error);
        throw error;
      }
    },
    []
  );

  return {
    generateLabel,
    error,
    data,
  };
}

// ============================================================================
// Hook: useMailevaTracking - Suivre un envoi via gRPC
// ============================================================================

export function useMailevaTracking() {
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TrackingResponse | null>(null);

  const trackShipment = useCallback(
    async (trackingNumber: string): Promise<TrackingResponse> => {
      setError(null);

      try {
        const result = await logistics.trackShipment({ trackingNumber });
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        setError(error);
        throw error;
      }
    },
    []
  );

  return {
    trackShipment,
    error,
    data,
  };
}

// ============================================================================
// Hook: useMailevaPricing - Simuler le tarif d'un envoi via gRPC
// ============================================================================

export function useMailevaPricing() {
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<PricingResponse | null>(null);

  const simulatePricing = useCallback(
    async (request: SimulatePricingRequest): Promise<PricingResponse> => {
      setError(null);

      try {
        const result = await logistics.simulatePricing(request);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        setError(error);
        throw error;
      }
    },
    []
  );

  return {
    simulatePricing,
    error,
    data,
  };
}

// ============================================================================
// Hook: useMailevaAddressValidation - Valider une adresse via gRPC
// ============================================================================

export function useMailevaAddressValidation() {
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<AddressValidationResponse | null>(null);

  const validateAddress = useCallback(
    async (addressInput: { line1: string; line2?: string; postalCode: string; city: string; country: string }): Promise<AddressValidationResponse> => {
      setError(null);

      try {
        // Wrap flat address into gRPC ValidateAddressRequest format
        const result = await logistics.validateAddress({ address: addressInput });
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        setError(error);
        throw error;
      }
    },
    []
  );

  return {
    validateAddress,
    error,
    data,
  };
}

// ============================================================================
// Hook combiné: useMaileva - Tous les services Maileva via gRPC
// ============================================================================

export function useMaileva() {
  const label = useMailevaLabel();
  const tracking = useMailevaTracking();
  const pricing = useMailevaPricing();
  const addressValidation = useMailevaAddressValidation();

  return {
    // Génération d'étiquettes
    generateLabel: label.generateLabel,
    labelError: label.error,
    labelData: label.data,

    // Suivi d'envoi
    trackShipment: tracking.trackShipment,
    trackingError: tracking.error,
    trackingData: tracking.data,

    // Simulation de tarif
    simulatePricing: pricing.simulatePricing,
    pricingError: pricing.error,
    pricingData: pricing.data,

    // Validation d'adresse
    validateAddress: addressValidation.validateAddress,
    validationError: addressValidation.error,
    validationData: addressValidation.data,
  };
}
