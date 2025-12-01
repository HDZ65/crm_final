/**
 * React hooks pour utiliser les services Maileva via l'API backend avec authentification
 * Version mise à jour utilisant le wrapper API authentifié
 */

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  MailevaAddress,
  MailevaLabelRequest,
  MailevaLabelResponse,
  MailevaTrackingResponse,
  MailevaPricingRequest,
  MailevaPricingResponse,
  MailevaAddressValidationResponse,
} from '@/types/maileva';

// ============================================================================
// Hook: useMailevaLabel - Générer une étiquette d'envoi
// ============================================================================

export function useMailevaLabel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<MailevaLabelResponse | null>(null);

  const generateLabel = useCallback(
    async (request: MailevaLabelRequest): Promise<MailevaLabelResponse> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.post<MailevaLabelResponse>('/logistics/labels', request);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    generateLabel,
    loading,
    error,
    data,
  };
}

// ============================================================================
// Hook: useMailevaTracking - Suivre un envoi
// ============================================================================

export function useMailevaTracking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<MailevaTrackingResponse | null>(null);

  const trackShipment = useCallback(
    async (trackingNumber: string): Promise<MailevaTrackingResponse> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.get<MailevaTrackingResponse>(`/logistics/tracking/${encodeURIComponent(trackingNumber)}`);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    trackShipment,
    loading,
    error,
    data,
  };
}

// ============================================================================
// Hook: useMailevaPricing - Simuler le tarif d'un envoi
// ============================================================================

export function useMailevaPricing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<MailevaPricingResponse | null>(null);

  const simulatePricing = useCallback(
    async (request: MailevaPricingRequest): Promise<MailevaPricingResponse> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.post<MailevaPricingResponse>('/logistics/pricing/simulate', request);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    simulatePricing,
    loading,
    error,
    data,
  };
}

// ============================================================================
// Hook: useMailevaAddressValidation - Valider une adresse
// ============================================================================

export function useMailevaAddressValidation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<MailevaAddressValidationResponse | null>(
    null
  );

  const validateAddress = useCallback(
    async (
      address: MailevaAddress
    ): Promise<MailevaAddressValidationResponse> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.post<MailevaAddressValidationResponse>('/logistics/addresses/validate', address);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    validateAddress,
    loading,
    error,
    data,
  };
}

// ============================================================================
// Hook combiné: useMaileva - Tous les services Maileva avec authentification
// ============================================================================

export function useMaileva() {
  const label = useMailevaLabel();
  const tracking = useMailevaTracking();
  const pricing = useMailevaPricing();
  const addressValidation = useMailevaAddressValidation();

  return {
    // Génération d'étiquettes
    generateLabel: label.generateLabel,
    labelLoading: label.loading,
    labelError: label.error,
    labelData: label.data,

    // Suivi d'envoi
    trackShipment: tracking.trackShipment,
    trackingLoading: tracking.loading,
    trackingError: tracking.error,
    trackingData: tracking.data,

    // Simulation de tarif
    simulatePricing: pricing.simulatePricing,
    pricingLoading: pricing.loading,
    pricingError: pricing.error,
    pricingData: pricing.data,

    // Validation d'adresse
    validateAddress: addressValidation.validateAddress,
    validationLoading: addressValidation.loading,
    validationError: addressValidation.error,
    validationData: addressValidation.data,
  };
}