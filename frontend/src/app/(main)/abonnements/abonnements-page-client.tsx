"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "@/actions/subscriptions"
import type { Subscription } from "@proto/subscriptions/subscriptions"
import { Plus, Pencil, Trash2, Loader2, CreditCard, Search } from "lucide-react"

const STATUS_LABELS: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "Non defini", variant: "outline" },
  1: { label: "En attente", variant: "secondary" },
  2: { label: "Essai", variant: "outline" },
  3: { label: "Actif", variant: "default" },
  4: { label: "En pause", variant: "secondary" },
  5: { label: "Impaye", variant: "destructive" },
  6: { label: "Suspendu", variant: "destructive" },
  7: { label: "Annule", variant: "destructive" },
  8: { label: "Expire", variant: "secondary" },
}

interface AbonnementsPageClientProps {
  initialSubscriptions?: Subscription[] | null
}

export function AbonnementsPageClient({ initialSubscriptions }: AbonnementsPageClientProps) {
  const [subscriptionsList, setSubscriptionsList] = React.useState<Subscription[]>(initialSubscriptions || [])
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedSubscription, setSelectedSubscription] = React.useState<Subscription | null>(null)
  const [formData, setFormData] = React.useState({
    clientId: "",
    planId: "",
    startDate: "",
  })

  const fetchSubscriptions = React.useCallback(async () => {
    setLoading(true)
    const result = await listSubscriptions({ organisationId: "" })
    if (result.data) {
      setSubscriptionsList(result.data.subscriptions || [])
    } else if (result.error) {
      toast.error(result.error)
    }
    setLoading(false)
  }, [])

  const filteredSubscriptions = React.useMemo(() => {
    if (!search) return subscriptionsList
    const q = search.toLowerCase()
    return subscriptionsList.filter(
      (s) =>
        s.clientId.toLowerCase().includes(q) ||
        s.planId.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    )
  }, [subscriptionsList, search])

  const handleCreate = () => {
    setSelectedSubscription(null)
    setFormData({ clientId: "", planId: "", startDate: "" })
    setDialogOpen(true)
  }

  const handleEdit = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setFormData({
      clientId: subscription.clientId,
      planId: subscription.planId,
      startDate: subscription.startDate || "",
    })
    setDialogOpen(true)
  }

  const handleDeleteClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clientId || !formData.planId) {
      toast.error("Client et plan sont obligatoires")
      return
    }

    setLoading(true)

    if (selectedSubscription) {
      const result = await updateSubscription({
        id: selectedSubscription.id,
        planId: formData.planId,
        startDate: formData.startDate,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Abonnement mis a jour")
        setDialogOpen(false)
        fetchSubscriptions()
      }
    } else {
      const result = await createSubscription({
        organisationId: "",
        clientId: formData.clientId,
        planId: formData.planId,
        planType: 0,
        frequency: 0,
        storeSource: 0,
        startDate: formData.startDate || new Date().toISOString(),
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Abonnement cree")
        setDialogOpen(false)
        fetchSubscriptions()
      }
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    if (!selectedSubscription) return

    setLoading(true)
    const result = await deleteSubscription(selectedSubscription.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Abonnement supprime")
      setDeleteDialogOpen(false)
      fetchSubscriptions()
    }

    setLoading(false)
  }

  const getStatusInfo = (status: number) => {
    return STATUS_LABELS[status] || STATUS_LABELS[0]
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="size-6" />
            Abonnements
          </h1>
          <p className="text-muted-foreground">
            Gerez les abonnements clients de votre organisation.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="size-4 mr-2" />
          Nouvel abonnement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des abonnements</CardTitle>
              <CardDescription>
                {subscriptionsList.length} abonnement{subscriptionsList.length > 1 ? "s" : ""}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date debut</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {search ? "Aucun resultat" : "Aucun abonnement"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => {
                  const statusInfo = getStatusInfo(sub.status as number)
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {sub.id.slice(0, 8)}...
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {sub.clientId.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {sub.planId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.startDate
                          ? new Date(sub.startDate).toLocaleDateString("fr-FR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {sub.amount ? `${sub.amount} ${sub.currency || "EUR"}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(sub)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(sub)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSubscription ? "Modifier l'abonnement" : "Nouvel abonnement"}
            </DialogTitle>
            <DialogDescription>
              {selectedSubscription
                ? "Modifiez les informations de l'abonnement"
                : "Creez un nouvel abonnement"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">ID Client *</Label>
              <Input
                id="clientId"
                value={formData.clientId}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, clientId: e.target.value }))
                }
                placeholder="ID du client"
                disabled={!!selectedSubscription}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planId">ID Plan *</Label>
              <Input
                id="planId"
                value={formData.planId}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, planId: e.target.value }))
                }
                placeholder="ID du plan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Date de debut</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, startDate: e.target.value }))
                }
              />
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
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                {selectedSubscription ? "Enregistrer" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet abonnement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir supprimer cet abonnement ? Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
