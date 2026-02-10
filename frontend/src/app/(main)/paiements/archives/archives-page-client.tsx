"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listExportJobs } from "@/actions/exports"
import { toast } from "sonner"
import { RefreshCw, Search } from "lucide-react"

interface ArchivesPageClientProps {
  initialArchives?: any[] | null
  initialSocieteId?: string
}

function formatDate(value?: string) {
  if (!value) return "-"
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return value
  return parsedDate.toLocaleString("fr-FR")
}

export function ArchivesPageClient({ initialArchives, initialSocieteId }: ArchivesPageClientProps) {
  const [archives, setArchives] = React.useState<any[]>(initialArchives || [])
  const [societeId] = React.useState(initialSocieteId || "")
  const [search, setSearch] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const fetchArchives = React.useCallback(async () => {
    if (!societeId) {
      setArchives([])
      return
    }

    setLoading(true)
    const result = await listExportJobs({ societeId, status: "COMPLETED", page: 1, limit: 100 } as any)
    if (result.error) {
      toast.error(result.error)
    } else {
      setArchives(result.data?.jobs || [])
    }
    setLoading(false)
  }, [societeId])

  const filteredArchives = React.useMemo(() => {
    if (!search) return archives

    const query = search.toLowerCase()
    return archives.filter((archive) => {
      const exportType = String(archive.exportType ?? archive.export_type ?? "").toLowerCase()
      const fileName = String(archive.fileName ?? archive.file_name ?? "").toLowerCase()
      const status = String(archive.status ?? "").toLowerCase()

      return exportType.includes(query) || fileName.includes(query) || status.includes(query)
    })
  }, [archives, search])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Consultez les archives de paiements exportes (lecture seule).
        </p>
        <Button variant="outline" onClick={fetchArchives} disabled={loading || !societeId}>
          <RefreshCw className="mr-2 size-4" />
          Actualiser
        </Button>
      </div>

      {!societeId && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Impossible de charger les archives: aucune societe active.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Historique des archives</CardTitle>
              <CardDescription>
                {archives.length} archive{archives.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-full max-w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une archive..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Lignes</TableHead>
                <TableHead>Fichier</TableHead>
                <TableHead>Termine le</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArchives.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {search ? "Aucune archive correspondante" : "Aucune archive disponible"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredArchives.map((archive) => {
                  const format = archive.format || "-"
                  const status = archive.status || "-"
                  const fileName = archive.fileName ?? archive.file_name ?? "-"
                  const completedAt = archive.completedAt ?? archive.completed_at

                  return (
                    <TableRow key={archive.id}>
                      <TableCell className="font-mono text-xs">{archive.id}</TableCell>
                      <TableCell className="font-medium">
                        {archive.exportType ?? archive.export_type ?? "-"}
                      </TableCell>
                      <TableCell>{format}</TableCell>
                      <TableCell>{archive.recordCount ?? archive.record_count ?? 0}</TableCell>
                      <TableCell className="max-w-60 truncate">{fileName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(completedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status === "COMPLETED" ? "default" : "secondary"}>
                          {status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
