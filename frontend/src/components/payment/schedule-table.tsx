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
import { Trash2, Edit } from "lucide-react"
import type { ScheduleResponse } from "@proto/payments/payment"

interface ScheduleTableProps {
  schedules: ScheduleResponse[]
  onEdit?: (schedule: ScheduleResponse) => void
  onDelete?: (scheduleId: string) => void
}

const statusColors: Record<string, string> = {
  PLANNED: "bg-blue-500",
  PROCESSING: "bg-yellow-500",
  PENDING: "bg-orange-500",
  PAID: "bg-green-500",
  FAILED: "bg-red-500",
  UNPAID: "bg-red-700",
  CANCELLED: "bg-gray-500",
  EXPIRED: "bg-gray-400",
}

export function ScheduleTable({ schedules, onEdit, onDelete }: ScheduleTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Tentatives</TableHead>
            <TableHead>Dernière erreur</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                <TableCell className="font-medium">
                  {schedule.amount.toFixed(2)} {schedule.currency}
                </TableCell>
                <TableCell>
                  <div>{new Date(schedule.dueDate).toLocaleDateString("fr-FR")}</div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[schedule.status] || "bg-gray-500"}>
                    {schedule.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={schedule.retryCount > 0 ? "text-orange-500 font-medium" : ""}>
                    {schedule.retryCount}
                  </span>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {schedule.errorMessage ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-xs text-red-500 truncate block">
                          {schedule.errorMessage.slice(0, 30)}...
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{schedule.errorMessage}</p>
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
