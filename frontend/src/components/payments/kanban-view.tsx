"use client"

import * as React from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarEmptyState } from "@/components/payments/empty-states"
import type {
  DebitLot,
  Payment,
} from "@/lib/ui/display-types/payment"
import { PaymentStatus } from "@proto/payments/payment"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { GripVertical, Inbox } from "lucide-react"

// ---------- constants ----------

const UNASSIGNED_KEY = "__unassigned__"

const UNASSIGNED_LOT: DebitLot = {
  id: UNASSIGNED_KEY,
  name: "Non assignés",
  startDay: 0,
  endDay: 0,
  isActive: true,
  displayOrder: 9999,
}

// ---------- helpers ----------

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function statusConfig(status: PaymentStatus): {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
  className: string
} {
  switch (status) {
    case PaymentStatus.PAYMENT_STATUS_PAID:
      return {
        label: "Payé",
        variant: "default",
        className: "bg-emerald-500/90 text-white hover:bg-emerald-500",
      }
    case PaymentStatus.PAYMENT_STATUS_PENDING:
      return {
        label: "En attente",
        variant: "secondary",
        className: "bg-blue-500/90 text-white hover:bg-blue-500",
      }
    case PaymentStatus.PAYMENT_STATUS_SUBMITTED:
      return {
        label: "Soumis",
        variant: "secondary",
        className: "bg-sky-500/90 text-white hover:bg-sky-500",
      }
    case PaymentStatus.PAYMENT_STATUS_REJECTED:
      return {
        label: "Rejeté",
        variant: "destructive",
        className: "bg-red-500/90 text-white hover:bg-red-500",
      }
    case PaymentStatus.PAYMENT_STATUS_FAILED:
      return {
        label: "Échoué",
        variant: "destructive",
        className: "bg-red-600/90 text-white hover:bg-red-600",
      }
    case PaymentStatus.PAYMENT_STATUS_REFUNDED:
      return {
        label: "Remboursé",
        variant: "outline",
        className: "border-amber-500 text-amber-600",
      }
    case PaymentStatus.PAYMENT_STATUS_CANCELLED:
      return {
        label: "Annulé",
        variant: "outline",
        className: "border-muted-foreground text-muted-foreground",
      }
    default:
      return {
        label: "Inconnu",
        variant: "outline",
        className: "border-muted-foreground text-muted-foreground",
      }
  }
}

function riskBorderColor(tier?: string): string {
  switch (tier) {
    case "LOW":
      return "border-l-emerald-500"
    case "MEDIUM":
      return "border-l-amber-500"
    case "HIGH":
      return "border-l-red-500"
    default:
      return "border-l-transparent"
  }
}

function groupPaymentsByLot(
  payments: Payment[],
  lots: DebitLot[]
): Map<string, Payment[]> {
  const lotIds = new Set(lots.map((l) => l.id))
  const columns = new Map<string, Payment[]>()

  // Initialize all lot columns
  for (const lot of lots) {
    columns.set(lot.id, [])
  }
  // Always have unassigned column
  columns.set(UNASSIGNED_KEY, [])

  for (const payment of payments) {
    const lotId = payment.debit_lot
    if (lotId && lotIds.has(lotId)) {
      columns.get(lotId)!.push(payment)
    } else {
      columns.get(UNASSIGNED_KEY)!.push(payment)
    }
  }

  return columns
}

// ---------- types ----------

interface KanbanViewProps {
  lots: DebitLot[]
  payments: Payment[]
}

interface PendingMove {
  payment: Payment
  fromLotId: string
  toLotId: string
}

// ---------- sortable card ----------

function SortablePaymentCard({
  payment,
  isOverlay,
}: {
  payment: Payment
  isOverlay?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: payment.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const status = statusConfig(payment.status)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-l-4 transition-shadow",
        riskBorderColor(payment.risk_tier),
        isDragging && "opacity-40",
        isOverlay && "rotate-2 shadow-xl ring-2 ring-primary/20"
      )}
    >
      <CardContent className="flex items-start gap-2 p-3">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate text-sm font-medium leading-tight">
              {payment.client_name}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {formatAmount(payment.amount)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className={cn("text-[10px] px-1.5 py-0", status.className)}>
              {status.label}
            </Badge>
            {payment.psp_provider && (
              <span className="truncate text-[10px] text-muted-foreground">
                {payment.psp_provider}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- column ----------

function KanbanColumn({
  lot,
  payments,
}: {
  lot: DebitLot
  payments: Payment[]
}) {
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  const isUnassigned = lot.id === UNASSIGNED_KEY

  return (
    <div className="flex min-w-[280px] flex-shrink-0 flex-col rounded-lg border bg-muted/30">
      {/* Column header */}
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <div className="flex items-center gap-2 overflow-hidden">
          {isUnassigned && (
            <Inbox className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-sm font-semibold">{lot.name}</span>
          <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
            {payments.length}
          </Badge>
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
          {formatAmount(totalAmount)}
        </span>
      </div>

      {/* Cards area */}
      <SortableContext
        items={payments.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
          {payments.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8 text-xs text-muted-foreground">
              Aucun prélèvement
            </div>
          ) : (
            payments.map((payment) => (
              <SortablePaymentCard key={payment.id} payment={payment} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// ---------- main component ----------

export function KanbanView({ lots, payments }: KanbanViewProps) {
  // Empty state guard
  if (lots.length === 0) {
    return <CalendarEmptyState />
  }

  // Sort lots by displayOrder
  const sortedLots = React.useMemo(
    () => [...lots].sort((a, b) => a.displayOrder - b.displayOrder),
    [lots]
  )

  // All columns including unassigned
  const allLots = React.useMemo(
    () => [...sortedLots, UNASSIGNED_LOT],
    [sortedLots]
  )

  // Columns state: Map<lotId, Payment[]>
  const [columns, setColumns] = React.useState<Map<string, Payment[]>>(() =>
    groupPaymentsByLot(payments, sortedLots)
  )

  // Re-sync when props change
  React.useEffect(() => {
    setColumns(groupPaymentsByLot(payments, sortedLots))
  }, [payments, sortedLots])

  // Pending move for confirmation dialog
  const [pendingMove, setPendingMove] = React.useState<PendingMove | null>(null)

  // Active drag item for overlay
  const [activePayment, setActivePayment] = React.useState<Payment | null>(null)

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  // Find which column a payment belongs to
  const findColumnForPayment = React.useCallback(
    (paymentId: string): string | undefined => {
      for (const [lotId, lotPayments] of columns) {
        if (lotPayments.some((p) => p.id === paymentId)) {
          return lotId
        }
      }
      return undefined
    },
    [columns]
  )

  // Drag start: track active item for overlay
  const handleDragStart = React.useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      for (const lotPayments of columns.values()) {
        const found = lotPayments.find((p) => p.id === active.id)
        if (found) {
          setActivePayment(found)
          break
        }
      }
    },
    [columns]
  )

  // Drag end: show confirmation if dropped in different column
  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      setActivePayment(null)
      const { active, over } = event

      if (!over) return

      const activeId = String(active.id)
      const overId = String(over.id)

      const fromLotId = findColumnForPayment(activeId)
      if (!fromLotId) return

      // Determine target column: over could be a card or a column container
      let toLotId: string | undefined

      // Check if overId is a lot/column id
      if (columns.has(overId)) {
        toLotId = overId
      } else {
        // overId is a card → find its column
        toLotId = findColumnForPayment(overId)
      }

      if (!toLotId || fromLotId === toLotId) return

      // Find the payment being moved
      const payment = columns.get(fromLotId)?.find((p) => p.id === activeId)
      if (!payment) return

      // Set pending move → confirmation dialog
      setPendingMove({ payment, fromLotId, toLotId })
    },
    [columns, findColumnForPayment]
  )

  // Confirm move
  const handleConfirmMove = React.useCallback(() => {
    if (!pendingMove) return

    const { payment, fromLotId, toLotId } = pendingMove

    setColumns((prev) => {
      const next = new Map(prev)

      // Remove from source
      const fromList = [...(next.get(fromLotId) ?? [])]
      const idx = fromList.findIndex((p) => p.id === payment.id)
      if (idx !== -1) fromList.splice(idx, 1)
      next.set(fromLotId, fromList)

      // Add to target
      const toList = [...(next.get(toLotId) ?? [])]
      toList.push({ ...payment, debit_lot: toLotId === UNASSIGNED_KEY ? undefined : toLotId })
      next.set(toLotId, toList)

      return next
    })

    toast.success("Prélèvement déplacé")
    setPendingMove(null)
  }, [pendingMove])

  // Cancel move
  const handleCancelMove = React.useCallback(() => {
    setPendingMove(null)
  }, [])

  // Resolve lot names for dialog
  const fromLotName =
    pendingMove
      ? allLots.find((l) => l.id === pendingMove.fromLotId)?.name ?? "Inconnu"
      : ""
  const toLotName =
    pendingMove
      ? allLots.find((l) => l.id === pendingMove.toLotId)?.name ?? "Inconnu"
      : ""

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-row gap-4 overflow-x-auto pb-4">
          {allLots.map((lot) => (
            <KanbanColumn
              key={lot.id}
              lot={lot}
              payments={columns.get(lot.id) ?? []}
            />
          ))}
        </div>

        {/* Drag overlay for smooth visual feedback */}
        <DragOverlay>
          {activePayment ? (
            <SortablePaymentCard payment={activePayment} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Confirmation AlertDialog */}
      <AlertDialog
        open={pendingMove !== null}
        onOpenChange={(open) => {
          if (!open) handleCancelMove()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le déplacement</AlertDialogTitle>
            <AlertDialogDescription>
              Déplacer{" "}
              <span className="font-medium text-foreground">
                {pendingMove?.payment.client_name}
              </span>{" "}
              du lot{" "}
              <span className="font-medium text-foreground">{fromLotName}</span>{" "}
              vers le lot{" "}
              <span className="font-medium text-foreground">{toLotName}</span> ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMove}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
