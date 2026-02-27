"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Phone,
  Settings,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw,
  Send,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  Receipt,
  CreditCard,
} from "lucide-react"
import type { CfastConfig } from "@proto/cfast/cfast"
import type { ClientBase } from "@proto/clients/clients"
import type { Contrat } from "@proto/contrats/contrats"
import {
  pushClientToCfast,
  pushContractToCfast,
  assignSubscriptionInCfast,
  syncUnpaidInvoices,
  getCfastSyncStatus,
  getCfastEntityMappings,
} from "@/actions/cfast"
import { getClientsByOrganisation } from "@/actions/clients"
import { getContratsByOrganisation } from "@/actions/contrats"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CfastIntegrationSectionProps {
  activeOrgId?: string | null
  cfastConfig: CfastConfig | null
  onOpenConfigDialog: () => void
  onTestConnection: () => void
  testResultStatus: "idle" | "loading" | "success" | "error"
}

interface SyncStatus {
  lastSyncAt: string
  lastImportedCount: number
  syncError: string
  isConnected: boolean
}

interface EntityCounts {
  clients: number
  contrats: number
  services: number
  customers: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CfastIntegrationSection({
  activeOrgId,
  cfastConfig,
  onOpenConfigDialog,
  onTestConnection,
  testResultStatus,
}: CfastIntegrationSectionProps) {
  // Clients & contrats lists
  const [clients, setClients] = React.useState<ClientBase[]>([])
  const [contrats, setContrats] = React.useState<Contrat[]>([])
  const [loadingLists, setLoadingLists] = React.useState(false)

  // Action states
  const [selectedClientId, setSelectedClientId] = React.useState<string>("")
  const [selectedContratId, setSelectedContratId] = React.useState<string>("")
  const [selectedAssignContratId, setSelectedAssignContratId] = React.useState<string>("")
  const [pushingClient, setPushingClient] = React.useState(false)
  const [pushingContrat, setPushingContrat] = React.useState(false)
  const [assigningSubscription, setAssigningSubscription] = React.useState(false)
  const [syncingInvoices, setSyncingInvoices] = React.useState(false)

  // Status tab state
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus | null>(null)
  const [entityCounts, setEntityCounts] = React.useState<EntityCounts>({
    clients: 0,
    contrats: 0,
    services: 0,
    customers: 0,
  })
  const [loadingStatus, setLoadingStatus] = React.useState(false)

  // ---------------------------------------------------------------------------
  // Load clients + contrats when Actions tab is used
  // ---------------------------------------------------------------------------
  const loadLists = React.useCallback(async () => {
    if (!activeOrgId) return
    setLoadingLists(true)
    try {
      const [clientsResult, contratsResult] = await Promise.all([
        getClientsByOrganisation({ organisationId: activeOrgId }),
        getContratsByOrganisation({ organisationId: activeOrgId }),
      ])
      if (clientsResult.data) setClients(clientsResult.data.clients || [])
      if (contratsResult.data) setContrats(contratsResult.data.contrats || [])
    } catch {
      toast.error("Erreur lors du chargement des listes")
    } finally {
      setLoadingLists(false)
    }
  }, [activeOrgId])

  // ---------------------------------------------------------------------------
  // Load sync status
  // ---------------------------------------------------------------------------
  const loadSyncStatus = React.useCallback(async () => {
    if (!activeOrgId) return
    setLoadingStatus(true)
    try {
      const [statusResult, mappingsResult] = await Promise.all([
        getCfastSyncStatus(activeOrgId),
        getCfastEntityMappings(activeOrgId),
      ])

      if (statusResult.data) {
        setSyncStatus(statusResult.data)
      }

      if (mappingsResult.data) {
        const mappings = mappingsResult.data.mappings || []
        setEntityCounts({
          clients: mappings.filter((m) => m.crmEntityType === "CLIENT" && m.cfastEntityType === "CUSTOMER").length,
          contrats: mappings.filter((m) => m.crmEntityType === "CONTRAT" && m.cfastEntityType === "CONTRACT").length,
          services: mappings.filter((m) => m.crmEntityType === "CONTRAT" && m.cfastEntityType === "SERVICE").length,
          customers: mappings.filter((m) => m.cfastEntityType === "CUSTOMER").length,
        })
      }
    } catch {
      toast.error("Erreur lors du chargement du statut")
    } finally {
      setLoadingStatus(false)
    }
  }, [activeOrgId])

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------
  const handlePushClient = async () => {
    if (!activeOrgId || !selectedClientId) {
      toast.error("Veuillez sélectionner un client")
      return
    }
    setPushingClient(true)
    try {
      const result = await pushClientToCfast(activeOrgId, selectedClientId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Client envoyé vers CFAST (ID: ${result.data?.cfastCustomerId})`)
        setSelectedClientId("")
      }
    } catch {
      toast.error("Erreur inattendue lors de l'envoi du client")
    } finally {
      setPushingClient(false)
    }
  }

  const handlePushContrat = async () => {
    if (!activeOrgId || !selectedContratId) {
      toast.error("Veuillez sélectionner un contrat")
      return
    }
    setPushingContrat(true)
    try {
      const result = await pushContractToCfast(activeOrgId, selectedContratId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Contrat envoyé vers CFAST (ID: ${result.data?.cfastContractId})`)
        setSelectedContratId("")
      }
    } catch {
      toast.error("Erreur inattendue lors de l'envoi du contrat")
    } finally {
      setPushingContrat(false)
    }
  }

  const handleAssignSubscription = async () => {
    if (!activeOrgId || !selectedAssignContratId) {
      toast.error("Veuillez sélectionner un contrat")
      return
    }
    setAssigningSubscription(true)
    try {
      const result = await assignSubscriptionInCfast(activeOrgId, selectedAssignContratId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Forfait assigné dans CFAST (ID: ${result.data?.cfastServiceId})`)
        setSelectedAssignContratId("")
      }
    } catch {
      toast.error("Erreur inattendue lors de l'assignation du forfait")
    } finally {
      setAssigningSubscription(false)
    }
  }

  const handleSyncInvoices = async () => {
    if (!activeOrgId) return
    setSyncingInvoices(true)
    try {
      const result = await syncUnpaidInvoices(activeOrgId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.data?.message || "Synchronisation des factures lancée")
      }
    } catch {
      toast.error("Erreur inattendue lors de la synchronisation")
    } finally {
      setSyncingInvoices(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Tab change handler
  // ---------------------------------------------------------------------------
  const handleTabChange = (value: string) => {
    if (value === "actions" && clients.length === 0) {
      loadLists()
    }
    if (value === "status") {
      loadSyncStatus()
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
              <Phone className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">CFAST</CardTitle>
              <CardDescription>
                Gestion complète du cycle de vie client-facturation
              </CardDescription>
            </div>
          </div>
          {cfastConfig?.active ? (
            <Badge variant="default" className="gap-1">
              <Wifi className="size-3" />
              Connecté
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <WifiOff className="size-3" />
              Non connecté
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="config" onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="config">
              <Settings className="size-3.5 mr-1.5" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="actions" disabled={!cfastConfig?.active}>
              <Send className="size-3.5 mr-1.5" />
              Actions
            </TabsTrigger>
            <TabsTrigger value="status" disabled={!cfastConfig?.active}>
              <Activity className="size-3.5 mr-1.5" />
              Statut
            </TabsTrigger>
          </TabsList>

          {/* ============================================================= */}
          {/* Configuration Tab                                              */}
          {/* ============================================================= */}
          <TabsContent value="config" className="space-y-4">
            {cfastConfig ? (
              <>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Base URL</span>
                    <span className="font-mono text-xs truncate max-w-[280px]">
                      {cfastConfig.baseUrl || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Client ID</span>
                    <span className="font-mono text-xs">••••••••</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Scopes</span>
                    <span className="font-mono text-xs">
                      {cfastConfig.scopes || "openid identity bill"}
                    </span>
                  </div>
                </div>
                <Separator />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune configuration. Cliquez sur Configurer pour commencer.
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={onOpenConfigDialog}>
                <Settings className="size-4 mr-1.5" />
                {cfastConfig ? "Modifier" : "Configurer"}
              </Button>
              {cfastConfig && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onTestConnection}
                  disabled={testResultStatus === "loading"}
                >
                  {testResultStatus === "loading" ? (
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                  ) : (
                    <Wifi className="size-4 mr-1.5" />
                  )}
                  Tester la connexion
                </Button>
              )}
            </div>
          </TabsContent>

          {/* ============================================================= */}
          {/* Actions Tab                                                    */}
          {/* ============================================================= */}
          <TabsContent value="actions" className="space-y-4">
            {loadingLists ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="size-5 animate-spin mr-2" />
                Chargement des listes…
              </div>
            ) : (
              <div className="space-y-3">
                {/* Push Client */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    <Users className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Envoyer Client</p>
                    <p className="text-xs text-muted-foreground">
                      Crée le client, billing point et site dans CFAST
                    </p>
                  </div>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.prenom} {c.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handlePushClient}
                    disabled={pushingClient || !selectedClientId}
                  >
                    {pushingClient ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    <span className="ml-1.5">Envoyer</span>
                  </Button>
                </div>

                {/* Push Contrat */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-8 items-center justify-center rounded-md bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400">
                    <FileText className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Envoyer Contrat</p>
                    <p className="text-xs text-muted-foreground">
                      Crée le contrat et upload le PDF dans CFAST
                    </p>
                  </div>
                  <Select value={selectedContratId} onValueChange={setSelectedContratId}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Sélectionner un contrat" />
                    </SelectTrigger>
                    <SelectContent>
                      {contrats.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.reference || c.titre || c.id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handlePushContrat}
                    disabled={pushingContrat || !selectedContratId}
                  >
                    {pushingContrat ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    <span className="ml-1.5">Envoyer</span>
                  </Button>
                </div>

                {/* Assign Subscription */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-8 items-center justify-center rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                    <CreditCard className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Assigner Forfait</p>
                    <p className="text-xs text-muted-foreground">
                      Assigne un abonnement/service dans CFAST
                    </p>
                  </div>
                  <Select value={selectedAssignContratId} onValueChange={setSelectedAssignContratId}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Sélectionner un contrat" />
                    </SelectTrigger>
                    <SelectContent>
                      {contrats.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.reference || c.titre || c.id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleAssignSubscription}
                    disabled={assigningSubscription || !selectedAssignContratId}
                  >
                    {assigningSubscription ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    <span className="ml-1.5">Assigner</span>
                  </Button>
                </div>

                {/* Sync Invoices */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-8 items-center justify-center rounded-md bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                    <Receipt className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Synchroniser Factures</p>
                    <p className="text-xs text-muted-foreground">
                      Synchronise les factures impayées depuis CFAST
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSyncInvoices}
                    disabled={syncingInvoices}
                  >
                    {syncingInvoices ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    <span className="ml-1.5">Lancer la synchronisation</span>
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ============================================================= */}
          {/* Statut Tab                                                     */}
          {/* ============================================================= */}
          <TabsContent value="status" className="space-y-4">
            {loadingStatus ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="size-5 animate-spin mr-2" />
                Chargement du statut…
              </div>
            ) : (
              <>
                {/* Connection status */}
                <div className="flex items-center gap-2 text-sm">
                  {syncStatus?.isConnected ? (
                    <>
                      <CheckCircle2 className="size-4 text-green-600" />
                      <span className="text-green-600 font-medium">Connecté</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Non connecté</span>
                    </>
                  )}
                </div>

                {/* Last sync info */}
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="size-4 text-muted-foreground" />
                    Dernière synchronisation
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {syncStatus?.lastSyncAt
                      ? new Date(syncStatus.lastSyncAt).toLocaleString("fr-FR")
                      : "Aucune synchronisation effectuée"}
                  </p>
                  {syncStatus?.lastImportedCount !== undefined && syncStatus.lastImportedCount > 0 && (
                    <p className="text-sm text-muted-foreground pl-6">
                      {syncStatus.lastImportedCount} factures importées lors de la dernière sync
                    </p>
                  )}
                </div>

                {/* Entity counts */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{entityCounts.clients}</p>
                    <p className="text-xs text-muted-foreground">Clients envoyés</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{entityCounts.contrats}</p>
                    <p className="text-xs text-muted-foreground">Contrats envoyés</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{entityCounts.services}</p>
                    <p className="text-xs text-muted-foreground">Forfaits assignés</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{syncStatus?.lastImportedCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Factures importées</p>
                  </div>
                </div>

                {/* Errors */}
                {syncStatus?.syncError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                    <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
                      <AlertCircle className="size-4" />
                      Erreur récente
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 pl-6">
                      {syncStatus.syncError}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Refresh button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadSyncStatus}
                  disabled={loadingStatus}
                >
                  {loadingStatus ? (
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4 mr-1.5" />
                  )}
                  Rafraîchir
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
