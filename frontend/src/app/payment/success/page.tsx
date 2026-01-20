'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Home, Receipt, ArrowRight, CreditCard } from 'lucide-react';
import { useStripePayment } from '@/hooks/use-stripe-payment';
import { formatAmount } from '@/lib/stripe';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Stripe params
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent');

  // GoCardless params
  const clientId = searchParams.get('clientId');
  const isGoCardless = !!clientId && !sessionId && !paymentIntentId;

  const [paymentDetails, setPaymentDetails] = useState<{
    amount?: number;
    currency?: string;
    status?: string;
  } | null>(null);

  const [gcStatus, setGcStatus] = useState<'loading' | 'success'>('loading');

  const { getPaymentIntent } = useStripePayment();

  useEffect(() => {
    // GoCardless flow
    if (isGoCardless) {
      // Nettoyer le localStorage GoCardless
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gc_billing_request');
        localStorage.removeItem('gc_billing_request_flow');
      }

      // Simuler un délai de vérification
      const timer = setTimeout(() => {
        setGcStatus('success');
      }, 1500);

      return () => clearTimeout(timer);
    }

    // Stripe flow
    const fetchPaymentDetails = async () => {
      if (paymentIntentId) {
        const intent = await getPaymentIntent(paymentIntentId);
        if (intent) {
          setPaymentDetails({
            amount: intent.amount,
            currency: intent.currency,
            status: intent.status,
          });
        }
      }
    };

    fetchPaymentDetails();
  }, [paymentIntentId, getPaymentIntent, isGoCardless]);

  // GoCardless Success View
  if (isGoCardless) {
    if (gcStatus === 'loading') {
      return (
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">Vérification en cours...</p>
            <p className="text-sm text-muted-foreground">
              Nous vérifions votre autorisation de prélèvement
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CreditCard className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Prélèvement configuré !</CardTitle>
          <CardDescription>
            Votre autorisation de prélèvement a été enregistrée avec succès
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium">Prochaines étapes :</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Le mandat sera actif sous 3 à 5 jours ouvrés</li>
              <li>• Vous recevrez un email de confirmation de GoCardless</li>
              <li>• Les prélèvements pourront être effectués une fois le mandat actif</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {clientId && (
            <Button
              onClick={() => router.push(`/clients/${clientId}`)}
              className="w-full"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Retour au client
            </Button>
          )}
          <Button variant="outline" asChild className="w-full">
            <Link href="/test-payment">
              <Receipt className="mr-2 h-4 w-4" />
              Page de test paiements
            </Link>
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Retour à l&apos;accueil
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Stripe Success View
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <CardTitle className="text-2xl">Paiement réussi !</CardTitle>
        <CardDescription>
          Votre paiement a été traité avec succès
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4 space-y-2">
            {paymentDetails?.amount && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-semibold">
                  {formatAmount(paymentDetails.amount, paymentDetails.currency)}
                </span>
              </div>
            )}

            {paymentDetails?.status && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Statut</span>
                <Badge variant="default" className="bg-green-500">
                  {paymentDetails.status === 'succeeded' ? 'Confirmé' : paymentDetails.status}
                </Badge>
              </div>
            )}

            {(sessionId || paymentIntentId) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Référence</span>
                <span className="font-mono text-xs truncate max-w-[150px]">
                  {sessionId || paymentIntentId}
                </span>
              </div>
            )}
          </div>

        <p className="text-sm text-muted-foreground text-center">
          Un email de confirmation vous a été envoyé avec les détails de votre achat.
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <Button asChild className="w-full">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
        </Button>
        <Button variant="outline" asChild className="w-full">
          <Link href="/test-stripe">
            <Receipt className="mr-2 h-4 w-4" />
            Retour aux tests Stripe
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function PaymentSuccessFallback() {
  return null;
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Suspense fallback={<PaymentSuccessFallback />}>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}
