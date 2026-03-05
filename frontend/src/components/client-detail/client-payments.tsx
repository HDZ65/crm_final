"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreditCard, Calendar, CheckCircle2, Wallet, Settings2 } from "lucide-react"
import { toast } from "sonner"
import type { Payment } from "@/lib/ui/display-types/client"
import type { DebitLot } from "@/lib/ui/display-types/payment"

interface ClientPaymentsProps {
  payments: Payment[]
  balance: string
  balanceStatus: string
}

export function ClientPayments({
  payments,
  balance,
  balanceStatus,
}: ClientPaymentsProps) {
  const [lots] = React.useState<DebitLot[]>([])
  const [selectedLotId, setSelectedLotId] = React.useState("")
  const [preferredDay, setPreferredDay] = React.useState<number | "">("")
  const [shiftStrategy, setShiftStrategy] = React.useState("")
  function handleSaveConfig() {
    // Stub — no real gRPC call yet
    toast.success("Configuration mise \u00e0 jour")
  }

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="size-5" />
          Configuration du pr\u00e9l\u00e8vement
        </CardTitle>
        <CardDescription>
          Param\u00e8tres de pr\u00e9l\u00e8vement pour ce client.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Lot actuel</Label>
            {lots.length > 0 ? (
              <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="S\u00e9lectionner un lot" />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.name} (J{lot.startDay}\u2013J{lot.endDay})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                Aucun lot configur\u00e9
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Jour pr\u00e9f\u00e9r\u00e9</Label>
            <Input
              type="number"
              min={1}
              max={28}
              placeholder="1-28"
              value={preferredDay}
              onChange={(e) => {
                const v = e.target.value
                setPreferredDay(v === "" ? "" : Math.min(28, Math.max(1, Number(v))))
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Strat\u00e9gie de d\u00e9calage</Label>
            <Select value={shiftStrategy} onValueChange={setShiftStrategy}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="S\u00e9lectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEXT_BUSINESS_DAY">Prochain jour ouvr\u00e9</SelectItem>
                <SelectItem value="PREVIOUS_DAY">Jour pr\u00e9c\u00e9dent</SelectItem>
                <SelectItem value="SAME_DAY">M\u00eame jour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={handleSaveConfig}>
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
      <CardHeader>
        <div>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-950">
            <CreditCard className="size-5" />
            Prélèvements à venir
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            Projection sur les 30 prochains jours
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-blue-200">
          <Wallet className="size-5 text-blue-600" />
          <span className="text-sm text-slate-700 font-medium">Solde client:</span>
          <span className="text-lg font-semibold text-blue-700">{balance}</span>
          <Badge variant="secondary" className="bg-blue-100 border-blue-300 text-blue-700">
            <CheckCircle2 className="size-3 mr-1" />
            {balanceStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.label}
            className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-blue-100 p-2">
                <CreditCard className="size-4 text-blue-600" />
              </div>
              <div>
                <div className="text-base font-medium text-slate-900">{payment.label}</div>
                <div className="text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="size-3.5" />
                  Échéance {payment.date}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold text-slate-900">{payment.amount}</span>
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                <CheckCircle2 className="size-3 mr-1" />
                {payment.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
    </div>
  )
}
