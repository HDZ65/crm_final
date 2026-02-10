import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, User, ArrowLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { listCas } from "@/actions/justi-plus"

interface CasJuridique {
  id: string
  reference: string
  titre: string
  categorie: string
  statut: "ouvert" | "en_cours" | "en_attente_documents" | "cloture"
  avocatAssigne: string | null
  dateOuverture: Date
  dateCloture: Date | null
  documentsCount: number
}

const STATUT_LABELS = {
  ouvert: "Ouvert",
  en_cours: "En cours",
  en_attente_documents: "En attente documents",
  cloture: "Clos"
}

const STATUT_COLORS = {
  ouvert: "bg-blue-100 text-blue-700",
  en_cours: "bg-yellow-100 text-yellow-700",
  en_attente_documents: "bg-orange-100 text-orange-700",
  cloture: "bg-gray-100 text-gray-700"
}

const CATEGORIE_LABELS: Record<string, string> = {
  droit_travail: "Droit du travail",
  droit_famille: "Droit de la famille",
  droit_consommation: "Droit de la consommation",
  droit_logement: "Droit du logement",
  autre: "Autre"
}

async function getCases(token: string): Promise<CasJuridique[]> {
  // TODO: Get organisationId from client token or session
  // For now, return empty array as we need organisationId to fetch cases
  return [];
  
  // Fetch legal cases for the client
  // const { data: casesData, error } = await listCas({ 
  //   organisationId: "", // TODO: Get from client
  //   clientId: token,
  //   pagination: { page: 1, limit: 100 }
  // });
  
  // if (error || !casesData || !casesData.cas) {
  //   console.error("[getCases] Error fetching cases:", error);
  //   return [];
  // }

  // Map proto response to CasJuridique interface
  // return casesData.cas.map(cas => ({
  //   id: cas.id || "",
  //   reference: cas.reference || "",
  //   titre: cas.titre || "",
  //   categorie: cas.categorie || "autre",
  //   statut: (cas.statut || "ouvert") as "ouvert" | "en_cours" | "en_attente_documents" | "cloture",
  //   avocatAssigne: cas.avocatAssigne || null,
  //   dateOuverture: cas.dateOuverture || "",
  //   dateDerniereModification: cas.dateDerniereModification || "",
  //   description: cas.description || "",
  //   documentsCount: cas.documentsCount || 0,
  //   messagesCount: cas.messagesCount || 0
  // }));
}

export default async function JustiPlusPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const cases = await getCases(token)
  
  const activeCases = cases.filter(c => c.statut !== "cloture")

   return (
     <div className="container max-w-6xl py-8">
       <Link href={`/portal/${token}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
         <ArrowLeft className="h-4 w-4" />
         Retour
       </Link>
       <div className="mb-8">
         <h1 className="text-3xl font-bold">Justi+ - Mes Dossiers Juridiques</h1>
         <p className="text-muted-foreground mt-2">
           Consultez et suivez vos dossiers d'assistance juridique
         </p>
       </div>

      {/* Résumé */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dossiers actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCases.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total dossiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cases.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {cases.reduce((sum, c) => sum + c.documentsCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des dossiers */}
      <div className="space-y-4">
        {cases.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun dossier juridique</p>
              <Button className="mt-4">Créer un dossier</Button>
            </CardContent>
          </Card>
        ) : (
          cases.map((cas) => (
            <Card key={cas.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{cas.titre}</CardTitle>
                      <Badge className={STATUT_COLORS[cas.statut]}>
                        {STATUT_LABELS[cas.statut]}
                      </Badge>
                    </div>
                    <CardDescription>
                      Référence: {cas.reference} • {CATEGORIE_LABELS[cas.categorie] || cas.categorie}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Ouvert</p>
                      <p className="font-medium">
                        {formatDistanceToNow(cas.dateOuverture, { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                  </div>
                  {cas.avocatAssigne && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Avocat</p>
                        <p className="font-medium">{cas.avocatAssigne}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Documents</p>
                      <p className="font-medium">{cas.documentsCount}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm">
                    Voir le dossier
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
