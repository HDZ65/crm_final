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
  getWooCommerceConfigByOrganisation,
  createWooCommerceConfig,
  updateWooCommerceConfig,
  deleteWooCommerceConfig,
  listWooCommerceMappings,
  createWooCommerceMapping,
  updateWooCommerceMapping,
  deleteWooCommerceMapping,
  listWooCommerceWebhookEvents,
} from "@/actions/woocommerce"
import type {
  WooCommerceConfig,
  WooCommerceMapping,
  WooCommerceWebhookEvent,
} from "@proto/woocommerce/woocommerce"
import { Plus, Pencil, Trash2, Loader2, ShoppingCart, Search, RefreshCw } from "lucide-react"

interface WooCommercePageClientProps {
  activeOrgId?: string | null
  initialConfigs?: WooCommerceConfig[] | null
  initialMappings?: WooCommerceMapping[] | null
  initialWebhooks?: WooCommerceWebhookEvent[] | null
}

export function WooCommercePageClient({
  activeOrgId,
  initialConfigs,
  initialMappings,
  initialWebhooks,
}: WooCommercePageClientProps) {
  // Configs state
  const [configs, setConfigs] = React.useState<WooCommerceConfig[]>(initialConfigs || [])
  const [configDialogOpen, setConfigDialogOpen] = React.useState(false)
  const [selectedConfig, setSelectedConfig] = React.useState<WooCommerceConfig | null>(null)
  const [configFormData, setConfigFormData] = React.useState({
    storeUrl: "",
    consumerKey: "",
    consumerSecret: "",
    webhookSecret: "",
    syncProducts: true,
    syncOrders: true,
    syncCustomers: true,
    active: true,
  })
  const [deleteConfigDialogOpen, setDeleteConfigDialogOpen] = React.useState(false)

  // Mappings state
  const [mappings, setMappings] = React.useState<WooCommerceMapping[]>(initialMappings || [])
  const [mappingDialogOpen, setMappingDialogOpen] = React.useState(false)
  const [selectedMapping, setSelectedMapping] = React.useState<WooCommerceMapping | null>(null)
   const [mappingFormData, setMappingFormData] = React.useState({
     entityType: "",
     internalId: "",
     externalId: "",
     externalData: "",
     syncStatus: "active",
   })
  const [deleteMappingDialogOpen, setDeleteMappingDialogOpen] = React.useState(false)

  // Webhooks state
  const [webhooks, setWebhooks] = React.useState<WooCommerceWebhookEvent[]>(initialWebhooks || [])

  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Fetch functions
  const fetchConfigs = React.useCallback(async () => {
    if (!activeOrgId) return
    setLoading(true)
    const result = await getWooCommerceConfigByOrganisation(activeOrgId)
    if (result.data) {
      setConfigs([result.data])
    } else if (result.error) {
      toast.error(result.error)
    }
    setLoading(false)
  }, [activeOrgId])

  const fetchMappings = React.useCallback(async () => {
    if (!activeOrgId) return
    setLoading(true)
    const result = await listWooCommerceMappings({ organisationId: activeOrgId })
    if (result.data) {
      setMappings(result.data.mappings || [])
    } else if (result.error) {
      toast.error(result.error)
    }
    setLoading(false)
  }, [activeOrgId])

  const fetchWebhooks = React.useCallback(async () => {
    if (!activeOrgId) return
    setLoading(true)
    const result = await listWooCommerceWebhookEvents({ organisationId: activeOrgId })
    if (result.data) {
      setWebhooks(result.data.events || [])
    } else if (result.error) {
      toast.error(result.error)
    }
    setLoading(false)
  }, [activeOrgId])

  // Config handlers
  const handleCreateConfig = () => {
    setSelectedConfig(null)
    setConfigFormData({
      storeUrl: "",
      consumerKey: "",
      consumerSecret: "",
      webhookSecret: "",
      syncProducts: true,
      syncOrders: true,
      syncCustomers: true,
      active: true,
    })
    setConfigDialogOpen(true)
  }

  const handleEditConfig = (config: WooCommerceConfig) => {
    setSelectedConfig(config)
    setConfigFormData({
      storeUrl: config.storeUrl,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      webhookSecret: config.webhookSecret,
      syncProducts: config.syncProducts,
      syncOrders: config.syncOrders,
      syncCustomers: config.syncCustomers,
      active: config.active,
    })
    setConfigDialogOpen(true)
  }

  const handleSubmitConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configFormData.storeUrl || !configFormData.consumerKey || !configFormData.consumerSecret) {
      toast.error("URL boutique, Consumer Key et Consumer Secret sont obligatoires")
      return
    }

    setLoading(true)

    if (selectedConfig) {
      const result = await updateWooCommerceConfig({
        id: selectedConfig.id,
        ...configFormData,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Configuration mise à jour")
        setConfigDialogOpen(false)
        fetchConfigs()
      }
    } else {
      if (!activeOrgId) {
        toast.error("Organisation non trouvée")
        setLoading(false)
        return
      }
      const result = await createWooCommerceConfig({
        organisationId: activeOrgId,
        ...configFormData,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Configuration créée")
        setConfigDialogOpen(false)
        fetchConfigs()
      }
    }

    setLoading(false)
  }

  const handleDeleteConfig = async () => {
    if (!selectedConfig) return

    setLoading(true)
    const result = await deleteWooCommerceConfig(selectedConfig.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Configuration supprimée")
      setDeleteConfigDialogOpen(false)
      fetchConfigs()
    }

    setLoading(false)
  }

  // Mapping handlers
   const handleCreateMapping = () => {
     setSelectedMapping(null)
     setMappingFormData({
       entityType: "",
       internalId: "",
       externalId: "",
       externalData: "",
       syncStatus: "active",
     })
     setMappingDialogOpen(true)
   }

   const handleEditMapping = (mapping: WooCommerceMapping) => {
     setSelectedMapping(mapping)
     setMappingFormData({
       entityType: mapping.entityType,
       internalId: mapping.internalId,
       externalId: mapping.externalId,
       externalData: mapping.externalData,
       syncStatus: mapping.syncStatus,
     })
     setMappingDialogOpen(true)
   }

   const handleSubmitMapping = async (e: React.FormEvent) => {
     e.preventDefault()
     if (!mappingFormData.entityType || !mappingFormData.internalId || !mappingFormData.externalId) {
       toast.error("Tous les champs sont obligatoires")
       return
     }

     setLoading(true)

     if (selectedMapping) {
       const result = await updateWooCommerceMapping({
         id: selectedMapping.id,
         internalId: mappingFormData.internalId,
         externalData: mappingFormData.externalData,
         syncStatus: mappingFormData.syncStatus,
       })
       if (result.error) {
         toast.error(result.error)
       } else {
         toast.success("Mapping mis à jour")
         setMappingDialogOpen(false)
         fetchMappings()
       }
     } else {
       if (!activeOrgId) {
         toast.error("Organisation non trouvée")
         setLoading(false)
         return
       }
       const result = await createWooCommerceMapping({
         organisationId: activeOrgId,
         entityType: mappingFormData.entityType,
         externalId: mappingFormData.externalId,
         internalId: mappingFormData.internalId,
         externalData: mappingFormData.externalData,
       })
       if (result.error) {
         toast.error(result.error)
       } else {
         toast.success("Mapping créé")
         setMappingDialogOpen(false)
         fetchMappings()
       }
     }

     setLoading(false)
   }

  const handleDeleteMapping = async () => {
    if (!selectedMapping) return

    setLoading(true)
    const result = await deleteWooCommerceMapping(selectedMapping.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Mapping supprimé")
      setDeleteMappingDialogOpen(false)
      fetchMappings()
    }

    setLoading(false)
  }

   const filteredConfigs = React.useMemo(() => {
     if (!search) return configs
     const q = search.toLowerCase()
     return configs.filter(
       (c) => c.id.toLowerCase().includes(q) || c.storeUrl.toLowerCase().includes(q)
     )
   }, [configs, search])

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="size-6" />
            Intégration WooCommerce
          </h1>
          <p className="text-muted-foreground">
            Gérez les configurations, mappings produits et webhooks WooCommerce.
          </p>
        </div>
      </div>

      {/* Configurations Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configurations WooCommerce</CardTitle>
              <CardDescription>
                {configs.length} configuration{configs.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleCreateConfig}>
                <Plus className="size-4 mr-2" />
                Nouvelle configuration
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredConfigs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Aucune configuration WooCommerce
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>URL Boutique</TableHead>
                  <TableHead>Consumer Key</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {filteredConfigs.map((config) => (
                   <TableRow key={config.id}>
                     <TableCell className="font-medium">{config.id}</TableCell>
                     <TableCell>{config.storeUrl}</TableCell>
                     <TableCell className="font-mono text-xs">
                       {config.consumerKey ? config.consumerKey.substring(0, 20) + "..." : "-"}
                     </TableCell>
                    <TableCell>
                      <Badge variant={config.active ? "default" : "secondary"}>
                        {config.active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditConfig(config)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedConfig(config)
                            setDeleteConfigDialogOpen(true)
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

      {/* Mappings Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mappings Produits</CardTitle>
              <CardDescription>
                {mappings.length} mapping{mappings.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button onClick={handleCreateMapping}>
              <Plus className="size-4 mr-2" />
              Nouveau mapping
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mappings.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Aucun mapping produit</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Produit CRM</TableHead>
                  <TableHead>Produit WooCommerce</TableHead>
                  <TableHead>Sync Actif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
               <TableBody>
                 {mappings.map((mapping) => (
                   <TableRow key={mapping.id}>
                     <TableCell>{mapping.entityType}</TableCell>
                     <TableCell className="font-mono text-xs">{mapping.internalId}</TableCell>
                     <TableCell className="font-mono text-xs">{mapping.externalId}</TableCell>
                     <TableCell>
                       <Badge variant={mapping.syncStatus === "active" ? "default" : "secondary"}>
                         {mapping.syncStatus === "active" ? "Actif" : "Inactif"}
                       </Badge>
                     </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditMapping(mapping)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedMapping(mapping)
                            setDeleteMappingDialogOpen(true)
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

      {/* Webhooks Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Événements Webhook Récents</CardTitle>
              <CardDescription>
                {webhooks.length} événement{webhooks.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button onClick={fetchWebhooks} variant="outline" size="sm">
              <RefreshCw className="size-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Aucun événement webhook récent
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Payload</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {webhooks.map((webhook) => (
                   <TableRow key={webhook.id}>
                     <TableCell className="font-medium">{webhook.topic}</TableCell>
                     <TableCell className="font-mono text-xs max-w-xs truncate">
                       {webhook.payload}
                     </TableCell>
                     <TableCell>
                       <Badge variant={webhook.status === "processed" ? "default" : "secondary"}>
                         {webhook.status === "processed" ? "Traité" : "En attente"}
                       </Badge>
                     </TableCell>
                     <TableCell>{new Date(webhook.createdAt).toLocaleString("fr-FR")}</TableCell>
                   </TableRow>
                 ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedConfig ? "Modifier" : "Créer"} une configuration
            </DialogTitle>
            <DialogDescription>
              Configurez la connexion à votre boutique WooCommerce.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitConfig} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeUrl">URL Boutique *</Label>
              <Input
                id="storeUrl"
                value={configFormData.storeUrl}
                onChange={(e) =>
                  setConfigFormData({ ...configFormData, storeUrl: e.target.value })
                }
                placeholder="https://example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <Input
                id="webhookSecret"
                type="password"
                value={configFormData.webhookSecret}
                onChange={(e) =>
                  setConfigFormData({ ...configFormData, webhookSecret: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumerKey">Consumer Key *</Label>
              <Input
                id="consumerKey"
                value={configFormData.consumerKey}
                onChange={(e) =>
                  setConfigFormData({ ...configFormData, consumerKey: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumerSecret">Consumer Secret *</Label>
              <Input
                id="consumerSecret"
                type="password"
                value={configFormData.consumerSecret}
                onChange={(e) =>
                  setConfigFormData({ ...configFormData, consumerSecret: e.target.value })
                }
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={configFormData.active}
                onCheckedChange={(checked) =>
                  setConfigFormData({ ...configFormData, active: checked === true })
                }
              />
              <Label htmlFor="active">Actif</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="syncProducts"
                checked={configFormData.syncProducts}
                onCheckedChange={(checked) =>
                  setConfigFormData({ ...configFormData, syncProducts: checked === true })
                }
              />
              <Label htmlFor="syncProducts">Synchroniser les produits</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="syncOrders"
                checked={configFormData.syncOrders}
                onCheckedChange={(checked) =>
                  setConfigFormData({ ...configFormData, syncOrders: checked === true })
                }
              />
              <Label htmlFor="syncOrders">Synchroniser les commandes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="syncCustomers"
                checked={configFormData.syncCustomers}
                onCheckedChange={(checked) =>
                  setConfigFormData({ ...configFormData, syncCustomers: checked === true })
                }
              />
              <Label htmlFor="syncCustomers">Synchroniser les clients</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConfigDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                {selectedConfig ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mapping Dialog */}
      <Dialog open={mappingDialogOpen} onOpenChange={setMappingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMapping ? "Modifier" : "Créer"} un mapping</DialogTitle>
            <DialogDescription>
              Associez un produit CRM à un produit WooCommerce.
            </DialogDescription>
          </DialogHeader>
           <form onSubmit={handleSubmitMapping} className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="entityType">Type d'entité *</Label>
               <Input
                 id="entityType"
                 value={mappingFormData.entityType}
                 onChange={(e) =>
                   setMappingFormData({ ...mappingFormData, entityType: e.target.value })
                 }
                 placeholder="ex: product, order"
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="internalId">ID Interne (CRM) *</Label>
               <Input
                 id="internalId"
                 value={mappingFormData.internalId}
                 onChange={(e) =>
                   setMappingFormData({ ...mappingFormData, internalId: e.target.value })
                 }
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="externalId">ID Externe (WooCommerce) *</Label>
               <Input
                 id="externalId"
                 value={mappingFormData.externalId}
                 onChange={(e) =>
                   setMappingFormData({ ...mappingFormData, externalId: e.target.value })
                 }
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="externalData">Données Externes</Label>
               <Input
                 id="externalData"
                 value={mappingFormData.externalData}
                 onChange={(e) =>
                   setMappingFormData({ ...mappingFormData, externalData: e.target.value })
                 }
                 placeholder="Données JSON ou texte"
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="syncStatus">Statut de synchronisation</Label>
               <Select
                 value={mappingFormData.syncStatus}
                 onValueChange={(value) =>
                   setMappingFormData({ ...mappingFormData, syncStatus: value })
                 }
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Sélectionner un statut" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="active">Actif</SelectItem>
                   <SelectItem value="inactive">Inactif</SelectItem>
                   <SelectItem value="pending">En attente</SelectItem>
                   <SelectItem value="error">Erreur</SelectItem>
                 </SelectContent>
               </Select>
             </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMappingDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                {selectedMapping ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Config Dialog */}
      <AlertDialog open={deleteConfigDialogOpen} onOpenChange={setDeleteConfigDialogOpen}>
        <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
             <AlertDialogDescription>
               Êtes-vous sûr de vouloir supprimer la configuration{" "}
               <strong>{selectedConfig?.id}</strong> ? Cette action est irréversible.
             </AlertDialogDescription>
           </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfig} disabled={loading}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Mapping Dialog */}
      <AlertDialog open={deleteMappingDialogOpen} onOpenChange={setDeleteMappingDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce mapping produit ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMapping} disabled={loading}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
