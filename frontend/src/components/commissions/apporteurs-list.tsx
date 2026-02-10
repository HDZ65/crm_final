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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/data-table-basic"
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
  Edit,
  UserX,
  UserCheck,
  User,
  Mail,
  Phone,
  Plus,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import type { Apporteur } from "@proto/commerciaux/commerciaux"
import type { TypeApporteur } from "@/lib/ui/display-types/commission"
import type { TypeOption } from "@/hooks/commissions/use-commission-config"

interface ApporteursListProps {
  apporteurs: Apporteur[]
  typesApporteur: TypeOption[]
  loading?: boolean
  loadingConfig?: boolean
  onEdit?: (apporteur: Apporteur) => void
  onToggleActive?: (apporteurId: string, active: boolean) => Promise<void>
  onCreate?: (data: CreateApporteurData) => Promise<void>
}

export interface CreateApporteurData {
  nom: string
  prenom: string
  typeApporteur: TypeApporteur
  email?: string
  telephone?: string
}

const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export function ApporteursList({
  apporteurs,
  typesApporteur,
  loading,
  loadingConfig,
  onEdit,
  onToggleActive,
  onCreate,
}: ApporteursListProps) {
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)
  const [selectedApporteur, setSelectedApporteur] = React.useState<Apporteur | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [toggling, setToggling] = React.useState<string | null>(null)

  // Form state
  const [formData, setFormData] = React.useState<CreateApporteurData>({
    nom: "",
    prenom: "",
    typeApporteur: typesApporteur[0]?.value as TypeApporteur || "vrp",
    email: "",
    telephone: "",
  })
  const [formErrors, setFormErrors] = React.useState<Partial<Record<keyof CreateApporteurData, string>>>({})

  // Helper pour obtenir le label d'un type
  const getTypeLabel = React.useCallback((value: string): string => {
    const type = typesApporteur.find((t) => t.value === value)
    return type?.label || value
  }, [typesApporteur])

  // Helper pour obtenir la couleur d'un type
  const getTypeColor = React.useCallback((value: string): string => {
    const type = typesApporteur.find((t) => t.value === value)
    return type?.color || ""
  }, [typesApporteur])

  const handleViewDetails = (apporteur: Apporteur) => {
    setSelectedApporteur(apporteur)
    setDetailDialogOpen(true)
  }

  const handleToggleActive = async (apporteur: Apporteur) => {
    if (!onToggleActive) return
    setToggling(apporteur.id)
    try {
      await onToggleActive(apporteur.id, !apporteur.actif)
    } finally {
      setToggling(null)
    }
  }

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      typeApporteur: typesApporteur[0]?.value as TypeApporteur || "vrp",
      email: "",
      telephone: "",
    })
    setFormErrors({})
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CreateApporteurData, string>> = {}

    if (!formData.nom.trim()) {
      errors.nom = "Le nom est requis"
    }
    if (!formData.prenom.trim()) {
      errors.prenom = "Le prénom est requis"
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email invalide"
    }
    if (formData.telephone && !/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(formData.telephone)) {
      errors.telephone = "Numéro de téléphone invalide"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreate = async () => {
    if (!validateForm() || !onCreate) return

    setCreating(true)
    try {
      await onCreate(formData)
      setCreateDialogOpen(false)
      resetForm()
    } finally {
      setCreating(false)
    }
  }

  const columns: ColumnDef<Apporteur>[] = [
    {
      accessorKey: "nom",
      header: "Nom complet",
      cell: ({ row }) => {
        const apporteur = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-muted">
              <User className="size-4 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">
                {apporteur.prenom} {apporteur.nom}
              </div>
              <div className="text-xs text-muted-foreground">
                Créé le {formatDate(apporteur.createdAt)}
              </div>
            </div>
          </div>
        )
      },
      size: 220,
    },
    {
      accessorKey: "typeApporteur",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.typeApporteur
        const color = getTypeColor(type)
        return (
          <Badge variant="outline" className={color}>
            {getTypeLabel(type)}
          </Badge>
        )
      },
      size: 120,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.original.email
        if (!email) return <div className="text-muted-foreground">—</div>
        return (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="size-3 text-muted-foreground" />
            <a href={`mailto:${email}`} className="hover:underline">
              {email}
            </a>
          </div>
        )
      },
      size: 200,
    },
    {
      accessorKey: "telephone",
      header: "Téléphone",
      cell: ({ row }) => {
        const phone = row.original.telephone
        if (!phone) return <div className="text-muted-foreground">—</div>
        return (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="size-3 text-muted-foreground" />
            <a href={`tel:${phone}`} className="hover:underline">
              {phone}
            </a>
          </div>
        )
      },
      size: 140,
    },
    {
      accessorKey: "actif",
      header: "Statut",
      cell: ({ row }) => {
        const actif = row.original.actif
        return actif ? (
          <Badge className="bg-success/10 text-success border-success/20 gap-1">
            <CheckCircle2 className="size-3" />
            Actif
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="size-3" />
            Inactif
          </Badge>
        )
      },
      size: 100,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const apporteur = row.original
        const isToggling = toggling === apporteur.id

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isToggling}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Menu actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewDetails(apporteur)}>
                <Eye className="size-4 mr-2" />
                Voir les détails
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(apporteur)}>
                  <Edit className="size-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onToggleActive && (
                <DropdownMenuItem
                  onClick={() => handleToggleActive(apporteur)}
                  className={apporteur.actif ? "text-destructive focus:text-destructive" : "text-success focus:text-success"}
                >
                  {apporteur.actif ? (
                    <>
                      <UserX className="size-4 mr-2" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <UserCheck className="size-4 mr-2" />
                      Activer
                    </>
                  )}
                </DropdownMenuItem>
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
      {/* Bouton de création */}
      {onCreate && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Nouvel apporteur
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={apporteurs}
        headerClassName="bg-sidebar hover:bg-sidebar"
      />

      {/* Dialog de création */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5" />
              Créer un apporteur
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations du nouvel apporteur.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className={formErrors.prenom ? "border-destructive" : ""}
                />
                {formErrors.prenom && (
                  <p className="text-xs text-destructive">{formErrors.prenom}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className={formErrors.nom ? "border-destructive" : ""}
                />
                {formErrors.nom && (
                  <p className="text-xs text-destructive">{formErrors.nom}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="typeApporteur">Type d&apos;apporteur *</Label>
              <Select
                value={formData.typeApporteur}
                onValueChange={(value) => setFormData({ ...formData, typeApporteur: value as TypeApporteur })}
              >
                <SelectTrigger id="typeApporteur">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typesApporteur.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={formErrors.email ? "border-destructive" : ""}
              />
              {formErrors.email && (
                <p className="text-xs text-destructive">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                type="tel"
                placeholder="06 12 34 56 78"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className={formErrors.telephone ? "border-destructive" : ""}
              />
              {formErrors.telephone && (
                <p className="text-xs text-destructive">{formErrors.telephone}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de détail */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="size-5" />
              Détail de l&apos;apporteur
            </DialogTitle>
          </DialogHeader>

          {selectedApporteur && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <User className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedApporteur.prenom} {selectedApporteur.nom}
                  </h3>
                  <Badge variant="outline" className={getTypeColor(selectedApporteur.typeApporteur)}>
                    {getTypeLabel(selectedApporteur.typeApporteur)}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3 text-sm">
                {selectedApporteur.email && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Mail className="size-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Email</span>
                      <p className="font-medium">{selectedApporteur.email}</p>
                    </div>
                  </div>
                )}
                {selectedApporteur.telephone && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Phone className="size-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Téléphone</span>
                      <p className="font-medium">{selectedApporteur.telephone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Statut</span>
                  {selectedApporteur.actif ? (
                    <Badge className="bg-success/10 text-success border-success/20">Actif</Badge>
                  ) : (
                    <Badge variant="secondary">Inactif</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Date de création</span>
                  <span className="font-medium">{formatDate(selectedApporteur.createdAt)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
