'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Shield, ArrowLeft } from 'lucide-react';

export default function PortalCancelPage() {
  const handleGoBack = () => {
    window.history.back();
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

        <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="pt-8 pb-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-orange-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">Paiement annule</h2>
                <p className="text-gray-600 max-w-sm mx-auto">
                  Votre paiement a ete annule. Aucun montant n'a ete debite de votre compte.
                </p>
              </div>
              <Button onClick={handleGoBack} variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retourner au paiement
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Si vous avez des questions, veuillez contacter notre service client.</p>
        </div>
      </div>
    </div>
  );
}
