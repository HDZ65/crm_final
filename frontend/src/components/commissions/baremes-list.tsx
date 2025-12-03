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
  Loader2,
  Calculator,
  Percent,
  DollarSign,
  RotateCcw,
  Calendar,
  Layers,
  CheckCircle2,
  XCircle,
  Pencil,
  Plus,
} from "lucide-react"
import type {
  BaremeCommissionResponseDto,
  TypeCalcul,
  PalierCommissionResponseDto,
} from "@/types/commission-dto"
import type { TypeOption, DureeOption } from "@/hooks/commissions/use-commission-config"
import { usePaliersCommission } from "@/hooks"
import { CreateBaremeDialog } from "./create-bareme-dialog"
import { EditBaremeDialog } from "./edit-bareme-dialog"
import { ManagePaliersDialog } from "./manage-paliers-dialog"

interface BaremesListProps {
  baremes: BaremeCommissionResponseDto[]
  typesCalcul: TypeOption[]
  typesBase: TypeOption[]
  typesProduit: TypeOption[]
  typesApporteur: TypeOption[]
  typesPalier: TypeOption[]
  dureesReprise: DureeOption[]
  loading?: boolean
  loadingConfig?: boolean
  onViewDetails?: (bareme: BaremeCommissionResponseDto) => void
  onBaremeCreated?: (bareme: BaremeCommissionResponseDto) => void
  onBaremeUpdated?: (bareme: BaremeCommissionResponseDto) => void
}

const formatCurrency = (amount: number | null) => {
  if (amount === null) return "—"
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
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

// Icons pour les types de calcul
const typeCalculIcons: Record<TypeCalcul, React.ReactNode> = {
  fixe: <DollarSign className="size-3 mr-1" />,
  pourcentage: <Percent className="size-3 mr-1" />,
  palier: <Layers className="size-3 mr-1" />,
  mixte: <Calculator className="size-3 mr-1" />,
}

export function BaremesList({
  baremes,
  typesCalcul,
  typesBase,
  typesProduit,
  typesApporteur,
  typesPalier,
  dureesReprise,
  loading,
  loadingConfig,
  onViewDetails,
  onBaremeCreated,
  onBaremeUpdated,
}: BaremesListProps) {
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)
  const [selectedBareme, setSelectedBareme] = React.useState<BaremeCommissionResponseDto | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [editingBareme, setEditingBareme] = React.useState<BaremeCommissionResponseDto | null>(null)
  const [paliersDialogOpen, setPaliersDialogOpen] = React.useState(false)
  const [paliersBareme, setPaliersBareme] = React.useState<BaremeCommissionResponseDto | null>(null)

  // Charger les paliers du barème sélectionné
  const { paliers, loading: loadingPaliers } = usePaliersCommission(
    selectedBareme ? { baremeId: selectedBareme.id } : undefined
  )

  // Helpers pour obtenir les labels
  const getTypeCalculLabel = React.useCallback((value: string): string => {
    const type = typesCalcul.find((t) => t.value === value)
    return type?.label || value
  }, [typesCalcul])

  const getTypeBaseLabel = React.useCallback((value: string): string => {
    const type = typesBase.find((t) => t.value === value)
    return type?.label || value
  }, [typesBase])

  const getTypeProduitLabel = React.useCallback((value: string | null): string => {
    if (!value) return "Tous les produits"
    const type = typesProduit.find((t) => t.value === value)
    return type?.label || value
  }, [typesProduit])

  const getTypeApporteurLabel = React.useCallback((value: string | null): string => {
    if (!value) return "Tous les profils"
    const type = typesApporteur.find((t) => t.value === value)
    return type?.label || value
  }, [typesApporteur])

  const handleViewDetails = (bareme: BaremeCommissionResponseDto) => {
    setSelectedBareme(bareme)
    setDetailDialogOpen(true)
    onViewDetails?.(bareme)
  }

  const handleEditBareme = (bareme: BaremeCommissionResponseDto) => {
    setEditingBareme(bareme)
    setEditDialogOpen(true)
  }

  const handleManagePaliers = (bareme: BaremeCommissionResponseDto) => {
    setPaliersBareme(bareme)
    setPaliersDialogOpen(true)
  }

  const columns: ColumnDef<BaremeCommissionResponseDto>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-mono text-xs font-medium" title={row.original.code}>
          {row.original.code}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "nom",
      header: "Nom",
      cell: ({ row }) => (
        <div className="font-medium max-w-[200px] truncate" title={row.original.nom}>
          {row.original.nom}
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: "typeCalcul",
      header: "Type calcul",
      cell: ({ row }) => {
        const type = row.original.typeCalcul
        const icon = typeCalculIcons[type] || null
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="gap-1">
              {icon}
              {getTypeCalculLabel(type)}
            </Badge>
            {row.original.precomptee && (
              <Badge variant="secondary" className="text-xs">
                Précomptée
              </Badge>
            )}
          </div>
        )
      },
      size: 180,
    },
    {
      accessorKey: "baseCalcul",
      header: "Base",
      cell: ({ row }) => (
        <div className="text-sm">{getTypeBaseLabel(row.original.baseCalcul)}</div>
      ),
      size: 120,
    },
    {
      accessorKey: "tauxPourcentage",
      header: "Taux",
      cell: ({ row }) => {
        const taux = row.original.tauxPourcentage
        if (taux === null) return <div className="text-muted-foreground">—</div>
        return <div className="font-medium">{taux}%</div>
      },
      size: 80,
    },
    {
      accessorKey: "montantFixe",
      header: "Montant fixe",
      cell: ({ row }) => (
        <div className="text-sm">{formatCurrency(row.original.montantFixe)}</div>
      ),
      size: 110,
    },
    {
      accessorKey: "typeProduit",
      header: "Produit",
      cell: ({ row }) => {
        const type = row.original.typeProduit
        if (!type) return <div className="text-muted-foreground text-xs">Tous</div>
        return (
          <Badge variant="secondary" className="text-xs">
            {getTypeProduitLabel(type)}
          </Badge>
        )
      },
      size: 100,
    },
    {
      accessorKey: "profilRemuneration",
      header: "Profil",
      cell: ({ row }) => {
        const profil = row.original.profilRemuneration
        if (!profil) return <div className="text-muted-foreground text-xs">Tous</div>
        return (
          <Badge variant="outline" className="text-xs">
            {getTypeApporteurLabel(profil)}
          </Badge>
        )
      },
      size: 100,
    },
    {
      accessorKey: "recurrenceActive",
      header: "Récurrence",
      cell: ({ row }) => {
        const active = row.original.recurrenceActive
        if (!active) return <div className="text-muted-foreground">—</div>
        return (
          <div className="text-xs">
            <span className="font-medium">{row.original.tauxRecurrence}%</span>
            <span className="text-muted-foreground ml-1">
              / {row.original.dureeRecurrenceMois} mois
            </span>
          </div>
        )
      },
      size: 120,
    },
    {
      accessorKey: "dureeReprisesMois",
      header: "Reprise",
      cell: ({ row }) => (
        <div className="text-sm flex items-center gap-1">
          <RotateCcw className="size-3 text-muted-foreground" />
          {row.original.dureeReprisesMois} mois
        </div>
      ),
      size: 90,
    },
    {
      accessorKey: "actif",
      header: "Actif",
      cell: ({ row }) => (
        row.original.actif ? (
          <CheckCircle2 className="size-4 text-success" />
        ) : (
          <XCircle className="size-4 text-muted-foreground" />
        )
      ),
      size: 60,
    },
    {
      accessorKey: "version",
      header: "Ver.",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          v{row.original.version}
        </Badge>
      ),
      size: 60,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const bareme = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Menu actions</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(bareme.code)}>
                <FileText className="size-4 mr-2" />
                Copier le code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewDetails(bareme)}>
                <Eye className="size-4 mr-2" />
                Voir les détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditBareme(bareme)}>
                <Pencil className="size-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleManagePaliers(bareme)}>
                <Layers className="size-4 mr-2" />
                Gérer les paliers
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50,
    },
  ]

  if (loading || loadingConfig) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {/* Header avec bouton de création */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Barèmes de commission</h3>
          <p className="text-sm text-muted-foreground">
            {baremes.length} barème{baremes.length > 1 ? "s" : ""} configuré{baremes.length > 1 ? "s" : ""}
          </p>
        </div>
        <CreateBaremeDialog
          typesCalcul={typesCalcul}
          typesBase={typesBase}
          typesProduit={typesProduit}
          typesApporteur={typesApporteur}
          dureesReprise={dureesReprise}
          onSuccess={onBaremeCreated}
        />
      </div>

      <DataTable
        columns={columns}
        data={baremes}
        headerClassName="bg-sidebar hover:bg-sidebar"
      />

      {/* Dialog de détail du barème */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="size-5" />
              Détail du barème
            </DialogTitle>
            <DialogDescription>
              Code : <strong>{selectedBareme?.code}</strong> — Version {selectedBareme?.version}
            </DialogDescription>
          </DialogHeader>

          {selectedBareme && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Informations générales */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Informations générales</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nom :</span>
                      <p className="font-medium">{selectedBareme.nom}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type de calcul :</span>
                      <p className="font-medium">{getTypeCalculLabel(selectedBareme.typeCalcul)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Base de calcul :</span>
                      <p className="font-medium">{getTypeBaseLabel(selectedBareme.baseCalcul)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Taux :</span>
                      <p className="font-medium">
                        {selectedBareme.tauxPourcentage !== null ? `${selectedBareme.tauxPourcentage}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Montant fixe :</span>
                      <p className="font-medium">{formatCurrency(selectedBareme.montantFixe)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Statut :</span>
                      <p>
                        <Badge variant={selectedBareme.actif ? "default" : "secondary"}>
                          {selectedBareme.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Commission précomptée :</span>
                      <p>
                        <Badge variant={selectedBareme.precomptee ? "default" : "outline"}>
                          {selectedBareme.precomptee ? "Oui" : "Non"}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Filtres d'application */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Filtres d&apos;application</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type de produit :</span>
                      <p className="font-medium">{getTypeProduitLabel(selectedBareme.typeProduit)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Profil rémunération :</span>
                      <p className="font-medium">{getTypeApporteurLabel(selectedBareme.profilRemuneration)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Récurrence */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Récurrence</h3>
                  {selectedBareme.recurrenceActive ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Taux de récurrence :</span>
                        <p className="font-medium">{selectedBareme.tauxRecurrence}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Durée :</span>
                        <p className="font-medium">{selectedBareme.dureeRecurrenceMois} mois</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Récurrence non active</p>
                  )}
                </div>

                <Separator />

                {/* Reprises */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <RotateCcw className="size-4" />
                    Configuration des reprises
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Fenêtre de reprise :</span>
                      <p className="font-medium">{selectedBareme.dureeReprisesMois} mois</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Taux de reprise :</span>
                      <p className="font-medium">{selectedBareme.tauxReprise}%</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Dates */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="size-4" />
                    Dates
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date d&apos;effet :</span>
                      <p className="font-medium">{formatDate(selectedBareme.dateEffet)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date de fin :</span>
                      <p className="font-medium">{formatDate(selectedBareme.dateFin)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Paliers */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Layers className="size-4" />
                    Paliers associés
                  </h3>
                  {loadingPaliers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : paliers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun palier configuré</p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-medium">Code</th>
                            <th className="text-left p-2 font-medium">Nom</th>
                            <th className="text-left p-2 font-medium">Type</th>
                            <th className="text-right p-2 font-medium">Seuil min</th>
                            <th className="text-right p-2 font-medium">Seuil max</th>
                            <th className="text-right p-2 font-medium">Prime</th>
                            <th className="text-center p-2 font-medium">Actif</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paliers.map((palier: PalierCommissionResponseDto) => (
                            <tr key={palier.id} className="border-t">
                              <td className="p-2 font-mono text-xs">{palier.code}</td>
                              <td className="p-2">{palier.nom}</td>
                              <td className="p-2">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {palier.typePalier}
                                </Badge>
                              </td>
                              <td className="p-2 text-right">{palier.seuilMin}</td>
                              <td className="p-2 text-right">{palier.seuilMax ?? "∞"}</td>
                              <td className="p-2 text-right text-success font-medium">
                                {formatCurrency(palier.montantPrime)}
                              </td>
                              <td className="p-2 text-center">
                                {palier.actif ? (
                                  <CheckCircle2 className="size-4 text-success inline" />
                                ) : (
                                  <XCircle className="size-4 text-muted-foreground inline" />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedBareme.description && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground">{selectedBareme.description}</p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de modification du barème */}
      {editingBareme && (
        <EditBaremeDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) setEditingBareme(null)
          }}
          bareme={editingBareme}
          typesCalcul={typesCalcul}
          typesBase={typesBase}
          typesProduit={typesProduit}
          typesApporteur={typesApporteur}
          dureesReprise={dureesReprise}
          onSuccess={onBaremeUpdated}
        />
      )}

      {/* Dialog de gestion des paliers */}
      {paliersBareme && (
        <ManagePaliersDialog
          open={paliersDialogOpen}
          onOpenChange={(open) => {
            setPaliersDialogOpen(open)
            if (!open) setPaliersBareme(null)
          }}
          bareme={paliersBareme}
          typesPalier={typesPalier}
          typesProduit={typesProduit}
        />
      )}
    </>
  )
}
