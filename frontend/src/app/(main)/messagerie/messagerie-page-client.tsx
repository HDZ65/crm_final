"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  getMailboxesByOrganisation,
  createMailbox,
  updateMailbox,
  deleteMailbox,
} from "@/actions/mailbox"
import type { Mailbox } from "@proto/email/email"
import { Plus, Pencil, Trash2, Loader2, Mail } from "lucide-react"

const FOURNISSEUR_OPTIONS = [
  { value: 0, label: "SMTP" },
  { value: 1, label: "Gmail" },
  { value: 2, label: "Outlook" },
] as const

export function MessageriePageClient() {
  const [mailboxes, setMailboxes] = React.useState<Mailbox[]>([])
  const [loading, setLoading] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState<Mailbox | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<Mailbox | null>(null)

  const [formData, setFormData] = React.useState({
    nom: "",
    adresseEmail: "",
    fournisseur: "0",
    smtpHost: "",
    smtpPort: "",
    signature: "",
    isDefault: false,
  })

  // Fetch mailboxes
  const fetchMailboxes = React.useCallback(async () => {
    setLoading(true)
    const result = await getMailboxesByOrganisation("")
    if (result.data) {
      setMailboxes(result.data.mailboxes || [])
    } else if (result.error) {
      toast.error(result.error)
    }
    setLoading(false)
  }, [])

  // Load on mount
  React.useEffect(() => {
    fetchMailboxes()
  }, [fetchMailboxes])

  // Handle create
  const handleCreate = () => {
    setEditItem(null)
    setFormData({
      nom: "",
      adresseEmail: "",
      fournisseur: "0",
      smtpHost: "",
      smtpPort: "",
      signature: "",
      isDefault: false,
    })
    setDialogOpen(true)
  }

  // Handle edit
  const handleEdit = (mailbox: Mailbox) => {
    setEditItem(mailbox)
    setFormData({
      nom: mailbox.nom,
      adresseEmail: mailbox.adresse_email,
      fournisseur: String(mailbox.fournisseur),
      smtpHost: mailbox.smtp_host || "",
      smtpPort: mailbox.smtp_port ? String(mailbox.smtp_port) : "",
      signature: mailbox.signature || "",
      isDefault: mailbox.is_default || false,
    })
    setDialogOpen(true)
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nom || !formData.adresseEmail) {
      toast.error("Nom et adresse email sont obligatoires")
      return
    }

    setLoading(true)

    try {
      if (editItem) {
        const result = await updateMailbox({
          id: editItem.id,
          nom: formData.nom,
          adresseEmail: formData.adresseEmail,
          fournisseur: parseInt(formData.fournisseur),
          smtpHost: formData.smtpHost || undefined,
          smtpPort: formData.smtpPort ? parseInt(formData.smtpPort) : undefined,
          signature: formData.signature || undefined,
          isDefault: formData.isDefault,
        })
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success("Boîte mail mise à jour")
          setDialogOpen(false)
          fetchMailboxes()
        }
      } else {
        const result = await createMailbox({
          organisationId: "",
          societeId: "",
          userId: "",
          nom: formData.nom,
          adresseEmail: formData.adresseEmail,
          fournisseur: parseInt(formData.fournisseur),
          typeConnexion: 0,
          smtpHost: formData.smtpHost || undefined,
          smtpPort: formData.smtpPort ? parseInt(formData.smtpPort) : undefined,
          signature: formData.signature || undefined,
          isDefault: formData.isDefault,
        })
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success("Boîte mail créée")
          setDialogOpen(false)
          fetchMailboxes()
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deleteItem) return

    setLoading(true)
    const result = await deleteMailbox(deleteItem.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Boîte mail supprimée")
      setDeleteDialogOpen(false)
      fetchMailboxes()
    }

    setLoading(false)
  }

  const getFournisseurLabel = (fournisseur: number) => {
    return FOURNISSEUR_OPTIONS.find((opt) => opt.value === fournisseur)?.label || "Inconnu"
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="size-6" />
            Messagerie
          </h1>
          <p className="text-muted-foreground">
            Gérez vos boîtes mail et comptes de messagerie.
          </p>
        </div>
      </div>

      {/* Mailboxes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Boîtes mail</CardTitle>
              <CardDescription>
                {mailboxes.length} boîte{mailboxes.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="size-4 mr-2" />
              Nouvelle boîte mail
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mailboxes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Aucune boîte mail configurée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Adresse email</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead>Par défaut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mailboxes.map((mailbox) => (
                  <TableRow key={mailbox.id}>
                    <TableCell className="font-medium">{mailbox.nom}</TableCell>
                    <TableCell>{mailbox.adresse_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getFournisseurLabel(mailbox.fournisseur)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={mailbox.is_active ? "default" : "secondary"}>
                        {mailbox.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={mailbox.is_default ? "default" : "outline"}>
                        {mailbox.is_default ? "Oui" : "Non"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(mailbox)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeleteItem(mailbox)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Modifier" : "Créer"} une boîte mail
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations de votre boîte mail.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adresseEmail">Adresse email *</Label>
              <Input
                id="adresseEmail"
                type="email"
                value={formData.adresseEmail}
                onChange={(e) =>
                  setFormData({ ...formData, adresseEmail: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fournisseur">Fournisseur *</Label>
              <Select
                value={formData.fournisseur}
                onValueChange={(value) =>
                  setFormData({ ...formData, fournisseur: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {FOURNISSEUR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpHost">Serveur SMTP</Label>
              <Input
                id="smtpHost"
                value={formData.smtpHost}
                onChange={(e) =>
                  setFormData({ ...formData, smtpHost: e.target.value })
                }
                placeholder="smtp.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">Port SMTP</Label>
              <Input
                id="smtpPort"
                type="number"
                value={formData.smtpPort}
                onChange={(e) =>
                  setFormData({ ...formData, smtpPort: e.target.value })
                }
                placeholder="587"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signature">Signature</Label>
              <Input
                id="signature"
                value={formData.signature}
                onChange={(e) =>
                  setFormData({ ...formData, signature: e.target.value })
                }
                placeholder="Votre signature d'email"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    isDefault: checked === true,
                  })
                }
              />
              <Label htmlFor="isDefault">Boîte mail par défaut</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                {editItem ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la boîte mail{" "}
              <strong>{deleteItem?.nom}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
