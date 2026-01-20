'use client';

import { Button } from '@/components/ui/button';
import { CreditCard, Building2, Loader2 } from 'lucide-react';

interface PaymentMethodsProps {
  allowedActions: string[];
  hasMandate: boolean;
  onSelectCard: () => void;
  onSelectSepa: () => void;
  disabled?: boolean;
}

export function PaymentMethods({
  allowedActions,
  hasMandate,
  onSelectCard,
  onSelectSepa,
  disabled = false,
}: PaymentMethodsProps) {
  const canPayByCard = allowedActions.includes('PAY_BY_CARD');
  const canPayBySepa = allowedActions.includes('PAY_BY_SEPA') && hasMandate;

  return (
    <div className="space-y-3">
      {canPayByCard && (
        <Button
          variant="outline"
          className="w-full h-14 justify-start text-left hover:bg-blue-50 hover:border-blue-200"
          onClick={onSelectCard}
          disabled={disabled}
        >
          {disabled ? (
            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
          ) : (
            <CreditCard className="h-5 w-5 mr-3 text-blue-600" />
          )}
          <div>
            <div className="font-medium">Carte bancaire</div>
            <div className="text-xs text-gray-500">Visa, Mastercard, American Express</div>
          </div>
        </Button>
      )}

      {canPayBySepa && (
        <Button
          variant="outline"
          className="w-full h-14 justify-start text-left hover:bg-green-50 hover:border-green-200"
          onClick={onSelectSepa}
          disabled={disabled}
        >
          {disabled ? (
            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
          ) : (
            <Building2 className="h-5 w-5 mr-3 text-green-600" />
          )}
          <div>
            <div className="font-medium">Prelevement SEPA</div>
            <div className="text-xs text-gray-500">Utiliser votre mandat existant</div>
          </div>
        </Button>
      )}

      {!canPayByCard && !canPayBySepa && (
        <div className="text-center py-4 text-gray-500">
          Aucun mode de paiement disponible
        </div>
      )}
    </div>
  );
}
