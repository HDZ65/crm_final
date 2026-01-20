'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle2 } from 'lucide-react';

interface MandateInfoProps {
  mandate: {
    rumMasked: string;
    bankName: string;
    accountEnding: string;
  };
}

export function MandateInfo({ mandate }: MandateInfoProps) {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-green-600" />
            Mandat SEPA actif
          </CardTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Actif
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Reference</p>
            <p className="font-mono font-medium">{mandate.rumMasked}</p>
          </div>
          <div>
            <p className="text-gray-500">Banque</p>
            <p className="font-medium">{mandate.bankName}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Compte</p>
            <p className="font-mono font-medium">**** **** **** {mandate.accountEnding}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
