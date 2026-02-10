"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataTable } from "@/components/data-table-basic"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ColumnDef } from "@tanstack/react-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Eye,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Archive,
  Send,
  DollarSign,
  User,
  Calendar,
  Download,
} from "lucide-react"
import type {
  BordereauWithDetails,
  StatutBordereau,
  TypeApporteur,
  LigneBordereauDisplay,
} from "@/lib/ui/display-types/commission"
import { formatMontant, parseMontant } from "@/lib/ui/helpers/format"
import { useLignesBordereau } from "@/hooks"

interface BordereauxListProps {
  bordereaux: BordereauWithDetails[]
  loading?: boolean
  onValidate?: (bordereauId: string) => Promise<void>
  onExportPDF?: (bordereauId: string) => Promise<void>
  onExportExcel?: (bordereauId: string) => Promise<void>
}


const formatDate = (date: Date | string | null) => {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

// Labels pour les types d'apporteur
const typeApporteurLabels: Record<TypeApporteur, string> = {
  vrp: "VRP",
  manager: "Manager",
  directeur: "Directeur",
  partenaire: "Partenaire",
}

// Variantes pour les statuts de bordereau
const statutBordereauVariants: Record<StatutBordereau, { icon: React.ReactNode; className: string; label: string }> = {
  brouillon: {
    icon: <Clock className="size-3 mr-1" />,
    className: "bg-warning/10 text-warning border-warning/20",
    label: "Brouillon",
  },
  valide: {
    icon: <CheckCircle2 className="size-3 mr-1" />,
    className: "bg-success/10 text-success border-success/20",
    label: "Validé",
  },
  exporte: {
    icon: <Send className="size-3 mr-1" />,
    className: "bg-info/10 text-info border-info/20",
    label: "Exporté",
  },
  archive: {
    icon: <Archive className="size-3 mr-1" />,
    className: "bg-muted text-muted-foreground border-muted",
    label: "Archivé",
  },
}

export function BordereauxList({
  bordereaux,
  loading,
  onValidate,
  onExportPDF,
  onExportExcel,
}: BordereauxListProps) {
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)
  const [selectedBordereau, setSelectedBordereau] = React.useState<BordereauWithDetails | null>(null)
  const [validating, setValidating] = React.useState<string | null>(null)
  const [exporting, setExporting] = React.useState<string | null>(null)

  // Charger les lignes du bordereau sélectionné
  const { lignes, loading: loadingLignes } = useLignesBordereau(
    selectedBordereau ? { bordereauId: selectedBordereau.id } : null
  )

  const handleViewDetails = (bordereau: BordereauWithDetails) => {
    setSelectedBordereau(bordereau)
    setDetailDialogOpen(true)
  }

  const handleValidate = async (bordereauId: string) => {
    if (!onValidate) return
    setValidating(bordereauId)
    try {
      await onValidate(bordereauId)
    } finally {
      setValidating(null)
    }
  }

  const handleExportPDF = async (bordereauId: string) => {
    if (!onExportPDF) return
    setExporting(bordereauId)
    try {
      await onExportPDF(bordereauId)
    } finally {
      setExporting(null)
    }
  }

  const handleExportExcel = async (bordereauId: string) => {
    if (!onExportExcel) return
    setExporting(bordereauId)
    try {
      await onExportExcel(bordereauId)
    } finally {
      setExporting(null)
    }
  }

  const columns: ColumnDef<BordereauWithDetails>[] = [
    {
      accessorKey: "reference",
      header: "Référence",
      cell: ({ row }) => (
        <div className="font-mono text-xs text-foreground max-w-[140px] truncate" title={row.original.reference}>
          {row.original.reference}
        </div>
      ),
      size: 140,
    },
    {
      accessorKey: "periode",
      header: "Période",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.periode}
        </Badge>
      ),
      size: 100,
    },
    {
      accessorKey: "apporteur",
      header: "Apporteur",
      cell: ({ row }) => {
        const apporteur = row.original.apporteur
        if (!apporteur) return <div className="text-muted-foreground">—</div>

        const fullName = `${apporteur.prenom} ${apporteur.nom}`.trim()
        const typeLabel = typeApporteurLabels[apporteur.typeApporteur] || apporteur.typeApporteur

        return (
          <div className="flex flex-col max-w-[150px]">
            <span className="font-medium text-foreground truncate" title={fullName}>
              {fullName}
            </span>
            <Badge variant="outline" className="w-fit mt-1 text-xs">
              {typeLabel}
            </Badge>
          </div>
        )
      },
      size: 150,
    },
    {
      accessorKey: "nombreLignes",
      header: "Lignes",
      cell: ({ row }) => (
        <div className="text-center font-medium">{row.original.nombreLignes}</div>
      ),
      size: 80,
    },
    {
      accessorKey: "totalBrut",
      header: "Total brut",
      cell: ({ row }) => (
        <div className="font-medium text-success">{formatMontant(row.original.totalBrut)}</div>
      ),
      size: 120,
    },
    {
      accessorKey: "totalReprises",
      header: "Reprises",
      cell: ({ row }) => {
        const reprises = row.original.totalReprises
        if (parseMontant(reprises) === 0) return <div className="text-muted-foreground">--</div>
        return <div className="font-medium text-destructive">{formatMontant(String(-parseMontant(reprises)))}</div>
      },
      size: 100,
    },
    {
      accessorKey: "totalNetAPayer",
      header: "Net à payer",
      cell: ({ row }) => (
        <div className="font-bold text-info text-base">{formatMontant(row.original.totalNetAPayer)}</div>
      ),
      size: 130,
    },
    {
      accessorKey: "statutBordereau",
      header: "Statut",
      cell: ({ row }) => {
        const statut = row.original.statutBordereau
        const variant = statutBordereauVariants[statut] || statutBordereauVariants.brouillon
        return (
          <Badge variant="outline" className={variant.className}>
            {variant.icon}
            {variant.label}
          </Badge>
        )
      },
      size: 120,
    },
    {
      accessorKey: "dateValidation",
      header: "Date validation",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.original.dateValidation)}
        </div>
      ),
      size: 110,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const bordereau = row.original
        const canValidate = bordereau.statutBordereau === "brouillon"
        const canExport = bordereau.statutBordereau === "valide" || bordereau.statutBordereau === "exporte"
        const isValidating = validating === bordereau.id
        const isExporting = exporting === bordereau.id

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isValidating || isExporting}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Menu actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(bordereau.reference)}>
                <FileText className="size-4 mr-2" />
                Copier la référence
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewDetails(bordereau)}>
                <Eye className="size-4 mr-2" />
                Voir les détails
              </DropdownMenuItem>
              {canValidate && onValidate && (
                <DropdownMenuItem onClick={() => handleValidate(bordereau.id)}>
                  <CheckCircle2 className="size-4 mr-2" />
                  Valider le bordereau
                </DropdownMenuItem>
              )}
              {canExport && (
                <>
                  <DropdownMenuSeparator />
                  {onExportPDF && (
                    <DropdownMenuItem onClick={() => handleExportPDF(bordereau.id)}>
                      <FileText className="size-4 mr-2" />
                      Exporter PDF
                    </DropdownMenuItem>
                  )}
                  {onExportExcel && (
                    <DropdownMenuItem onClick={() => handleExportExcel(bordereau.id)}>
                      <FileSpreadsheet className="size-4 mr-2" />
                      Exporter Excel
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50,
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={bordereaux}
        headerClassName="bg-sidebar hover:bg-sidebar"
      />

      {/* Dialog de détail du bordereau */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Détail du bordereau
            </DialogTitle>
            <DialogDescription>
              Référence : <strong>{selectedBordereau?.reference}</strong> — Période : <strong>{selectedBordereau?.periode}</strong>
            </DialogDescription>
          </DialogHeader>

          {selectedBordereau && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Informations générales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="size-3" /> Apporteur
                    </span>
                    <span className="font-medium">
                      {selectedBordereau.apporteur
                        ? `${selectedBordereau.apporteur.prenom} ${selectedBordereau.apporteur.nom}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" /> Date validation
                    </span>
                    <span className="font-medium">{formatDate(selectedBordereau.dateValidation)}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground">Nombre de lignes</span>
                    <span className="font-medium">{selectedBordereau.nombreLignes}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground">Statut</span>
                    <Badge
                      variant="outline"
                      className={statutBordereauVariants[selectedBordereau.statutBordereau]?.className}
                    >
                      {statutBordereauVariants[selectedBordereau.statutBordereau]?.icon}
                      {statutBordereauVariants[selectedBordereau.statutBordereau]?.label}
                    </Badge>
                  </div>
                </div>

                {/* Récapitulatif montants */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="size-4" />
                    Récapitulatif
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                      <span className="text-xs text-success">Total brut</span>
                      <p className="text-lg font-bold text-success">{formatMontant(selectedBordereau.totalBrut)}</p>
                    </div>
                    <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <span className="text-xs text-destructive">Reprises</span>
                      <p className="text-lg font-bold text-destructive">{formatMontant(String(-parseMontant(selectedBordereau.totalReprises)))}</p>
                    </div>
                    <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <span className="text-xs text-warning">Acomptes</span>
                      <p className="text-lg font-bold text-warning">{formatMontant(String(-parseMontant(selectedBordereau.totalAcomptes)))}</p>
                    </div>
                    <div className="p-3 bg-info/10 rounded-lg border-2 border-info/30">
                      <span className="text-xs text-info">Net à payer</span>
                      <p className="text-xl font-bold text-info">{formatMontant(selectedBordereau.totalNetAPayer)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Liste des lignes */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Lignes du bordereau</h3>
                  {lignes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune ligne dans ce bordereau
                    </p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-medium">Contrat</th>
                            <th className="text-left p-2 font-medium">Client</th>
                            <th className="text-left p-2 font-medium">Type</th>
                            <th className="text-right p-2 font-medium">Brut</th>
                            <th className="text-right p-2 font-medium">Reprise</th>
                            <th className="text-right p-2 font-medium">Net</th>
                            <th className="text-center p-2 font-medium">Sel.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lignes.map((ligne: LigneBordereauDisplay) => (
                            <tr key={ligne.id} className="border-t">
                              <td className="p-2 font-mono text-xs">{ligne.contratReference}</td>
                              <td className="p-2 text-muted-foreground">{ligne.clientNom || "—"}</td>
                              <td className="p-2">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {ligne.typeLigne}
                                </Badge>
                              </td>
                              <td className="p-2 text-right text-success">{formatMontant(ligne.montantBrut)}</td>
                              <td className="p-2 text-right text-destructive">
                                {parseMontant(ligne.montantReprise) !== 0 ? formatMontant(ligne.montantReprise) : "--"}
                              </td>
                              <td className="p-2 text-right font-medium">{formatMontant(ligne.montantNet)}</td>
                              <td className="p-2 text-center">
                                {ligne.selectionne ? (
                                  <CheckCircle2 className="size-4 text-success inline" />
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <div className="flex gap-2">
              {selectedBordereau?.fichierPdfUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={selectedBordereau.fichierPdfUrl} download>
                    <Download className="size-4 mr-2" />
                    PDF
                  </a>
                </Button>
              )}
              {selectedBordereau?.fichierExcelUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={selectedBordereau.fichierExcelUrl} download>
                    <Download className="size-4 mr-2" />
                    Excel
                  </a>
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
