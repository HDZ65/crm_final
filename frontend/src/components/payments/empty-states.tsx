"use client"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Layers,
  Lightbulb,
} from "lucide-react"

export function PaymentsEmptyState({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <Empty className={className} {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CreditCard />
        </EmptyMedia>
        <EmptyTitle>Aucun prélèvement ce mois-ci</EmptyTitle>
        <EmptyDescription>
          Aucun prélèvement n'est planifié pour ce mois. Connectez un PSP ou
          créez des prélèvements manuellement.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function CalendarEmptyState({
  className,
  onCreateLot,
  ...props
}: React.ComponentProps<"div"> & { onCreateLot?: () => void }) {
  return (
    <Empty className={className} {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarDays />
        </EmptyMedia>
        <EmptyTitle>Aucun prélèvement planifié</EmptyTitle>
        <EmptyDescription>
          Le calendrier est vide. Créez des lots de prélèvement pour commencer
          à planifier.
        </EmptyDescription>
      </EmptyHeader>
      {onCreateLot && (
        <EmptyContent>
          <Button onClick={onCreateLot} size="sm">
            Créer un lot
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

export function AnalyticsEmptyState({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <Empty className={className} {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BarChart3 />
        </EmptyMedia>
        <EmptyTitle>Pas assez de données pour l'analyse</EmptyTitle>
        <EmptyDescription>
          L'analyse nécessite au moins 1 mois de données de paiement. Revenez
          une fois que des prélèvements ont été traités.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function OptimizationEmptyState({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <Empty className={className} {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Lightbulb />
        </EmptyMedia>
        <EmptyTitle>Analyse indisponible</EmptyTitle>
        <EmptyDescription>
          L'optimisation nécessite au moins 3 mois d'historique et 3 paiements
          par client. Revenez plus tard.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function LotsEmptyState({
  className,
  onCreateLot,
  ...props
}: React.ComponentProps<"div"> & { onCreateLot?: () => void }) {
  return (
    <Empty className={className} {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Layers />
        </EmptyMedia>
        <EmptyTitle>Aucun lot configuré</EmptyTitle>
        <EmptyDescription>
          Créez votre premier lot de prélèvement pour organiser vos paiements
          par période du mois.
        </EmptyDescription>
      </EmptyHeader>
      {onCreateLot && (
        <EmptyContent>
          <Button onClick={onCreateLot} size="sm">
            Créer un lot
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
