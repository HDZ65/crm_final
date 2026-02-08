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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  listSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from "@/actions/subscriptions"
import type { SubscriptionPlan } from "@proto/subscriptions/subscriptions"
import { Plus, Pencil, Trash2, Loader2, LayoutList, Search } from "lucide-react"

interface PlansPageClientProps {
  initialPlans?: SubscriptionPlan[] | null
}

export function PlansPageClient({ initialPlans }: PlansPageClientProps) {
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>(initialPlans || [])
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null)
  const [formData, setFormData] = React.useState({
    code: "",
    name: "",
    description: "",
    priceMonthly: 0,
    priceAnnual: 0,
    currency: "EUR",
    trialDays: 0,
    features: "",
  })

  const fetchPlans = React.useCallback(async () => {
    setLoading(true)
    const result = await listSubscriptionPlans()
    if (result.data) {
      setPlans(result.data.plans || [])
    } else if (result.error) {
      toast.error(result.error)
    }
    setLoading(false)
  }, [])

  const filteredPlans = React.useMemo(() => {
    if (!search) return plans
    const q = search.toLowerCase()
    return plans.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    )
  }, [plans, search])

  const handleCreate = () => {
    setSelectedPlan(null)
    setFormData({
      code: "",
      name: "",
      description: "",
      priceMonthly: 0,
      priceAnnual: 0,
      currency: "EUR",
      trialDays: 0,
      features: "",
    })
    setDialogOpen(true)
  }

  const handleEdit = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setFormData({
      code: plan.code,
      name: plan.name,
      description: plan.description || "",
      priceMonthly: plan.priceMonthly || 0,
      priceAnnual: plan.priceAnnual || 0,
      currency: plan.currency || "EUR",
      trialDays: plan.trialDays || 0,
      features: plan.features || "",
    })
    setDialogOpen(true)
  }

  const handleDeleteClick = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code || !formData.name) {
      toast.error("Code et nom sont obligatoires")
      return
    }

    setLoading(true)

    if (selectedPlan) {
      const result = await updateSubscriptionPlan({
        id: selectedPlan.id,
        name: formData.name,
        description: formData.description,
        priceMonthly: formData.priceMonthly,
        priceAnnual: formData.priceAnnual,
        currency: formData.currency,
        trialDays: formData.trialDays,
        features: formData.features,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Plan mis a jour")
        setDialogOpen(false)
        fetchPlans()
      }
    } else {
      const result = await createSubscriptionPlan({
        organisationId: "",
        code: formData.code,
        name: formData.name,
        description: formData.description,
        planType: 0,
        priceMonthly: formData.priceMonthly,
        priceAnnual: formData.priceAnnual,
        currency: formData.currency,
        billingInterval: 0,
        billingCycleDays: 30,
        trialDays: formData.trialDays,
        features: formData.features,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Plan cree")
        setDialogOpen(false)
        fetchPlans()
      }
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    if (!selectedPlan) return

    setLoading(true)
    const result = await deleteSubscriptionPlan(selectedPlan.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Plan supprime")
      setDeleteDialogOpen(false)
      fetchPlans()
    }

    setLoading(false)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutList className="size-6" />
            Plans d&apos;abonnement
          </h1>
          <p className="text-muted-foreground">
            Gerez les plans d&apos;abonnement disponibles pour vos clients.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="size-4 mr-2" />
          Nouveau plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des plans</CardTitle>
              <CardDescription>
                {plans.length} plan{plans.length > 1 ? "s" : ""}
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
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Prix mensuel</TableHead>
                <TableHead>Prix annuel</TableHead>
                <TableHead>Essai</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {search ? "Aucun resultat" : "Aucun plan"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {plan.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      {plan.priceMonthly ? `${plan.priceMonthly} ${plan.currency || "EUR"}` : "-"}
                    </TableCell>
                    <TableCell>
                      {plan.priceAnnual ? `${plan.priceAnnual} ${plan.currency || "EUR"}` : "-"}
                    </TableCell>
                    <TableCell>
                      {plan.trialDays ? `${plan.trialDays} jours` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(plan)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(plan)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan ? "Modifier le plan" : "Nouveau plan d'abonnement"}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan
                ? "Modifiez les informations du plan"
                : "Creez un nouveau plan d'abonnement"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                  }
                  placeholder="PLAN_CODE"
                  className="font-mono"
                  disabled={!!selectedPlan}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Nom du plan"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Description du plan..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceMonthly">Prix mensuel</Label>
                <Input
                  id="priceMonthly"
                  type="number"
                  step="0.01"
                  value={formData.priceMonthly}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, priceMonthly: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceAnnual">Prix annuel</Label>
                <Input
                  id="priceAnnual"
                  type="number"
                  step="0.01"
                  value={formData.priceAnnual}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, priceAnnual: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, currency: e.target.value.toUpperCase() }))
                  }
                  placeholder="EUR"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trialDays">Jours d&apos;essai</Label>
                <Input
                  id="trialDays"
                  type="number"
                  value={formData.trialDays}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, trialDays: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Fonctionnalites (JSON)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, features: e.target.value }))
                }
                placeholder='{"feature1": true, "feature2": false}'
                rows={3}
                className="font-mono text-sm"
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
                {selectedPlan ? "Enregistrer" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce plan ?</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir supprimer le plan{" "}
              <strong>{selectedPlan?.name}</strong> ? Cette action est irreversible.
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
