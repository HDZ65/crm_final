'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Home, Settings, ArrowRight } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Abonnement activé !</CardTitle>
          <CardDescription>
            Bienvenue dans votre nouvel abonnement
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Votre abonnement est maintenant actif. Vous avez accès à toutes les fonctionnalités de votre plan.
          </p>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Prochaines étapes :</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3" />
                Configurez votre espace de travail
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3" />
                Invitez votre équipe
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3" />
                Explorez les fonctionnalités
              </li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Accéder au dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/test-stripe">
              <Settings className="mr-2 h-4 w-4" />
              Retour aux tests Stripe
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
