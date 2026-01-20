'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Loader2, Shield } from 'lucide-react';

export default function PortalSuccessPage() {
  const searchParams = useSearchParams();
  const state = searchParams.get('state');
  const [status, setStatus] = useState<'verifying' | 'confirmed' | 'pending'>('verifying');

  useEffect(() => {
    if (state) {
      verifyPayment(state);
    }
  }, [state]);

  const verifyPayment = async (state: string) => {
    try {
      const response = await fetch('/api/portal/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, pspParams: Object.fromEntries(searchParams.entries()) }),
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const data = await response.json();
      
      if (data.paymentConfirmed) {
        setStatus('confirmed');
      } else {
        setStatus('pending');
      }
    } catch (error) {
      console.error('Failed to verify payment:', error);
      setStatus('pending');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">Paiement securise</span>
          </div>
        </div>

        <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-8 pb-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {status === 'verifying' ? (
                  <Loader2 className="h-16 w-16 text-green-500 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                )}
              </div>
              <div className="space-y-2">
                {status === 'verifying' && (
                  <>
                    <h2 className="text-xl font-semibold text-gray-900">Verification en cours</h2>
                    <p className="text-gray-600">Veuillez patienter pendant que nous confirmons votre paiement...</p>
                  </>
                )}
                {status === 'confirmed' && (
                  <>
                    <h2 className="text-xl font-semibold text-gray-900">Paiement confirme</h2>
                    <p className="text-gray-600">Votre paiement a ete effectue avec succes. Vous recevrez une confirmation par email.</p>
                  </>
                )}
                {status === 'pending' && (
                  <>
                    <h2 className="text-xl font-semibold text-gray-900">Paiement en cours de traitement</h2>
                    <p className="text-gray-600">Votre paiement est en cours de traitement. Vous recevrez une confirmation par email une fois le paiement valide.</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Vous pouvez fermer cette page en toute securite.</p>
        </div>
      </div>
    </div>
  );
}
