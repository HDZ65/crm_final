"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Trash2, Edit, RefreshCw, CreditCard, Banknote } from "lucide-react"
import type { Schedule, ScheduleStatus, PSPName } from "@/types/schedule"

interface ScheduleTableProps {
  schedules: Schedule[]
  onEdit?: (schedule: Schedule) => void
  onDelete?: (scheduleId: string) => void
}

const statusColors: Record<ScheduleStatus, string> = {
  planned: "bg-blue-500",
  processing: "bg-yellow-500",
  pending: "bg-orange-500",
  paid: "bg-green-500",
  failed: "bg-red-500",
  unpaid: "bg-red-700",
  cancelled: "bg-gray-500",
}

const pspIcons: Record<PSPName, React.ReactNode> = {
  STRIPE: <CreditCard className="h-4 w-4" />,
  GOCARDLESS: <Banknote className="h-4 w-4" />,
  SLIMPAY: <Banknote className="h-4 w-4" />,
  MULTISAFEPAY: <CreditCard className="h-4 w-4" />,
  EMERCHANTPAY: <CreditCard className="h-4 w-4" />,
}

const pspLabels: Record<PSPName, string> = {
  STRIPE: "Stripe",
  GOCARDLESS: "GoCardless",
  SLIMPAY: "SlimPay",
  MULTISAFEPAY: "MultiSafePay",
  EMERCHANTPAY: "eMerchantPay",
}

function formatInterval(unit?: string | null, count?: number | null): string {
  if (!unit || !count) return "-"
  const labels: Record<string, string> = {
    day: count === 1 ? "jour" : "jours",
    week: count === 1 ? "semaine" : "semaines",
    month: "mois",
    year: count === 1 ? "an" : "ans",
  }
  return `${count} ${labels[unit] || unit}`
}

export function ScheduleTable({ schedules, onEdit, onDelete }: ScheduleTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>PSP</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead>Récurrent</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Tentatives</TableHead>
            <TableHead>Dernière erreur</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                Aucun schedule trouvé
              </TableCell>
            </TableRow>
          ) : (
            schedules.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell className="font-mono text-xs">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>{schedule.id.slice(0, 8)}...</TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono">{schedule.id}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {pspIcons[schedule.pspName]}
                    <span className="text-sm">{pspLabels[schedule.pspName]}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {schedule.amount.toFixed(2)} {schedule.currency}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div>{new Date(schedule.dueDate).toLocaleDateString("fr-FR")}</div>
                    {schedule.nextDueDate && (
                      <div className="text-xs text-muted-foreground">
                        Prochain: {new Date(schedule.nextDueDate).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {schedule.isRecurring ? (
                    <div className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 text-blue-500" />
                      <span className="text-sm">
                        {formatInterval(schedule.intervalUnit, schedule.intervalCount)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Ponctuel</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[schedule.status]}>
                    {schedule.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={schedule.retryCount > 0 ? "text-orange-500 font-medium" : ""}>
                    {schedule.retryCount}/{schedule.maxRetries}
                  </span>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {schedule.lastFailureReason ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-xs text-red-500 truncate block">
                          {schedule.lastFailureReason.slice(0, 30)}...
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{schedule.lastFailureReason}</p>
                          {schedule.lastFailureAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(schedule.lastFailureAt).toLocaleString("fr-FR")}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(schedule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
