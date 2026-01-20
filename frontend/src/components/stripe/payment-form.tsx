'use client';

import { useState, useEffect } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { stripePromiseInstance, stripeAppearance, formatAmount, getStripeErrorMessage } from '@/lib/stripe';
import { useStripePayment } from '@/hooks/use-stripe-payment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CheckoutFormProps {
  amount: number;
  currency?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  returnUrl?: string;
}

function CheckoutFormInner({ amount, currency = 'eur', onSuccess, onError, returnUrl }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl || `${window.location.origin}/payment/success`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      const errorMessage = submitError.message || getStripeErrorMessage(submitError.code);
      setError(errorMessage);
      onError?.(errorMessage);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setSuccess(true);
      onSuccess?.(paymentIntent.id);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <p className="text-lg font-medium text-green-700">Paiement réussi !</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          'Traitement en cours...'
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Payer {formatAmount(amount, currency)}
          </>
        )}
      </Button>
    </form>
  );
}

interface PaymentFormProps {
  amount: number;
  currency?: string;
  title?: string;
  description?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  returnUrl?: string;
}

export function PaymentForm({
  amount,
  currency = 'eur',
  title = 'Paiement sécurisé',
  description,
  customerEmail,
  metadata,
  onSuccess,
  onError,
  returnUrl,
}: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const { createPaymentIntent, error: apiError } = useStripePayment();

  useEffect(() => {
    const initPayment = async () => {
      setApiLoading(true);
      try {
        const result = await createPaymentIntent({
          amount,
          currency,
          receiptEmail: customerEmail,
          metadata,
        });

        if (result?.clientSecret) {
          setClientSecret(result.clientSecret);
        }
      } finally {
        setApiLoading(false);
      }
    };

    initPayment();
  }, [amount, currency, customerEmail, metadata, createPaymentIntent]);

  if (apiLoading || !clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <span className="text-muted-foreground">Chargement du formulaire...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (apiError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <div className="text-2xl font-bold text-primary">
          {formatAmount(amount, currency)}
        </div>
      </CardHeader>
      <CardContent>
        <Elements
          stripe={stripePromiseInstance}
          options={{
            clientSecret,
            appearance: stripeAppearance,
            locale: 'fr',
          }}
        >
          <CheckoutFormInner
            amount={amount}
            currency={currency}
            onSuccess={onSuccess}
            onError={onError}
            returnUrl={returnUrl}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}
