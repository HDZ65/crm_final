'use client';

import { useState, useCallback } from 'react';
import { getStripeErrorMessage } from '@/lib/payments/stripe';
import {
  createStripePaymentIntent as createStripePaymentIntentAction,
  getStripePaymentIntent as getStripePaymentIntentAction,
  cancelStripePaymentIntent as cancelStripePaymentIntentAction,
  createStripeCheckoutSession as createStripeCheckoutSessionAction,
  createStripeCustomer as createStripeCustomerAction,
  getStripeCustomer as getStripeCustomerAction,
  createStripeSubscription as createStripeSubscriptionAction,
  getStripeSubscription as getStripeSubscriptionAction,
  cancelStripeSubscription as cancelStripeSubscriptionAction,
  createStripeRefund as createStripeRefundAction,
} from '@/actions/payments';

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

/**
 * Hook for Stripe payment operations via gRPC server actions.
 * @param societeId - Societe ID for multi-tenant context (resolved from auth if empty)
 */
export function useStripePayment(societeId: string = ''): UseStripePaymentReturn {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err.message);
    } else if (typeof err === 'object' && err !== null && 'code' in err) {
      setError(getStripeErrorMessage((err as { code: string }).code));
    } else if (typeof err === 'string') {
      setError(err);
    } else {
      setError('Une erreur est survenue');
    }
  }, []);

  // Payment Intent
  const createPaymentIntent = useCallback(async (
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntentResponse | null> => {
    setError(null);
    try {
      const result = await createStripePaymentIntentAction({
        societeId,
        amount: params.amount,
        currency: params.currency,
        customerId: params.customerId,
        description: params.description,
        metadata: params.metadata,
      });
      if (result.error) {
        handleError(result.error);
        return null;
      }
      if (!result.data) return null;
      return {
        id: result.data.id,
        clientSecret: result.data.clientSecret || '',
        amount: Number(result.data.amount),
        currency: result.data.currency,
        status: result.data.status,
      };
    } catch (err) {
      handleError(err);
      return null;
    }
  }, [handleError, societeId]);

  const getPaymentIntent = useCallback(async (
    id: string
  ): Promise<PaymentIntentResponse | null> => {
    setError(null);
    try {
      const result = await getStripePaymentIntentAction(id, societeId);
      if (result.error) {
        handleError(result.error);
        return null;
      }
      if (!result.data) return null;
      return {
        id: result.data.id,
        clientSecret: result.data.clientSecret || '',
        amount: Number(result.data.amount),
        currency: result.data.currency,
        status: result.data.status,
      };
    } catch (err) {
      handleError(err);
      return null;
    }
  }, [handleError, societeId]);

  const cancelPaymentIntent = useCallback(async (
    id: string
  ): Promise<boolean> => {
    setError(null);
    try {
      const result = await cancelStripePaymentIntentAction(id, societeId);
      if (result.error) {
        handleError(result.error);
        return false;
      }
      return result.data?.success ?? false;
    } catch (err) {
      handleError(err);
      return false;
    }
  }, [handleError, societeId]);

  // Checkout Session
  const createCheckoutSession = useCallback(async (
    params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResponse | null> => {
    setError(null);
    try {
      const result = await createStripeCheckoutSessionAction({
        societeId,
        customerId: params.customerId,
        customerEmail: params.customerEmail,
        priceId: params.priceId,
        amount: params.amount,
        currency: params.currency,
        mode: params.mode,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        metadata: params.metadata,
        lineItems: params.lineItems?.map((item) => ({
          name: item.name,
          description: item.description,
          amount: item.amount,
          quantity: item.quantity,
          currency: item.currency,
        })),
      });
      if (result.error) {
        handleError(result.error);
        return null;
      }
      if (!result.data) return null;
      return {
        id: result.data.id,
        url: result.data.url,
        subscriptionId: result.data.subscriptionId,
      };
    } catch (err) {
      handleError(err);
      return null;
    }
  }, [handleError, societeId]);

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
    setError(null);
    try {
      const result = await createStripeCustomerAction({
        societeId,
        email: params.email,
        name: params.name,
        phone: params.phone,
        metadata: params.metadata,
      });
      if (result.error) {
        handleError(result.error);
        return null;
      }
      if (!result.data) return null;
      return {
        id: result.data.id,
        email: result.data.email,
        name: result.data.name,
      };
    } catch (err) {
      handleError(err);
      return null;
    }
  }, [handleError, societeId]);

  const getCustomer = useCallback(async (
    id: string
  ): Promise<CustomerResponse | null> => {
    setError(null);
    try {
      const result = await getStripeCustomerAction(id, societeId);
      if (result.error) {
        handleError(result.error);
        return null;
      }
      if (!result.data) return null;
      return {
        id: result.data.id,
        email: result.data.email,
        name: result.data.name,
      };
    } catch (err) {
      handleError(err);
      return null;
    }
  }, [handleError, societeId]);

  // Subscription
  const createSubscription = useCallback(async (
    params: CreateSubscriptionParams
  ): Promise<SubscriptionResponse | null> => {
    setError(null);
    try {
      const result = await createStripeSubscriptionAction({
        societeId,
        customerId: params.customerId,
        priceId: params.priceId,
        metadata: params.metadata,
      });
      if (result.error) {
        handleError(result.error);
        return null;
      }
      if (!result.data) return null;
      return {
        id: result.data.id,
        status: result.data.status,
        currentPeriodStart: String(result.data.currentPeriodStart),
        currentPeriodEnd: String(result.data.currentPeriodEnd),
        cancelAtPeriodEnd: result.data.cancelAtPeriodEnd,
      };
    } catch (err) {
      handleError(err);
      return null;
    }
  }, [handleError, societeId]);

  const getSubscription = useCallback(async (
    id: string
  ): Promise<SubscriptionResponse | null> => {
    setError(null);
    try {
      const result = await getStripeSubscriptionAction(id, societeId);
      if (result.error) {
        handleError(result.error);
        return null;
      }
      if (!result.data) return null;
      return {
        id: result.data.id,
        status: result.data.status,
        currentPeriodStart: String(result.data.currentPeriodStart),
        currentPeriodEnd: String(result.data.currentPeriodEnd),
        cancelAtPeriodEnd: result.data.cancelAtPeriodEnd,
      };
    } catch (err) {
      handleError(err);
      return null;
    }
  }, [handleError, societeId]);

  const cancelSubscription = useCallback(async (
    id: string
  ): Promise<boolean> => {
    setError(null);
    try {
      const result = await cancelStripeSubscriptionAction(id, societeId);
      if (result.error) {
        handleError(result.error);
        return false;
      }
      return result.data?.success ?? false;
    } catch (err) {
      handleError(err);
      return false;
    }
  }, [handleError, societeId]);

  // Refund
  const createRefund = useCallback(async (
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<boolean> => {
    setError(null);
    try {
      const result = await createStripeRefundAction({
        societeId,
        paymentIntentId,
        amount,
        reason,
      });
      if (result.error) {
        handleError(result.error);
        return false;
      }
      return result.data?.success ?? false;
    } catch (err) {
      handleError(err);
      return false;
    }
  }, [handleError, societeId]);

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
