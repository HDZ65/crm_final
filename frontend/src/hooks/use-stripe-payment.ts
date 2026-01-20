'use client';

import { useState, useCallback } from 'react';
import { API_URL, getStripeErrorMessage } from '@/lib/stripe';

// Types
export interface PaymentIntentResponse {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CheckoutSessionResponse {
  id: string;
  url: string;
  paymentIntentId?: string;
  subscriptionId?: string;
}

export interface CustomerResponse {
  id: string;
  email: string;
  name?: string;
  defaultPaymentMethod?: string;
}

export interface SubscriptionResponse {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  clientSecret?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  customerId?: string;
  description?: string;
  receiptEmail?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionParams {
  customerId?: string;
  customerEmail?: string;
  priceId?: string;
  amount?: number;
  currency?: string;
  mode: 'payment' | 'subscription' | 'setup';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  lineItems?: Array<{
    priceId?: string;
    quantity: number;
    amount?: number;
    currency?: string;
    name?: string;
    description?: string;
  }>;
}

export interface CreateCustomerParams {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
}

export interface UseStripePaymentReturn {
  error: string | null;
  // Payment Intent
  createPaymentIntent: (params: CreatePaymentIntentParams) => Promise<PaymentIntentResponse | null>;
  getPaymentIntent: (id: string) => Promise<PaymentIntentResponse | null>;
  cancelPaymentIntent: (id: string) => Promise<boolean>;
  // Checkout Session
  createCheckoutSession: (params: CreateCheckoutSessionParams) => Promise<CheckoutSessionResponse | null>;
  redirectToCheckout: (params: CreateCheckoutSessionParams) => Promise<void>;
  // Customer
  createCustomer: (params: CreateCustomerParams) => Promise<CustomerResponse | null>;
  getCustomer: (id: string) => Promise<CustomerResponse | null>;
  // Subscription
  createSubscription: (params: CreateSubscriptionParams) => Promise<SubscriptionResponse | null>;
  getSubscription: (id: string) => Promise<SubscriptionResponse | null>;
  cancelSubscription: (id: string) => Promise<boolean>;
  // Refund
  createRefund: (paymentIntentId: string, amount?: number, reason?: string) => Promise<boolean>;
  // Utils
  clearError: () => void;
}

export function useStripePayment(): UseStripePaymentReturn {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err.message);
    } else if (typeof err === 'object' && err !== null && 'code' in err) {
      setError(getStripeErrorMessage((err as { code: string }).code));
    } else {
      setError('Une erreur est survenue');
    }
  }, []);

  const apiCall = useCallback(async <T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T | null> => {
    setError(null);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      return data as T;
    } catch (err) {
      handleError(err);
      return null;
    }
  }, [handleError]);

  // Payment Intent
  const createPaymentIntent = useCallback(async (
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntentResponse | null> => {
    return apiCall<PaymentIntentResponse>('/stripe/payment-intents', {
      method: 'POST',
      body: JSON.stringify({
        ...params,
        currency: params.currency || 'eur',
      }),
    });
  }, [apiCall]);

  const getPaymentIntent = useCallback(async (
    id: string
  ): Promise<PaymentIntentResponse | null> => {
    return apiCall<PaymentIntentResponse>(`/stripe/payment-intents/${id}`);
  }, [apiCall]);

  const cancelPaymentIntent = useCallback(async (id: string): Promise<boolean> => {
    const result = await apiCall<{ success: boolean }>(`/stripe/payment-intents/${id}/cancel`, {
      method: 'POST',
    });
    return result?.success ?? false;
  }, [apiCall]);

  // Checkout Session
  const createCheckoutSession = useCallback(async (
    params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResponse | null> => {
    return apiCall<CheckoutSessionResponse>('/stripe/checkout/sessions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }, [apiCall]);

  const redirectToCheckout = useCallback(async (
    params: CreateCheckoutSessionParams
  ): Promise<void> => {
    const session = await createCheckoutSession(params);
    if (session?.url) {
      window.location.href = session.url;
    }
  }, [createCheckoutSession]);

  // Customer
  const createCustomer = useCallback(async (
    params: CreateCustomerParams
  ): Promise<CustomerResponse | null> => {
    return apiCall<CustomerResponse>('/stripe/customers', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }, [apiCall]);

  const getCustomer = useCallback(async (
    id: string
  ): Promise<CustomerResponse | null> => {
    return apiCall<CustomerResponse>(`/stripe/customers/${id}`);
  }, [apiCall]);

  // Subscription
  const createSubscription = useCallback(async (
    params: CreateSubscriptionParams
  ): Promise<SubscriptionResponse | null> => {
    return apiCall<SubscriptionResponse>('/stripe/subscriptions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }, [apiCall]);

  const getSubscription = useCallback(async (
    id: string
  ): Promise<SubscriptionResponse | null> => {
    return apiCall<SubscriptionResponse>(`/stripe/subscriptions/${id}`);
  }, [apiCall]);

  const cancelSubscription = useCallback(async (id: string): Promise<boolean> => {
    const result = await apiCall<{ success: boolean }>(`/stripe/subscriptions/${id}`, {
      method: 'DELETE',
    });
    return result?.success ?? false;
  }, [apiCall]);

  // Refund
  const createRefund = useCallback(async (
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<boolean> => {
    const result = await apiCall<{ success: boolean }>('/stripe/refunds', {
      method: 'POST',
      body: JSON.stringify({
        paymentIntentId,
        amount,
        reason,
      }),
    });
    return result?.success ?? false;
  }, [apiCall]);

  return {
    error,
    createPaymentIntent,
    getPaymentIntent,
    cancelPaymentIntent,
    createCheckoutSession,
    redirectToCheckout,
    createCustomer,
    getCustomer,
    createSubscription,
    getSubscription,
    cancelSubscription,
    createRefund,
    clearError,
  };
}
