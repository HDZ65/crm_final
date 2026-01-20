'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PaymentSummary } from './components/payment-summary';
import { PaymentMethods } from './components/payment-methods';
import { MandateInfo } from './components/mandate-info';
import { PortalStatus } from './components/portal-status';
import { PortalLoadingSkeleton } from './components/portal-loading';
import { Lock, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface PortalSession {
  id: string;
  status: 'CREATED' | 'ACTIVE' | 'REDIRECTED' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  amountCents: number;
  currency: string;
  description: string;
  allowedActions: ('PAY_BY_CARD' | 'PAY_BY_SEPA' | 'SETUP_SEPA' | 'VIEW_PAYMENT' | 'VIEW_MANDATE')[];
  mandate?: {
    rumMasked: string;
    bankName: string;
    accountEnding: string;
  };
  expiresAt: string;
  customerName?: string;
}

interface PortalPageClientProps {
  token: string;
}

type PageState = 'loading' | 'active' | 'processing' | 'success' | 'failed' | 'expired' | 'error';

export function PortalPageClient({ token }: PortalPageClientProps) {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'sepa' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [token]);

  const fetchSession = async () => {
    try {
      setPageState('loading');
      const response = await fetch(`/api/portal/session?token=${encodeURIComponent(token)}`);
      
      if (!response.ok) {
        const error = await response.json();
        if (response.status === 410 || error.code === 'SESSION_EXPIRED') {
          setPageState('expired');
          return;
        }
        throw new Error(error.message || 'Une erreur est survenue');
      }

      const data = await response.json();
      setSession(data.session);

      switch (data.session.status) {
        case 'COMPLETED':
          setPageState('success');
          break;
        case 'FAILED':
          setPageState('failed');
          setErrorMessage('Le paiement a echoue. Veuillez reessayer.');
          break;
        case 'EXPIRED':
        case 'CANCELLED':
          setPageState('expired');
          break;
        case 'REDIRECTED':
          setPageState('processing');
          break;
        default:
          setPageState('active');
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setPageState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  const handlePayment = async (method: 'card' | 'sepa') => {
    if (!session) return;

    try {
      setIsSubmitting(true);
      setSelectedMethod(method);

      const paymentMethod = method === 'card' ? 'CARD' : 'SEPA_DEBIT';
      const response = await fetch('/api/portal/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          paymentMethod,
          successUrl: `${window.location.origin}/portal/success`,
          cancelUrl: `${window.location.origin}/portal/cancel`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du paiement');
      }

      const data = await response.json();
      
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setPageState('failed');
      setErrorMessage(error instanceof Error ? error.message : 'Le paiement a echoue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageState === 'loading') {
    return <PortalLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">Paiement securise</span>
          </div>
        </div>

        {pageState === 'expired' && (
          <PortalStatus
            status="expired"
            title="Lien expire"
            description="Ce lien de paiement n'est plus valide. Veuillez contacter le service client pour obtenir un nouveau lien."
          />
        )}

        {pageState === 'error' && (
          <PortalStatus
            status="error"
            title="Erreur"
            description={errorMessage || "Une erreur est survenue. Veuillez reessayer."}
            onRetry={fetchSession}
          />
        )}

        {pageState === 'success' && session && (
          <PortalStatus
            status="success"
            title="Paiement confirme"
            description={`Votre paiement de ${formatAmount(session.amountCents, session.currency)} a ete effectue avec succes.`}
          />
        )}

        {pageState === 'failed' && session && (
          <PortalStatus
            status="failed"
            title="Paiement echoue"
            description={errorMessage}
            onRetry={() => setPageState('active')}
          />
        )}

        {pageState === 'processing' && (
          <PortalStatus
            status="processing"
            title="Traitement en cours"
            description="Veuillez patienter pendant que nous traitons votre paiement..."
          />
        )}

        {pageState === 'active' && session && (
          <>
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Details du paiement</CardTitle>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    <Lock className="h-3 w-3 mr-1" />
                    Securise
                  </Badge>
                </div>
                {session.customerName && (
                  <CardDescription>
                    Bonjour {session.customerName}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <PaymentSummary
                  amountCents={session.amountCents}
                  currency={session.currency}
                  description={session.description}
                />
              </CardContent>
            </Card>

            {session.mandate && session.allowedActions.includes('PAY_BY_SEPA') && (
              <MandateInfo mandate={session.mandate} />
            )}

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Mode de paiement</CardTitle>
                <CardDescription>
                  Choisissez votre methode de paiement preferee
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentMethods
                  allowedActions={session.allowedActions}
                  hasMandate={!!session.mandate}
                  onSelectCard={() => handlePayment('card')}
                  onSelectSepa={() => handlePayment('sepa')}
                  disabled={isSubmitting}
                />
              </CardContent>
            </Card>

            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>Vos informations de paiement sont protegees par un chiffrement SSL.</p>
              <p>En continuant, vous acceptez nos conditions generales de vente.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatAmount(cents: number, currency: string): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
