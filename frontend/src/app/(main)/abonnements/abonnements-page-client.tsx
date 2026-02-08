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
  createSubscription,
  createSubscriptionPlan,
  deleteSubscription,
  deleteSubscriptionPlan,
  listSubscriptionPlans,
  listSubscriptions,
  updateSubscription,
  updateSubscriptionPlan,
} from "@/actions/subscriptions"
import type { Subscription, SubscriptionPlan } from "@proto/subscriptions/subscriptions"
import {
  CreditCard,
  LayoutList,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"

const STATUS_OPTIONS = [
  { value: 0, label: "Non defini", variant: "outline" },
  { value: 1, label: "En attente", variant: "secondary" },
  { value: 2, label: "Essai", variant: "outline" },
  { value: 3, label: "Actif", variant: "default" },
  { value: 4, label: "En pause", variant: "secondary" },
  { value: 5, label: "Impaye", variant: "destructive" },
  { value: 6, label: "Suspendu", variant: "destructive" },
  { value: 7, label: "Annule", variant: "destructive" },
  { value: 8, label: "Expire", variant: "secondary" },
] as const

const INTERVAL_OPTIONS = [
  { value: 0, label: "Mensuel" },
  { value: 1, label: "Annuel" },
  { value: 2, label: "Hebdomadaire" },
] as const

const EMPTY_SUBSCRIPTION_FORM = {
  clientId: "",
  planId: "",
  status: "3",
  startDate: "",
  endDate: "",
}

const EMPTY_PLAN_FORM = {
  name: "",
  description: "",
  price: "",
  billingInterval: "0",
}

type TabValue = "abonnements" | "plans"

interface AbonnementsPageClientProps {
  activeOrgId?: string | null
  initialSubscriptions?: Subscription[] | null
  initialPlans?: SubscriptionPlan[] | null
  initialTab?: TabValue
}

function formatDateInput(value?: string): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

function formatDateDisplay(value?: string): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("fr-FR")
}

function toIsoDate(value: string): string | undefined {
  if (!value) return undefined
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

function toPlanCode(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 30) || "PLAN"
}

function getStatusOption(status: number) {
  return STATUS_OPTIONS.find((option) => option.value === status) || STATUS_OPTIONS[0]
}

function getIntervalLabel(interval: number): string {
  return INTERVAL_OPTIONS.find((option) => option.value === interval)?.label || "Inconnu"
}

export function AbonnementsPageClient({
  activeOrgId,
  initialSubscriptions,
  initialPlans,
  initialTab = "abonnements",
}: AbonnementsPageClientProps) {
  const [activeTab, setActiveTab] = React.useState<TabValue>(initialTab)

  const [subscriptionsList, setSubscriptionsList] = React.useState<Subscription[]>(
    initialSubscriptions || []
  )
  const [plansList, setPlansList] = React.useState<SubscriptionPlan[]>(initialPlans || [])

  const [loadingSubscriptions, setLoadingSubscriptions] = React.useState(false)
  const [loadingPlans, setLoadingPlans] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const [subscriptionSearch, setSubscriptionSearch] = React.useState("")
  const [planSearch, setPlanSearch] = React.useState("")

  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = React.useState(false)
  const [subscriptionDeleteDialogOpen, setSubscriptionDeleteDialogOpen] = React.useState(false)
  const [selectedSubscription, setSelectedSubscription] = React.useState<Subscription | null>(null)
  const [subscriptionFormData, setSubscriptionFormData] = React.useState(EMPTY_SUBSCRIPTION_FORM)

  const [planDialogOpen, setPlanDialogOpen] = React.useState(false)
  const [planDeleteDialogOpen, setPlanDeleteDialogOpen] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null)
  const [planFormData, setPlanFormData] = React.useState(EMPTY_PLAN_FORM)

  const fetchSubscriptions = React.useCallback(async () => {
    if (!activeOrgId) {
      setSubscriptionsList([])
      return
    }

    setLoadingSubscriptions(true)
    try {
      const result = await listSubscriptions({ organisationId: activeOrgId })
      if (result.data) {
        setSubscriptionsList(result.data.subscriptions || [])
      } else if (result.error) {
        toast.error(result.error)
      }
    } finally {
      setLoadingSubscriptions(false)
    }
  }, [activeOrgId])

  const fetchPlans = React.useCallback(async () => {
    setLoadingPlans(true)
    try {
      const result = await listSubscriptionPlans()
      if (result.data) {
        setPlansList(result.data.plans || [])
      } else if (result.error) {
        toast.error(result.error)
      }
    } finally {
      setLoadingPlans(false)
    }
  }, [])

  React.useEffect(() => {
    if (activeTab === "abonnements" && subscriptionsList.length === 0 && activeOrgId) {
      void fetchSubscriptions()
    }
    if (activeTab === "plans" && plansList.length === 0) {
      void fetchPlans()
    }
  }, [activeTab, activeOrgId, fetchPlans, fetchSubscriptions, plansList.length, subscriptionsList.length])

  const filteredSubscriptions = React.useMemo(() => {
    if (!subscriptionSearch) return subscriptionsList
    const query = subscriptionSearch.toLowerCase()
    return subscriptionsList.filter((subscription) => {
      const statusLabel = getStatusOption(Number(subscription.status || 0)).label.toLowerCase()
      return (
        subscription.clientId.toLowerCase().includes(query) ||
        subscription.planId.toLowerCase().includes(query) ||
        statusLabel.includes(query)
      )
    })
  }, [subscriptionSearch, subscriptionsList])

  const filteredPlans = React.useMemo(() => {
    if (!planSearch) return plansList
    const query = planSearch.toLowerCase()
    return plansList.filter((plan) => {
      return (
        plan.name.toLowerCase().includes(query) ||
        (plan.description || "").toLowerCase().includes(query) ||
        (plan.code || "").toLowerCase().includes(query)
      )
    })
  }, [planSearch, plansList])

  const handleCreateSubscription = () => {
    setSelectedSubscription(null)
    setSubscriptionFormData(EMPTY_SUBSCRIPTION_FORM)
    setSubscriptionDialogOpen(true)
  }

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setSubscriptionFormData({
      clientId: subscription.clientId,
      planId: subscription.planId,
      status: String(Number(subscription.status || 0)),
      startDate: formatDateInput(subscription.startDate),
      endDate: formatDateInput(subscription.endDate),
    })
    setSubscriptionDialogOpen(true)
  }

  const handleDeleteSubscription = async () => {
    if (!selectedSubscription) return

    setSubmitting(true)
    try {
      const result = await deleteSubscription(selectedSubscription.id)
      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Abonnement supprime")
      setSubscriptionDeleteDialogOpen(false)
      setSelectedSubscription(null)
      await fetchSubscriptions()
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitSubscription = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!subscriptionFormData.clientId || !subscriptionFormData.planId) {
      toast.error("Client et plan sont obligatoires")
      return
    }

    if (!activeOrgId) {
      toast.error("Aucune organisation active")
      return
    }

    setSubmitting(true)
    try {
      if (selectedSubscription) {
        const payload: any = {
          id: selectedSubscription.id,
          planId: subscriptionFormData.planId,
          startDate: toIsoDate(subscriptionFormData.startDate),
          endDate: toIsoDate(subscriptionFormData.endDate),
          status: Number(subscriptionFormData.status),
        }

        const result = await updateSubscription(payload)
        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success("Abonnement mis a jour")
      } else {
        const payload: any = {
          organisationId: activeOrgId,
          clientId: subscriptionFormData.clientId,
          planId: subscriptionFormData.planId,
          planType: 0,
          frequency: 0,
          storeSource: 0,
          startDate: toIsoDate(subscriptionFormData.startDate) || new Date().toISOString(),
          status: Number(subscriptionFormData.status),
        }

        const result = await createSubscription(payload)
        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success("Abonnement cree")
      }

      setSubscriptionDialogOpen(false)
      setSelectedSubscription(null)
      setSubscriptionFormData(EMPTY_SUBSCRIPTION_FORM)
      await fetchSubscriptions()
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreatePlan = () => {
    setSelectedPlan(null)
    setPlanFormData(EMPTY_PLAN_FORM)
    setPlanDialogOpen(true)
  }

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setPlanFormData({
      name: plan.name,
      description: plan.description || "",
      price: String(plan.priceMonthly || 0),
      billingInterval: String(Number(plan.billingInterval || 0)),
    })
    setPlanDialogOpen(true)
  }

  const handleDeletePlan = async () => {
    if (!selectedPlan) return

    setSubmitting(true)
    try {
      const result = await deleteSubscriptionPlan(selectedPlan.id)
      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Plan supprime")
      setPlanDeleteDialogOpen(false)
      setSelectedPlan(null)
      await fetchPlans()
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitPlan = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!planFormData.name.trim()) {
      toast.error("Le nom du plan est obligatoire")
      return
    }

    if (!activeOrgId) {
      toast.error("Aucune organisation active")
      return
    }

    const price = Number(planFormData.price || 0)
    const billingInterval = Number(planFormData.billingInterval || 0)

    setSubmitting(true)
    try {
      if (selectedPlan) {
        const result = await updateSubscriptionPlan({
          id: selectedPlan.id,
          name: planFormData.name.trim(),
          description: planFormData.description,
          priceMonthly: price,
          priceAnnual: price * 12,
          billingInterval,
        })

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success("Plan mis a jour")
      } else {
        const result = await createSubscriptionPlan({
          organisationId: activeOrgId,
          code: toPlanCode(planFormData.name),
          name: planFormData.name.trim(),
          description: planFormData.description,
          planType: 0,
          priceMonthly: price,
          priceAnnual: price * 12,
          currency: "EUR",
          billingInterval,
          billingCycleDays: billingInterval === 1 ? 365 : 30,
          trialDays: 0,
          features: "",
        })

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success("Plan cree")
      }

      setPlanDialogOpen(false)
      setSelectedPlan(null)
      setPlanFormData(EMPTY_PLAN_FORM)
      await fetchPlans()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <CreditCard className="size-6" />
          Abonnements
        </h1>
        <p className="text-muted-foreground">
          Gere les abonnements clients et les plans de souscription.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="abonnements">
            <CreditCard className="mr-2 size-4" />
            Abonnements
          </TabsTrigger>
          <TabsTrigger value="plans">
            <LayoutList className="mr-2 size-4" />
            Plans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="abonnements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Abonnements clients</CardTitle>
                  <CardDescription>
                    {subscriptionsList.length} abonnement{subscriptionsList.length > 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-64 max-w-full">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un abonnement"
                      value={subscriptionSearch}
                      onChange={(event) => setSubscriptionSearch(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void fetchSubscriptions()}
                    disabled={loadingSubscriptions}
                  >
                    {loadingSubscriptions ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 size-4" />
                    )}
                    Actualiser
                  </Button>
                  <Button onClick={handleCreateSubscription}>
                    <Plus className="mr-2 size-4" />
                    Nouvel abonnement
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date debut</TableHead>
                    <TableHead>Date fin</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        {subscriptionSearch ? "Aucun abonnement trouve" : "Aucun abonnement"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((subscription) => {
                      const statusOption = getStatusOption(Number(subscription.status || 0))

                      return (
                        <TableRow key={subscription.id}>
                          <TableCell className="font-mono text-xs">{subscription.clientId}</TableCell>
                          <TableCell className="font-mono text-xs">{subscription.planId}</TableCell>
                          <TableCell>
                            <Badge variant={statusOption.variant}>{statusOption.label}</Badge>
                          </TableCell>
                          <TableCell>{formatDateDisplay(subscription.startDate)}</TableCell>
                          <TableCell>{formatDateDisplay(subscription.endDate)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditSubscription(subscription)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedSubscription(subscription)
                                  setSubscriptionDeleteDialogOpen(true)
                                }}
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
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Plans d&apos;abonnement</CardTitle>
                  <CardDescription>
                    {plansList.length} plan{plansList.length > 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-64 max-w-full">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un plan"
                      value={planSearch}
                      onChange={(event) => setPlanSearch(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" onClick={() => void fetchPlans()} disabled={loadingPlans}>
                    {loadingPlans ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 size-4" />
                    )}
                    Actualiser
                  </Button>
                  <Button onClick={handleCreatePlan}>
                    <Plus className="mr-2 size-4" />
                    Nouveau plan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Intervalle</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        {planSearch ? "Aucun plan trouve" : "Aucun plan"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{plan.name}</div>
                            <Badge variant="outline" className="font-mono text-xs">
                              {plan.code}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[420px] text-sm text-muted-foreground">
                          {plan.description || "-"}
                        </TableCell>
                        <TableCell>
                          {plan.priceMonthly ? `${plan.priceMonthly} ${plan.currency || "EUR"}` : "-"}
                        </TableCell>
                        <TableCell>{getIntervalLabel(Number(plan.billingInterval || 0))}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditPlan(plan)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedPlan(plan)
                                setPlanDeleteDialogOpen(true)
                              }}
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
        </TabsContent>
      </Tabs>

      <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSubscription ? "Modifier l'abonnement" : "Creer un abonnement"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations principales de l&apos;abonnement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitSubscription} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subscription-client-id">Client ID *</Label>
              <Input
                id="subscription-client-id"
                value={subscriptionFormData.clientId}
                onChange={(event) =>
                  setSubscriptionFormData((prev) => ({ ...prev, clientId: event.target.value }))
                }
                placeholder="client_..."
                disabled={Boolean(selectedSubscription)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription-plan-id">Plan ID *</Label>
              <Input
                id="subscription-plan-id"
                value={subscriptionFormData.planId}
                onChange={(event) =>
                  setSubscriptionFormData((prev) => ({ ...prev, planId: event.target.value }))
                }
                placeholder="plan_..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription-status">Statut</Label>
              <Select
                value={subscriptionFormData.status}
                onValueChange={(value) =>
                  setSubscriptionFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="subscription-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subscription-start-date">Date de debut</Label>
                <Input
                  id="subscription-start-date"
                  type="date"
                  value={subscriptionFormData.startDate}
                  onChange={(event) =>
                    setSubscriptionFormData((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription-end-date">Date de fin</Label>
                <Input
                  id="subscription-end-date"
                  type="date"
                  value={subscriptionFormData.endDate}
                  onChange={(event) =>
                    setSubscriptionFormData((prev) => ({ ...prev, endDate: event.target.value }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSubscriptionDialogOpen(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {selectedSubscription ? "Mettre a jour" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={subscriptionDeleteDialogOpen} onOpenChange={setSubscriptionDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet abonnement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible pour l&apos;abonnement du client
              {" "}
              <strong>{selectedSubscription?.clientId}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubscription}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? "Modifier le plan" : "Creer un plan"}</DialogTitle>
            <DialogDescription>
              Configurez le nom, la description, le prix et l&apos;intervalle de facturation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPlan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Nom *</Label>
              <Input
                id="plan-name"
                value={planFormData.name}
                onChange={(event) =>
                  setPlanFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Plan Premium"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Code genere</Label>
              <Badge variant="outline" className="font-mono">
                {toPlanCode(planFormData.name)}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-description">Description</Label>
              <Textarea
                id="plan-description"
                value={planFormData.description}
                onChange={(event) =>
                  setPlanFormData((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Description du plan"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan-price">Prix</Label>
                <Input
                  id="plan-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={planFormData.price}
                  onChange={(event) =>
                    setPlanFormData((prev) => ({ ...prev, price: event.target.value }))
                  }
                  placeholder="29.90"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-interval">Intervalle</Label>
                <Select
                  value={planFormData.billingInterval}
                  onValueChange={(value) =>
                    setPlanFormData((prev) => ({ ...prev, billingInterval: value }))
                  }
                >
                  <SelectTrigger id="plan-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVAL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPlanDialogOpen(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {selectedPlan ? "Mettre a jour" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={planDeleteDialogOpen} onOpenChange={setPlanDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce plan ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible pour le plan
              {" "}
              <strong>{selectedPlan?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
