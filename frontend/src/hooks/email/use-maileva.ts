/**
 * React hooks pour utiliser les services Maileva via l'API backend
 * Ces hooks peuvent être utilisés dans un frontend React/Next.js
 */

import { useState, useCallback } from 'react';
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
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================================
// Hook: useMailevaLabel - Générer une étiquette d'envoi
// ============================================================================

export function useMailevaLabel() {
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<MailevaLabelResponse | null>(null);

  const generateLabel = useCallback(
    async (request: MailevaLabelRequest): Promise<MailevaLabelResponse> => {
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/logistics/labels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const result: MailevaLabelResponse = await response.json();
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
// Hook: useMailevaTracking - Suivre un envoi
// ============================================================================

export function useMailevaTracking() {
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<MailevaTrackingResponse | null>(null);

  const trackShipment = useCallback(
    async (trackingNumber: string): Promise<MailevaTrackingResponse> => {
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/logistics/tracking/${encodeURIComponent(trackingNumber)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const result: MailevaTrackingResponse = await response.json();
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
// Hook: useMailevaPricing - Simuler le tarif d'un envoi
// ============================================================================

export function useMailevaPricing() {
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<MailevaPricingResponse | null>(null);

  const simulatePricing = useCallback(
    async (request: MailevaPricingRequest): Promise<MailevaPricingResponse> => {
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/logistics/pricing/simulate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const result: MailevaPricingResponse = await response.json();
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
// Hook: useMailevaAddressValidation - Valider une adresse
// ============================================================================

export function useMailevaAddressValidation() {
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<MailevaAddressValidationResponse | null>(
    null
  );

  const validateAddress = useCallback(
    async (
      address: MailevaAddress
    ): Promise<MailevaAddressValidationResponse> => {
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/logistics/addresses/validate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(address),
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const result: MailevaAddressValidationResponse = await response.json();
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
// Hook combiné: useMaileva - Tous les services Maileva
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
