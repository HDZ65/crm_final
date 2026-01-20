"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Calendar, CheckCircle2, Wallet, TrendingUp } from "lucide-react"
import type { Payment } from "@/types/client"

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
  return (
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
  )
}
