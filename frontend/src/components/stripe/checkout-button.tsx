'use client';

import { useState } from 'react';
import { useStripePayment } from '@/hooks/use-stripe-payment';
import { formatAmount } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, AlertCircle } from 'lucide-react';

interface CheckoutButtonProps {
  amount: number;
  currency?: string;
  productName?: string;
  productDescription?: string;
  customerEmail?: string;
  mode?: 'payment' | 'subscription' | 'setup';
  priceId?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

export function CheckoutButton({
  amount,
  currency = 'eur',
  productName,
  productDescription,
  customerEmail,
  mode = 'payment',
  priceId,
  successUrl,
  cancelUrl,
  metadata,
  className,
  variant = 'default',
  size = 'default',
  children,
}: CheckoutButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { redirectToCheckout } = useStripePayment();

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);

    try {
      await redirectToCheckout({
        amount: priceId ? undefined : amount,
        priceId,
        currency,
        mode,
        customerEmail,
        successUrl: successUrl || `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: cancelUrl || `${window.location.origin}/payment/cancel`,
        metadata: {
          productName: productName || 'Achat',
          productDescription: productDescription || '',
          ...metadata,
        },
        lineItems: priceId ? undefined : [
          {
            quantity: 1,
            amount,
            currency,
            name: productName || 'Produit',
            description: productDescription,
          },
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la redirection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCheckout}
        disabled={loading}
        variant={variant}
        size={size}
        className={className}
      >
        {loading ? (
          'Redirection...'
        ) : (
          children || (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Payer {formatAmount(amount, currency)}
            </>
          )
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
