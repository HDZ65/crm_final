import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, Wallet, CheckCircle2, Clock, ArrowLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { listOperations } from "@/actions/wincash"

interface OperationCashback {
  id: string
  reference: string
  marchand: string
  montantAchat: number
  montantCashback: number
  tauxCashback: number
  statut: "tracked" | "validated" | "paid" | "rejected"
  dateAchat: Date
  dateValidation: Date | null
  dateVersement: Date | null
}

const STATUT_LABELS = {
  tracked: "En attente",
  validated: "Validé",
  paid: "Payé",
  rejected: "Rejeté"
}

const STATUT_COLORS = {
  tracked: "bg-blue-100 text-blue-700",
  validated: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700"
}

async function getOperations(token: string): Promise<OperationCashback[]> {
  // TODO: Get organisationId from client token or session
  // For now, return empty array as we need organisationId to fetch operations
  return [];
  
  // Fetch cashback operations for the client
  // const { data: operationsData, error } = await listOperations({ 
  //   organisationId: "", // TODO: Get from client
  //   clientId: token,
  //   pagination: { page: 1, limit: 100 }
  // });
  
  // if (error || !operationsData || !operationsData.operations) {
  //   console.error("[getOperations] Error fetching operations:", error);
  //   return [];
  // }

  // Map proto response to OperationCashback interface
  // return operationsData.operations.map(op => {
  //   const montantAchat = parseFloat(op.montantAchat || "0");
  //   const montantCashback = parseFloat(op.montantCashback || "0");
  //   const tauxCashback = montantAchat > 0 ? (montantCashback / montantAchat) * 100 : 0;

  //   return {
  //     id: op.id || "",
  //     reference: op.reference || "",
  //     dateOperation: op.dateOperation || "",
  //     commercant: op.commercant || "",
  //     montantAchat,
  //     montantCashback,
  //     tauxCashback,
  //     statut: (op.statut || "en_attente") as "en_attente" | "valide" | "verse" | "annule",
  //     dateVersement: op.dateVersement || null
  //   };
  // });
}

export default async function WincashPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const operations = await getOperations(token)
  
  const totalCashback = operations
    .filter(op => op.statut === "paid")
    .reduce((sum, op) => sum + op.montantCashback, 0)
  
  const pendingCashback = operations
    .filter(op => op.statut === "tracked" || op.statut === "validated")
    .reduce((sum, op) => sum + op.montantCashback, 0)

   return (
     <div className="container max-w-6xl py-8">
       <Link href={`/portal/${token}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
         <ArrowLeft className="h-4 w-4" />
         Retour
       </Link>
       <div className="mb-8">
         <h1 className="text-3xl font-bold">Wincash - Mon Cashback</h1>
         <p className="text-muted-foreground mt-2">
           Suivez vos économies et vos opérations cashback
         </p>
       </div>

      {/* Résumé */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Cashback reçu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {totalCashback.toFixed(2)} €
            </div>
            <p className="text-xs text-green-600 mt-1">Versé sur votre compte</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {pendingCashback.toFixed(2)} €
            </div>
            <p className="text-xs text-blue-600 mt-1">En cours de validation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total économies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(totalCashback + pendingCashback).toFixed(2)} €
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {operations.length} opération{operations.length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des opérations */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des opérations</CardTitle>
          <CardDescription>
            Toutes vos opérations cashback
          </CardDescription>
        </CardHeader>
        <CardContent>
          {operations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune opération cashback</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marchand</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Achat</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                  <TableHead className="text-right">Cashback</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-medium">{op.marchand}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(op.dateAchat, { addSuffix: true, locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      {op.montantAchat.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {op.tauxCashback}%
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      +{op.montantCashback.toFixed(2)} €
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUT_COLORS[op.statut]}>
                        {STATUT_LABELS[op.statut]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
