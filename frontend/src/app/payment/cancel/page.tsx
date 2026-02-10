'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Home, RefreshCw, CreditCard } from 'lucide-react';

function PaymentCancelContent() {
  const searchParams = useSearchParams();

  // GoCardless params
  const clientId = searchParams.get('clientId');
  const isGoCardless = !!clientId;

  useEffect(() => {
    // Nettoyer le localStorage GoCardless si applicable
    if (isGoCardless && typeof window !== 'undefined') {
      localStorage.removeItem('gc_billing_request');
      localStorage.removeItem('gc_billing_request_flow');
    }
  }, [isGoCardless]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
          <XCircle className="h-10 w-10 text-orange-600" />
        </div>
        <CardTitle className="text-2xl">
          {isGoCardless ? 'Configuration annulée' : 'Paiement annulé'}
        </CardTitle>
        <CardDescription>
          {isGoCardless
            ? 'Vous avez quitté la configuration du prélèvement automatique'
            : 'Votre paiement n\'a pas été effectué'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          {isGoCardless
            ? 'Pas de souci ! Vous pouvez configurer le prélèvement automatique à tout moment.'
            : 'Vous avez annulé le processus de paiement. Aucun montant n\'a été débité de votre compte.'
          }
        </p>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            Si vous avez rencontré un problème technique, n&apos;hésitez pas à réessayer ou à nous contacter.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
         {clientId && (
           <Button variant="outline" asChild className="w-full">
             <Link href={`/clients/${clientId}`}>
               Retour au client
             </Link>
           </Button>
         )}
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

function PaymentCancelFallback() {
  return null;
}

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Suspense fallback={<PaymentCancelFallback />}>
        <PaymentCancelContent />
      </Suspense>
    </div>
  );
}
