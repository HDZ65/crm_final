"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { Apporteur } from "@proto/commerciaux/commerciaux"
import type { Contrat } from "@proto/contrats/contrats"
import type { Commission, Bordereau } from "@proto/commission/commission"
import { getApporteur } from "@/actions/commerciaux"
import { CommercialHeader } from "@/components/commercial-detail/commercial-header"
import { CommercialInfoAccordion } from "@/components/commercial-detail/commercial-info-accordion"
import { CommercialCommissions } from "@/components/commercial-detail/commercial-commissions"
import { CommercialContrats } from "@/components/commercial-detail/commercial-contrats"
import { CommercialActivitesTaches } from "@/components/commercial-detail/commercial-activites-taches"
import { CommercialDocuments } from "@/components/commercial-detail/commercial-documents"
import { AskAiCardButton } from "@/components/ask-ai-card-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, FileText, Users, Calendar } from "lucide-react"

interface CommercialDetailClientProps {
  commercialId: string
  organisationId: string
  initialCommercial: Apporteur | null
  initialCommissions?: Commission[]
  initialBordereaux?: Bordereau[]
  initialContrats?: Contrat[]
}

export function CommercialDetailClient({ 
  commercialId, 
  organisationId,
  initialCommercial,
  initialCommissions,
  initialBordereaux,
  initialContrats,
}: CommercialDetailClientProps) {
  const router = useRouter()
  const [commercial, setCommercial] = React.useState<Apporteur | null>(initialCommercial)

  const refetch = React.useCallback(async () => {
    const result = await getApporteur(commercialId)
    if (result.data) setCommercial(result.data)
  }, [commercialId])

  const handleUpdate = React.useCallback(() => {
    refetch()
  }, [refetch])

  const handleDelete = React.useCallback(() => {
    // Navigation handled by CommercialHeader
  }, [])

  if (!commercial) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Commercial introuvable</p>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-6 min-h-0">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <CommercialHeader
            commercial={commercial}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </div>
        <AskAiCardButton
          prompt={`Commercial: ${commercial.nom} ${commercial.prenom}. Fiche commerciale: type=${commercial.typeApporteur}, email=${commercial.email}, téléphone=${commercial.telephone}, actif=${commercial.actif ? "Oui" : "Non"}, créé le ${commercial.createdAt}. Analyse ce profil commercial et donne des recommandations pour optimiser sa performance.`}
        />
      </div>

      <Tabs
        defaultValue="overview"
        className="w-full gap-4 flex-1 flex flex-col h-full"
      >
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="contrats">Contrats</TabsTrigger>
          <TabsTrigger value="activites-taches">Activités & Tâches</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-start flex-1"
        >
          {/* LEFT COLUMN: Stats + Recent Activity */}
          <div className="lg:col-span-8 flex flex-col gap-4 min-h-0 h-full">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-muted-foreground">Résumé</h3>
              <AskAiCardButton
                prompt={`Commercial: ${commercial.nom} ${commercial.prenom}. Statistiques résumées: ${initialCommissions?.length ?? 0} commissions, ${initialContrats?.length ?? 0} contrats. Analyse les indicateurs clés de performance de ce commercial et suggère des axes d'amélioration.`}
              />
            </div>
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Commissions</CardTitle>
                  <TrendingUp className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">—</div>
                  <p className="text-xs text-muted-foreground">Total à venir</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contrats</CardTitle>
                  <FileText className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">—</div>
                  <p className="text-xs text-muted-foreground">Contrats actifs</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clients</CardTitle>
                  <Users className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">—</div>
                  <p className="text-xs text-muted-foreground">Clients gérés</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dernière activité</CardTitle>
                  <Calendar className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">—</div>
                  <p className="text-xs text-muted-foreground">À venir</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Placeholder */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-base">Activité récente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Les activités récentes apparaîtront ici.</p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Sticky Info Accordion */}
          <CommercialInfoAccordion commercial={commercial} />
        </TabsContent>

        <TabsContent value="commissions" className="flex-1 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Commissions du commercial</h3>
            <AskAiCardButton
              prompt={`Commercial: ${commercial.nom} ${commercial.prenom}. Commissions (${initialCommissions?.length ?? 0} total): ${(initialCommissions ?? []).slice(0, 5).map(c => `Réf: ${c.reference}, Montant brut: ${c.montantBrut}, Net: ${c.montantNetAPayer}, Période: ${c.periode}, Compagnie: ${c.compagnie}`).join(" | ")}. Analyse ces commissions et identifie les tendances.`}
            />
          </div>
          <CommercialCommissions
            commercialId={commercialId}
            organisationId={organisationId}
            initialCommissions={initialCommissions}
            initialBordereaux={initialBordereaux}
          />
        </TabsContent>

        <TabsContent value="contrats" className="flex-1 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Contrats du commercial</h3>
            <AskAiCardButton
              prompt={`Commercial: ${commercial.nom} ${commercial.prenom}. Contrats (${initialContrats?.length ?? 0} total): ${(initialContrats ?? []).slice(0, 5).map(c => `Réf: ${c.reference}, Titre: ${c.titre}, Type: ${c.type}, Statut: ${c.statut}, Montant: ${c.montant}`).join(" | ")}. Analyse ces contrats et donne des insights sur le portefeuille.`}
            />
          </div>
          <CommercialContrats
            commercialId={commercialId}
            organisationId={organisationId}
            initialContrats={initialContrats}
          />
        </TabsContent>

        <TabsContent value="activites-taches" className="flex-1 flex flex-col gap-6">
          <CommercialActivitesTaches
            commercialId={commercialId}
            organisationId={organisationId}
          />
        </TabsContent>

        <TabsContent value="documents" className="flex-1 flex flex-col">
          <CommercialDocuments
            commercialId={commercialId}
            organisationId={organisationId}
          />
        </TabsContent>
      </Tabs>
    </main>
  )
}
