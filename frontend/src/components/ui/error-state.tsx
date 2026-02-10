"use client";

import { AlertTriangle, Wifi, Lock, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

export type ErrorStatusType =
  | "network" // 503 - Service unavailable
  | "unauthorized" // 401 - Unauthenticated
  | "forbidden" // 403 - Permission denied
  | "not-found" // 404 - Resource not found
  | "validation" // 400 - Invalid argument
  | "conflict" // 409 - Already exists / Aborted
  | "timeout" // 504 - Deadline exceeded
  | "internal" // 500 - Internal server error
  | "generic"; // Generic error

interface ErrorStateProps {
  status?: ErrorStatusType;
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

interface ErrorConfig {
  icon: React.ReactNode;
  defaultTitle: string;
  defaultDescription: string;
  showRetry: boolean;
}

const errorConfigs: Record<ErrorStatusType, ErrorConfig> = {
  network: {
    icon: <Wifi className="size-12" />,
    defaultTitle: "Connexion perdue",
    defaultDescription: "Vérifiez votre connexion internet et réessayez.",
    showRetry: true,
  },
  unauthorized: {
    icon: <Lock className="size-12" />,
    defaultTitle: "Authentification requise",
    defaultDescription: "Vous devez vous connecter pour accéder à cette ressource.",
    showRetry: false,
  },
  forbidden: {
    icon: <Lock className="size-12" />,
    defaultTitle: "Accès refusé",
    defaultDescription: "Vous n'avez pas la permission d'accéder à cette ressource.",
    showRetry: false,
  },
  "not-found": {
    icon: <AlertCircle className="size-12" />,
    defaultTitle: "Non trouvé",
    defaultDescription: "La ressource demandée n'existe pas ou a été supprimée.",
    showRetry: false,
  },
  validation: {
    icon: <AlertTriangle className="size-12" />,
    defaultTitle: "Données invalides",
    defaultDescription: "Les données fournies sont invalides. Veuillez vérifier et réessayer.",
    showRetry: false,
  },
  conflict: {
    icon: <AlertTriangle className="size-12" />,
    defaultTitle: "Conflit",
    defaultDescription: "Cette ressource existe déjà ou une action conflictuelle a été tentée.",
    showRetry: false,
  },
  timeout: {
    icon: <Clock className="size-12" />,
    defaultTitle: "Délai dépassé",
    defaultDescription: "La requête a pris trop de temps. Veuillez réessayer.",
    showRetry: true,
  },
  internal: {
    icon: <AlertCircle className="size-12" />,
    defaultTitle: "Erreur serveur",
    defaultDescription: "Une erreur interne est survenue. Veuillez réessayer plus tard.",
    showRetry: true,
  },
  generic: {
    icon: <AlertTriangle className="size-12" />,
    defaultTitle: "Une erreur est survenue",
    defaultDescription: "Une erreur inattendue s'est produite. Veuillez réessayer.",
    showRetry: true,
  },
};

/**
 * Composant d'état d'erreur réutilisable
 * Utilise le composant Empty pour afficher les différentes erreurs
 */
export function ErrorState({
  status = "generic",
  title,
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  const config = errorConfigs[status];
  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;
  const showRetryButton = config.showRetry && onRetry;

  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia className="text-destructive">{config.icon}</EmptyMedia>
        <EmptyTitle>{displayTitle}</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <EmptyDescription>{displayDescription}</EmptyDescription>
        {showRetryButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4"
          >
            <RefreshCw className="size-4 mr-2" />
            Réessayer
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}

/**
 * Composant pour erreur réseau (503)
 */
export function NetworkError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return <ErrorState status="network" onRetry={onRetry} className={className} />;
}

/**
 * Composant pour erreur d'authentification (401)
 */
export function UnauthorizedError({ className }: { className?: string }) {
  return <ErrorState status="unauthorized" className={className} />;
}

/**
 * Composant pour erreur d'autorisation (403)
 */
export function ForbiddenError({ className }: { className?: string }) {
  return <ErrorState status="forbidden" className={className} />;
}

/**
 * Composant pour erreur 404
 */
export function NotFoundError({ className }: { className?: string }) {
  return <ErrorState status="not-found" className={className} />;
}

/**
 * Composant pour erreur de validation (400)
 */
export function ValidationError({ description, className }: { description?: string; className?: string }) {
  return <ErrorState status="validation" description={description} className={className} />;
}

/**
 * Composant pour erreur de conflit (409)
 */
export function ConflictError({ className }: { className?: string }) {
  return <ErrorState status="conflict" className={className} />;
}

/**
 * Composant pour erreur de délai (504)
 */
export function TimeoutError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return <ErrorState status="timeout" onRetry={onRetry} className={className} />;
}

/**
 * Composant pour erreur serveur (500)
 */
export function InternalError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return <ErrorState status="internal" onRetry={onRetry} className={className} />;
}

/**
 * Composant pour erreur générique
 */
export function GenericError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return <ErrorState status="generic" onRetry={onRetry} className={className} />;
}
