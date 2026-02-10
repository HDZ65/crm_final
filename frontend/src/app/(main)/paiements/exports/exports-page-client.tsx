"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createExportJob, listExportJobs } from "@/actions/exports"
import { toast } from "sonner"
import { Download, Loader2, Plus, RefreshCw, Search } from "lucide-react"

interface ExportsPageClientProps {
  initialJobs?: any[] | null
  initialSocieteId?: string
}

interface ExportFormData {
  exportType: string
  format: string
  fromDate: string
  toDate: string
}

function getDefaultFormData(): ExportFormData {
  const now = new Date()
  const toDate = now.toISOString().split("T")[0]
  const fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  return {
    exportType: "CSV_ACCOUNTING",
    format: "CSV",
    fromDate,
    toDate,
  }
}

function formatDate(value?: string) {
  if (!value) return "-"
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return value
  return parsedDate.toLocaleString("fr-FR")
}

function getStatusVariant(status: string) {
  if (status === "FAILED") return "destructive"
  if (status === "COMPLETED") return "default"
  return "secondary"
}

export function ExportsPageClient({ initialJobs, initialSocieteId }: ExportsPageClientProps) {
  const societeId = initialSocieteId || ""

  const [jobs, setJobs] = React.useState<any[]>(initialJobs || [])
  const [loading, setLoading] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [formData, setFormData] = React.useState<ExportFormData>(getDefaultFormData)

  const fetchJobs = React.useCallback(async () => {
    if (!societeId) {
      setJobs([])
      return
    }

    setLoading(true)
    const result = await listExportJobs({ societeId, page: 1, limit: 100 } as any)
    if (result.error) {
      toast.error(result.error)
    } else {
      setJobs(result.data?.jobs || [])
    }
    setLoading(false)
  }, [societeId])

  const filteredJobs = React.useMemo(() => {
    if (!search) return jobs

    const query = search.toLowerCase()
    return jobs.filter((job) => {
      const exportType = String(job.exportType ?? job.export_type ?? "").toLowerCase()
      const status = String(job.status || "").toLowerCase()
      const fileName = String(job.fileName ?? job.file_name ?? "").toLowerCase()

      return exportType.includes(query) || status.includes(query) || fileName.includes(query)
    })
  }, [jobs, search])

  const handleOpenCreateDialog = () => {
    setFormData(getDefaultFormData())
    setDialogOpen(true)
  }

  const handleCreateExport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!societeId) {
      toast.error("Aucune societe active detectee")
      return
    }

    if (!formData.exportType || !formData.fromDate || !formData.toDate) {
      toast.error("Type d'export et periode obligatoires")
      return
    }

    setLoading(true)
    const result = await createExportJob({
      societeId,
      exportType: formData.exportType,
      format: formData.format,
      fromDate: formData.fromDate,
      toDate: formData.toDate,
      metadata: {},
    } as any)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Export lance")
      setDialogOpen(false)
      await fetchJobs()
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Consultez l'historique et declenchez de nouveaux exports comptables.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchJobs} disabled={loading || !societeId}>
            <RefreshCw className="mr-2 size-4" />
            Actualiser
          </Button>
          <Button onClick={handleOpenCreateDialog} disabled={!societeId}>
            <Plus className="mr-2 size-4" />
            Nouvel export
          </Button>
        </div>
      </div>

      {!societeId && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Impossible de charger les exports: aucune societe active.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Historique des exports</CardTitle>
              <CardDescription>
                {jobs.length} export{jobs.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-full max-w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un export..."
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
                <TableHead>Periode</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Lignes</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Creation</TableHead>
                <TableHead className="text-right">Fichier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    {search ? "Aucun export correspondant" : "Aucun export disponible"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => {
                  const status = String(job.status || "PENDING")
                  const fileUrl = job.fileUrl ?? job.file_url
                  const fileName = job.fileName ?? job.file_name
                  const fromDate = job.fromDate ?? job.from_date
                  const toDate = job.toDate ?? job.to_date
                  const createdAt = job.createdAt ?? job.created_at

                  return (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs">{job.id}</TableCell>
                      <TableCell className="font-medium">
                        {job.exportType ?? job.export_type ?? "-"}
                      </TableCell>
                      <TableCell>{fromDate && toDate ? `${fromDate} -> ${toDate}` : "-"}</TableCell>
                      <TableCell>{job.format || "-"}</TableCell>
                      <TableCell>{job.recordCount ?? job.record_count ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(status) as any}>{status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {fileUrl ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(fileUrl, "_blank")}
                            className="gap-1"
                          >
                            <Download className="size-4" />
                            {fileName || "Telecharger"}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Indisponible</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declencher un export</DialogTitle>
            <DialogDescription>
              Choisissez le type d'export et la periode a extraire.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateExport}>
            <div className="space-y-2">
              <Label htmlFor="export-type">Type d'export</Label>
              <Select
                value={formData.exportType}
                onValueChange={(value) => setFormData((previous) => ({ ...previous, exportType: value }))}
              >
                <SelectTrigger id="export-type">
                  <SelectValue placeholder="Selectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV_ACCOUNTING">Comptabilite CSV</SelectItem>
                  <SelectItem value="SEPA_XML">SEPA XML</SelectItem>
                  <SelectItem value="FEC">FEC</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="export-format">Format</Label>
              <Select
                value={formData.format}
                onValueChange={(value) => setFormData((previous) => ({ ...previous, format: value }))}
              >
                <SelectTrigger id="export-format">
                  <SelectValue placeholder="Selectionnez un format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="XML">XML</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-date">Du</Label>
                <DatePicker
                  id="from-date"
                  value={formData.fromDate}
                  onChange={(value) =>
                    setFormData((previous) => ({ ...previous, fromDate: value }))
                  }
                  placeholder="Sélectionnez une date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-date">Au</Label>
                <DatePicker
                  id="to-date"
                  value={formData.toDate}
                  onChange={(value) =>
                    setFormData((previous) => ({ ...previous, toDate: value }))
                  }
                  placeholder="Sélectionnez une date"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Lancer l'export
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
