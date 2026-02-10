/**
 * React hooks pour utiliser les services Maileva via server actions
 * These hooks call server actions (which handle gRPC internally on the server).
 */

import { useState, useCallback } from 'react';
import {
  generateLabel as generateLabelAction,
  trackShipment as trackShipmentAction,
  simulatePricing as simulatePricingAction,
  validateAddress as validateAddressAction,
} from '@/actions/logistics';
import type {
  GenerateLabelRequest,
  LabelResponse,
  TrackingResponse,
  SimulatePricingRequest,
  PricingResponse,
  AddressValidationResponse,
} from '@proto/logistics/logistics';

// ============================================================================
// Hook: useMailevaLabel - Générer une étiquette d'envoi via server action
// ============================================================================

export function useMailevaLabel() {
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<LabelResponse | null>(null);

  const generateLabel = useCallback(
    async (request: GenerateLabelRequest): Promise<LabelResponse> => {
      setError(null);

      const result = await generateLabelAction(request as unknown as Parameters<typeof generateLabelAction>[0]);
      if (result.error) {
        const err = new Error(result.error);
        setError(err);
        throw err;
      }

      setData(result.data);
      return result.data!;
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
// Hook: useMailevaTracking - Suivre un envoi via server action
// ============================================================================

export function useMailevaTracking() {
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TrackingResponse | null>(null);

  const trackShipment = useCallback(
    async (trackingNumber: string): Promise<TrackingResponse> => {
      setError(null);

      const result = await trackShipmentAction(trackingNumber);
      if (result.error) {
        const err = new Error(result.error);
        setError(err);
        throw err;
      }

      setData(result.data);
      return result.data!;
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
// Hook: useMailevaPricing - Simuler le tarif d'un envoi via server action
// ============================================================================

export function useMailevaPricing() {
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<PricingResponse | null>(null);

  const simulatePricing = useCallback(
    async (request: SimulatePricingRequest): Promise<PricingResponse> => {
      setError(null);

      const result = await simulatePricingAction(request as unknown as Parameters<typeof simulatePricingAction>[0]);
      if (result.error) {
        const err = new Error(result.error);
        setError(err);
        throw err;
      }

      setData(result.data);
      return result.data!;
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
// Hook: useMailevaAddressValidation - Valider une adresse via server action
// ============================================================================

export function useMailevaAddressValidation() {
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<AddressValidationResponse | null>(null);

  const validateAddress = useCallback(
    async (addressInput: { line1: string; line2?: string; postalCode: string; city: string; country: string }): Promise<AddressValidationResponse> => {
      setError(null);

      const result = await validateAddressAction(addressInput);
      if (result.error) {
        const err = new Error(result.error);
        setError(err);
        throw err;
      }

      setData(result.data);
      return result.data!;
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
// Hook combiné: useMaileva - Tous les services Maileva via server actions
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
