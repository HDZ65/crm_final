'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

type StatusType = 'success' | 'failed' | 'expired' | 'processing' | 'error';

interface PortalStatusProps {
  status: StatusType;
  title: string;
  description: string;
  onRetry?: () => void;
}

export function PortalStatus({ status, title, description, onRetry }: PortalStatusProps) {
  const statusConfig = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    failed: {
      icon: XCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    expired: {
      icon: Clock,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    processing: {
      icon: Loader2,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    error: {
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={`shadow-lg border ${config.borderColor} ${config.bgColor}`}>
      <CardContent className="pt-8 pb-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Icon
              className={`h-16 w-16 ${config.iconColor} ${
                status === 'processing' ? 'animate-spin' : ''
              }`}
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600 max-w-sm mx-auto">{description}</p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reessayer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
