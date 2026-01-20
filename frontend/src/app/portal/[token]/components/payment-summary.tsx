'use client';

import { Separator } from '@/components/ui/separator';

interface PaymentSummaryProps {
  amountCents: number;
  currency: string;
  description: string;
}

export function PaymentSummary({ amountCents, currency, description }: PaymentSummaryProps) {
  const amount = amountCents / 100;
  
  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(amount);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Description</p>
          <p className="font-medium">{description || 'Paiement'}</p>
        </div>
      </div>

      <Separator />

      <div className="flex justify-between items-center">
        <span className="text-gray-600">Montant a payer</span>
        <span className="text-2xl font-bold text-gray-900">{formattedAmount}</span>
      </div>
    </div>
  );
}
