"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { getBordereauxByOrganisation } from "@/actions/commissions"
import type { BordereauWithDetails } from "@/lib/ui/display-types/commission"
import { FolderOpen, FileText, FileSpreadsheet, Download, Calendar } from "lucide-react"

interface CommercialDocumentsProps {
  commercialId: string
  organisationId: string
}

interface DocumentEntry {
  id: string
  name: string
  type: "PDF" | "Excel"
  url: string
  date: string
  periode: string
}

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export function CommercialDocuments({
  commercialId,
  organisationId,
}: CommercialDocumentsProps) {
  const [documents, setDocuments] = React.useState<DocumentEntry[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true)
      const result = await getBordereauxByOrganisation({
        organisationId,
        apporteurId: commercialId,
      })

      if (result.data) {
        const bordereaux = result.data.bordereaux as any as BordereauWithDetails[]
        const docs: DocumentEntry[] = []

        bordereaux.forEach((bordereau) => {
          // Add PDF document if available
          if (bordereau.fichierPdfUrl) {
            docs.push({
              id: `${bordereau.id}-pdf`,
              name: `Bordereau ${bordereau.reference} - ${bordereau.periode}`,
              type: "PDF",
              url: bordereau.fichierPdfUrl,
              date: formatDate(bordereau.dateExport || bordereau.dateValidation),
              periode: bordereau.periode,
            })
          }

          // Add Excel document if available
          if (bordereau.fichierExcelUrl) {
            docs.push({
              id: `${bordereau.id}-excel`,
              name: `Bordereau ${bordereau.reference} - ${bordereau.periode}`,
              type: "Excel",
              url: bordereau.fichierExcelUrl,
              date: formatDate(bordereau.dateExport || bordereau.dateValidation),
              periode: bordereau.periode,
            })
          }
        })

        // Sort by date descending (most recent first)
        docs.sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return dateB - dateA
        })

        setDocuments(docs)
      }
      setLoading(false)
    }

    fetchDocuments()
  }, [organisationId, commercialId])

  if (loading) {
    return (
      <Card className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-950">
            <FolderOpen className="size-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (documents.length === 0) {
    return (
      <Card className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-950">
            <FolderOpen className="size-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <FileText className="h-10 w-10 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Aucun document</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                Aucun document disponible pour ce commercial.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 flex flex-col">
      <CardHeader>
        <div>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-950">
            <FolderOpen className="size-5" />
            Documents récents
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            Bordereaux et exports associés à ce commercial
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-2">
          <ul className="space-y-3">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1 rounded-lg bg-blue-100 p-2">
                    {doc.type === "PDF" ? (
                      <FileText className="size-4 text-blue-600" />
                    ) : (
                      <FileSpreadsheet className="size-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {doc.name}
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                      <span className="font-medium text-blue-700">{doc.type}</span>
                      <span className="text-slate-400">•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {doc.date}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 hover:bg-blue-50"
                  asChild
                >
                  <a href={doc.url} download target="_blank" rel="noopener noreferrer">
                    <Download className="size-4" />
                    Télécharger
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
