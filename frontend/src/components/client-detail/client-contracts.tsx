"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, CheckCircle2, Calendar, CreditCard, User, Briefcase } from "lucide-react"
import type { Contract } from "@/lib/ui/display-types/contract"

interface ClientContractsProps {
  contracts: Contract[]
  selectedRef: string
  onSelectContract: (ref: string) => void
}

export function ClientContracts({
  contracts,
  selectedRef,
  onSelectContract,
}: ClientContractsProps) {
  return (
    <Card className="flex-1 bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
      <CardHeader>
        <div>
          <CardTitle className="text-lg flex items-center gap-2 text-sky-950">
            <FileText className="size-5" />
            Contrats
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            Gestion des contrats actifs et historique
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex-1 min-h-0 overflow-hidden rounded-md border bg-white">
          <Table aria-label="Tableau des contrats du client">
            <TableHeader>
              <TableRow className="bg-sidebar text-sidebar-foreground hover:bg-sidebar">
                <TableHead>Référence</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Commercial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow
                  key={contract.ref}
                  data-state={selectedRef === contract.ref ? "selected" : undefined}
                  className="cursor-pointer"
                  onClick={() => onSelectContract(contract.ref)}
                  title="Voir l'historique du contrat"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-sky-600" />
                      {contract.ref}
                    </div>
                  </TableCell>
                  <TableCell>{contract.product}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 border-emerald-200 text-emerald-700"
                    >
                      <CheckCircle2 className="size-3 mr-1" />
                      {contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="size-4 text-slate-500" />
                      {contract.start}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="size-4 text-slate-500" />
                      {contract.pay}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="size-4 text-slate-500" />
                      {contract.sales}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
