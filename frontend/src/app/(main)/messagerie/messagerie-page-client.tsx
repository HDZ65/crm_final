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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  getMailboxesByOrganisation,
  createMailbox,
  updateMailbox,
  deleteMailbox,
  sendEmail,
} from "@/actions/mailbox"
import type { Mailbox } from "@proto/email/email"
import { Plus, Pencil, Trash2, Loader2, Mail, Search, Send, Inbox, Settings2, RefreshCw } from "lucide-react"

const FOURNISSEUR_OPTIONS = [
  { value: 0, label: "SMTP" },
  { value: 1, label: "Gmail" },
  { value: 2, label: "Outlook" },
] as const

const EMPTY_COMPOSE_FORM = {
  to: "",
  cc: "",
  subject: "",
  body: "",
}

interface MessageriePageClientProps {
  initialMailboxes?: Mailbox[] | null
}

export function MessageriePageClient({ initialMailboxes }: MessageriePageClientProps) {
  const [activeTab, setActiveTab] = React.useState("inbox")
  const [mailboxes, setMailboxes] = React.useState<Mailbox[]>(initialMailboxes || [])
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState<Mailbox | null>(null)
  const [deleteItem, setDeleteItem] = React.useState<Mailbox | null>(null)
  const [selectedMailboxId, setSelectedMailboxId] = React.useState("")

  // Compose state
  const [composeOpen, setComposeOpen] = React.useState(false)
  const [composeForm, setComposeForm] = React.useState(EMPTY_COMPOSE_FORM)
  const [isSending, setIsSending] = React.useState(false)

  const [formData, setFormData] = React.useState({
    nom: "",
    adresseEmail: "",
    fournisseur: "0",
    smtpHost: "",
    smtpPort: "",
    signature: "",
    isDefault: false,
  })

  // Auto-select default mailbox
  React.useEffect(() => {
    if (!selectedMailboxId && mailboxes.length > 0) {
      const defaultBox = mailboxes.find((m) => m.is_default) || mailboxes[0]
      setSelectedMailboxId(defaultBox.id)
    }
  }, [mailboxes, selectedMailboxId])

  // Filter mailboxes by search
  const filteredMailboxes = React.useMemo(() => {
    if (!search) return mailboxes
    const q = search.toLowerCase()
    return mailboxes.filter(
      (m) =>
        m.nom.toLowerCase().includes(q) ||
        m.adresse_email.toLowerCase().includes(q)
    )
  }, [mailboxes, search])

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

  // Handle compose email
  const handleOpenCompose = () => {
    setComposeForm(EMPTY_COMPOSE_FORM)
    setComposeOpen(true)
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMailboxId) {
      toast.error("Sélectionnez une boîte mail d'abord")
      return
    }

    if (!composeForm.to || !composeForm.subject || !composeForm.body) {
      toast.error("Destinataire, sujet et contenu sont obligatoires")
      return
    }

    setIsSending(true)

    try {
      const result = await sendEmail({
        mailboxId: selectedMailboxId,
        to: composeForm.to,
        cc: composeForm.cc || undefined,
        subject: composeForm.subject,
        body: composeForm.body,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Email envoyé avec succès")
        setComposeOpen(false)
        setComposeForm(EMPTY_COMPOSE_FORM)
      }
    } finally {
      setIsSending(false)
    }
  }

  const getFournisseurLabel = (fournisseur: number) => {
    return FOURNISSEUR_OPTIONS.find((opt) => opt.value === fournisseur)?.label || "Inconnu"
  }

  const selectedMailbox = React.useMemo(() => {
    return mailboxes.find((m) => m.id === selectedMailboxId)
  }, [mailboxes, selectedMailboxId])

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Mail className="size-6" />
            Messagerie
          </h1>
          <p className="text-muted-foreground">
            Gérez vos boîtes mail, composez des emails et consultez vos messages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void fetchMailboxes()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
            Actualiser
          </Button>
          <Button onClick={handleOpenCompose} disabled={mailboxes.length === 0}>
            <Send className="mr-2 size-4" />
            Nouveau message
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inbox">
            <Inbox className="mr-2 size-4" />
            Boîtes mail
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings2 className="mr-2 size-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Inbox / Mailbox list Tab */}
        <TabsContent value="inbox" className="space-y-4">
          {/* Mailbox selector when multiple */}
          {mailboxes.length > 1 && (
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <Label className="shrink-0">Boîte active :</Label>
                  <Select value={selectedMailboxId} onValueChange={setSelectedMailboxId}>
                    <SelectTrigger className="max-w-xs">
                      <SelectValue placeholder="Sélectionner une boîte" />
                    </SelectTrigger>
                    <SelectContent>
                      {mailboxes.map((mb) => (
                        <SelectItem key={mb.id} value={mb.id}>
                          {mb.nom} ({mb.adresse_email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>
                    {selectedMailbox ? `${selectedMailbox.nom}` : "Boîte de réception"}
                  </CardTitle>
                  <CardDescription>
                    {selectedMailbox
                      ? `${selectedMailbox.adresse_email} — ${getFournisseurLabel(selectedMailbox.fournisseur)}`
                      : "Sélectionnez une boîte mail pour voir les messages"}
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedMailbox ? (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Inbox className="mx-auto mb-3 size-10 opacity-40" />
                    <p>Aucune boîte mail configurée.</p>
                    <Button variant="link" onClick={() => setActiveTab("settings")} className="mt-1">
                      Configurer une boîte mail
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Mail className="mx-auto mb-3 size-10 opacity-40" />
                    <p>Aucun message dans la boîte de réception.</p>
                    <p className="text-xs mt-1">Les emails apparaîtront ici une fois la synchronisation activée.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Configuration des boîtes mail</CardTitle>
                  <CardDescription>
                    {mailboxes.length} boîte{mailboxes.length > 1 ? "s" : ""} configurée{mailboxes.length > 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 size-4" />
                  Nouvelle boîte mail
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mailboxes.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
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
        </TabsContent>
      </Tabs>

      {/* Compose Email Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nouveau message</DialogTitle>
            <DialogDescription>
              Envoi depuis : {selectedMailbox?.adresse_email || "Aucune boîte sélectionnée"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="compose-to">Destinataire *</Label>
              <Input
                id="compose-to"
                type="email"
                value={composeForm.to}
                onChange={(e) => setComposeForm((p) => ({ ...p, to: e.target.value }))}
                placeholder="destinataire@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compose-cc">Cc</Label>
              <Input
                id="compose-cc"
                value={composeForm.cc}
                onChange={(e) => setComposeForm((p) => ({ ...p, cc: e.target.value }))}
                placeholder="copie@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compose-subject">Sujet *</Label>
              <Input
                id="compose-subject"
                value={composeForm.subject}
                onChange={(e) => setComposeForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Objet du message"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compose-body">Message *</Label>
              <Textarea
                id="compose-body"
                value={composeForm.body}
                onChange={(e) => setComposeForm((p) => ({ ...p, body: e.target.value }))}
                placeholder="Rédigez votre message..."
                className="min-h-40"
                required
              />
            </div>
            {selectedMailboxId && (
              <div className="space-y-2">
                <Label>Boîte d&apos;envoi</Label>
                <Select value={selectedMailboxId} onValueChange={setSelectedMailboxId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mailboxes.map((mb) => (
                      <SelectItem key={mb.id} value={mb.id}>
                        {mb.nom} ({mb.adresse_email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSending}>
                {isSending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                Envoyer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Mailbox Dialog */}
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

      {/* Delete Mailbox Dialog */}
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
