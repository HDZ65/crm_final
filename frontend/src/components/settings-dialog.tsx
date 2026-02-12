"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Lock,
  User,
  Shield,
  CreditCard,
  Check,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Palette,
  CalendarDays,
  ListTree,
  Zap,
  ShoppingCart,
  Package,
  Wifi,
  WifiOff,
  Info,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { usePspAccounts, PspType } from "@/hooks/use-psp-accounts"
import { useOrganisation } from "@/contexts/organisation-context"
import { useSocietes } from "@/hooks/clients"
import { RolesPermissionsSettings } from "@/components/settings/roles-permissions-settings"
import { toast } from "sonner"
import { getWinLeadPlusConfig, saveWinLeadPlusConfig, testWinLeadPlusConnection } from "@/actions/winleadplus"
import { testWooCommerceConnection, getWooCommerceConfigByOrganisation } from "@/actions/woocommerce"
import { testCatalogueApiConnection, importCatalogueFromApi } from "@/actions/catalogue-api"
import type { WinLeadPlusConfig } from "@/proto/winleadplus/winleadplus"
import type { WooCommerceConfig } from "@/proto/woocommerce/woocommerce"
import type { CatalogueApiTestResult, CatalogueApiImportResult } from "@/actions/catalogue-api"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const navItems = [
  // Groupe Compte
  { id: "profil", name: "Profil", icon: User, group: "compte" },
  { id: "notifications", name: "Notifications", icon: Bell, group: "compte" },
  { id: "securite", name: "Sécurité", icon: Shield, group: "compte" },
  // Groupe Organisation
  { id: "paiements", name: "PSP / Prestataires", icon: CreditCard, group: "organisation" },
  { id: "roles-permissions", name: "Rôles & Permissions", icon: ShieldCheck, group: "organisation" },
  { id: "marque-blanche", name: "Marque Blanche", icon: Palette, group: "organisation" },
  { id: "calendrier", name: "Calendrier", icon: CalendarDays, group: "organisation" },
  { id: "types-activites", name: "Types d'activités", icon: ListTree, group: "organisation" },
  { id: "integrations", name: "Intégrations", icon: Zap, group: "organisation" },
]

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ProfilSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profil</h3>
        <p className="text-sm text-muted-foreground">
          Gérez vos informations personnelles.
        </p>
      </div>
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="display-name">Nom d&apos;affichage</Label>
          <Input id="display-name" placeholder="Votre nom" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="votre@email.com" disabled />
          <p className="text-xs text-muted-foreground">
            L&apos;email ne peut pas être modifié.
          </p>
        </div>
      </div>
    </div>
  )
}

function NotificationsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Configurez vos préférences de notifications.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Notifications par email</Label>
            <p className="text-sm text-muted-foreground">
              Recevoir des notifications par email.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Nouveaux clients</Label>
            <p className="text-sm text-muted-foreground">
              Être notifié lors de l&apos;ajout d&apos;un nouveau client.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Contrats expirés</Label>
            <p className="text-sm text-muted-foreground">
              Être notifié des contrats qui arrivent à expiration.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Rappels</Label>
            <p className="text-sm text-muted-foreground">
              Recevoir des rappels pour les tâches en attente.
            </p>
          </div>
          <Switch />
        </div>
      </div>
    </div>
  )
}

// Types pour les comptes PSP (on utilise le type du hook)
import type { PspAccount } from "@/hooks/use-psp-accounts"

interface PspConfig {
  id: string
  name: string
  description: string
  fields: { name: string; label: string; type: "text" | "password"; required: boolean; placeholder: string }[]
}

const PSP_CONFIGS: PspConfig[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Paiements par carte bancaire",
    fields: [
      { name: "stripePublishableKey", label: "Clé publique", type: "text", required: true, placeholder: "pk_..." },
      { name: "stripeSecretKey", label: "Clé secrète", type: "password", required: true, placeholder: "sk_..." },
      { name: "stripeWebhookSecret", label: "Webhook Secret", type: "password", required: false, placeholder: "whsec_..." },
    ],
  },
  {
    id: "gocardless",
    name: "GoCardless",
    description: "Prélèvements SEPA",
    fields: [
      { name: "accessToken", label: "Access Token", type: "password", required: true, placeholder: "access-token-..." },
      { name: "webhookSecret", label: "Webhook Secret", type: "password", required: false, placeholder: "webhook-secret-..." },
    ],
  },
  {
    id: "emerchantpay",
    name: "Emerchantpay",
    description: "Paiements internationaux",
    fields: [
      { name: "username", label: "Username", type: "text", required: true, placeholder: "username" },
      { name: "password", label: "Password", type: "password", required: true, placeholder: "••••••••" },
      { name: "terminalToken", label: "Terminal Token", type: "password", required: true, placeholder: "terminal-token-..." },
    ],
  },
  {
    id: "slimpay",
    name: "Slimpay",
    description: "Mandats de prélèvement SEPA",
    fields: [
      { name: "appId", label: "App ID", type: "text", required: true, placeholder: "app-id-..." },
      { name: "appSecret", label: "App Secret", type: "password", required: true, placeholder: "app-secret-..." },
      { name: "creditorReference", label: "Référence créancier", type: "text", required: true, placeholder: "CREDITOR_REF" },
    ],
  },
  {
    id: "multisafepay",
    name: "MultiSafepay",
    description: "Paiements multi-méthodes",
    fields: [
      { name: "apiKey", label: "API Key", type: "password", required: true, placeholder: "api-key-..." },
      { name: "siteId", label: "Site ID", type: "text", required: false, placeholder: "site-id" },
      { name: "secureCode", label: "Secure Code", type: "password", required: false, placeholder: "secure-code" },
      { name: "accountId", label: "Account ID", type: "text", required: false, placeholder: "account-id" },
    ],
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Paiements PayPal et cartes",
    fields: [
      { name: "clientId", label: "Client ID", type: "text", required: true, placeholder: "AxxxxxxxxxxxxxxB" },
      { name: "clientSecret", label: "Client Secret", type: "password", required: true, placeholder: "ExxxxxxxxxxxxxxF" },
      { name: "webhookId", label: "Webhook ID", type: "text", required: false, placeholder: "WH-xxxxxxxx" },
    ],
  },
]

function PspAccountCard({
  config,
  account,
  onConnect,
  onDisconnect,
  isLoading
}: {
  config: PspConfig
  account: PspAccount | null
  onConnect: () => void
  onDisconnect: () => void
  isLoading: boolean
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${account?.actif ? "bg-green-100 dark:bg-green-900" : "bg-muted"}`}>
          <CreditCard className={`h-5 w-5 ${account?.actif ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{config.name}</span>
            {account?.actif && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Check className="h-3 w-3 mr-1" />
                Connecté
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
          {account && (
            <p className="text-xs text-muted-foreground mt-1">
              {account.nom}
            </p>
          )}
        </div>
      </div>
      <div>
        {isLoading ? (
          <Button variant="outline" size="sm" disabled>
            ...
          </Button>
        ) : account ? (
          <Button variant="outline" size="sm" onClick={onDisconnect}>
            Déconnecter
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onConnect}>
            Connecter
          </Button>
        )}
      </div>
    </div>
  )
}

function PspConnectForm({
  config,
  onSubmit,
  onCancel,
  isSubmitting
}: {
  config: PspConfig
  onSubmit: (data: Record<string, string>) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const [formData, setFormData] = React.useState<Record<string, string>>({
    nom: `${config.name} Account`,
  })
  const [showPasswords, setShowPasswords] = React.useState<Record<string, boolean>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords(prev => ({ ...prev, [fieldName]: !prev[fieldName] }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Connecter {config.name}</h4>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="nom">Nom du compte</Label>
          <Input
            id="nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            placeholder="Mon compte Stripe"
          />
        </div>

        {config.fields.map((field) => (
          <div key={field.name} className="grid gap-2">
            <Label htmlFor={field.name}>
              {field.label}
              {!field.required && <span className="text-muted-foreground ml-1">(optionnel)</span>}
            </Label>
            <div className="relative">
              <Input
                id={field.name}
                type={field.type === "password" && !showPasswords[field.name] ? "password" : "text"}
                value={formData[field.name] || ""}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                placeholder={field.placeholder}
                required={field.required}
                className={field.type === "password" ? "pr-10" : ""}
              />
              {field.type === "password" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility(field.name)}
                >
                  {showPasswords[field.name] ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Connexion..." : "Connecter"}
        </Button>
      </div>
    </form>
  )
}

function PaiementsSettings() {
  const { activeOrganisation, isOwner } = useOrganisation()
  const { societes } = useSocietes(activeOrganisation?.organisationId)
  const [selectedSocieteId, setSelectedSocieteId] = React.useState<string | null>(null)

  // Sélectionner la première société par défaut quand la liste est chargée
  React.useEffect(() => {
    if (societes.length > 0 && !selectedSocieteId) {
      setSelectedSocieteId(societes[0].id)
    }
  }, [societes, selectedSocieteId])

  const {
    accounts,
    isLoading,
    loadingPsp,
    connectAccount,
    disconnectAccount,
  } = usePspAccounts(selectedSocieteId)

  const [connectingPsp, setConnectingPsp] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleConnect = async (pspId: string, data: Record<string, string>) => {
    setIsSubmitting(true)
    try {
      const result = await connectAccount(pspId as PspType, data)
      if (result) {
        setConnectingPsp(null)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDisconnect = async (pspId: string) => {
    await disconnectAccount(pspId as PspType)
  }

  // Message si aucune organisation n'est sélectionnée
  if (!activeOrganisation?.organisationId) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Paiements</h3>
          <p className="text-sm text-muted-foreground">
            Connectez vos comptes de prestataires de paiement (PSP).
          </p>
        </div>
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Veuillez sélectionner une organisation pour gérer les comptes de paiement.
          </p>
        </div>
      </div>
    )
  }

  // Message si l'utilisateur n'est pas administrateur
  if (!isOwner) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Paiements</h3>
          <p className="text-sm text-muted-foreground">
            Connectez vos comptes de prestataires de paiement (PSP).
          </p>
        </div>
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
          <Lock className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Seuls les administrateurs de l&apos;organisation peuvent configurer les comptes de paiement.
          </p>
        </div>
      </div>
    )
  }

  // Message si aucune société n'existe
  if (societes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Paiements</h3>
          <p className="text-sm text-muted-foreground">
            Connectez vos comptes de prestataires de paiement (PSP).
          </p>
        </div>
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Aucune société trouvée. Créez d&apos;abord une société dans le catalogue pour configurer les paiements.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Paiements</h3>
        <p className="text-sm text-muted-foreground">
          Connectez vos comptes de prestataires de paiement (PSP).
        </p>
      </div>

      {/* Sélecteur de société */}
      <div className="grid gap-2">
        <Label htmlFor="societe-select">Société</Label>
        <Select
          value={selectedSocieteId || undefined}
          onValueChange={(value) => setSelectedSocieteId(value)}
        >
          <SelectTrigger id="societe-select">
            <SelectValue placeholder="Sélectionner une société" />
          </SelectTrigger>
          <SelectContent>
            {societes.map((societe) => (
              <SelectItem key={societe.id} value={societe.id}>
                {societe.raisonSociale}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Les comptes de paiement sont configurés par société.
        </p>
      </div>

      {/* Affichage des comptes PSP */}
      {!isLoading && (
        <div className="space-y-3">
          {PSP_CONFIGS.map((config) => (
            <div key={config.id}>
              {connectingPsp === config.id ? (
                <PspConnectForm
                  config={config}
                  onSubmit={(data) => handleConnect(config.id, data)}
                  onCancel={() => setConnectingPsp(null)}
                  isSubmitting={isSubmitting}
                />
              ) : (
                <PspAccountCard
                  config={config}
                  account={accounts[config.id as PspType] || null}
                  onConnect={() => setConnectingPsp(config.id)}
                  onDisconnect={() => handleDisconnect(config.id)}
                  isLoading={loadingPsp === config.id}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Les clés API sont chiffrées et stockées de manière sécurisée.
        Utilisez toujours les clés de test pour vos environnements de développement.
      </p>
    </div>
  )
}

function SecuriteSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Sécurité</h3>
        <p className="text-sm text-muted-foreground">
          Gérez la sécurité de votre compte.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Authentification à deux facteurs</Label>
            <p className="text-sm text-muted-foreground">
              Ajouter une couche de sécurité supplémentaire.
            </p>
          </div>
          <Switch />
        </div>
        <div className="grid gap-2">
          <Label>Changer le mot de passe</Label>
          <Button variant="outline" className="w-fit">
            Modifier le mot de passe
          </Button>
        </div>
        <div className="grid gap-2">
          <Label>Sessions actives</Label>
          <p className="text-sm text-muted-foreground">
            1 session active sur cet appareil.
          </p>
          <Button variant="outline" className="w-fit">
            Voir toutes les sessions
          </Button>
        </div>
      </div>
    </div>
  )
}

function AdminSectionLink({ title, description, path, onOpenChange }: { title: string; description: string; path: string; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()

  const handleNavigate = () => {
    router.push(path)
    onOpenChange(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
        <AlertCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Pour configurer {title.toLowerCase()}, accédez à la page dédiée.
        </p>
      </div>
      <Button onClick={handleNavigate} className="w-fit">
        Ouvrir {title}
      </Button>
    </div>
  )
}

function RolesPermissionsSettingsWrapper({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  return <RolesPermissionsSettings onOpenChange={onOpenChange} />
}

function MarqueBlancheSettings({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  return (
    <AdminSectionLink
      title="Marque Blanche"
      description="Personnalisez l'apparence de votre plateforme."
      path="/parametres/marque-blanche"
      onOpenChange={onOpenChange}
    />
  )
}

function CalendrierSettings({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  return (
    <AdminSectionLink
      title="Calendrier"
      description="Gérez les paramètres du calendrier."
      path="/calendrier"
      onOpenChange={onOpenChange}
    />
  )
}

function TypesActivitesSettings({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  return (
    <AdminSectionLink
      title="Types d'activités"
      description="Configurez les types d'activités disponibles."
      path="/parametres/types-activites"
      onOpenChange={onOpenChange}
    />
  )
}

const WIN_LEAD_PLUS_JSON_EXAMPLE = `{
  "api_endpoint": "https://api.winleadplus.com/v1",
  "api_token": "wlp_xxxxxxxxxxxx"
}`

function IntegrationsSettings({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const { activeOrganisation, isOwner } = useOrganisation()

  // WinLeadPlus state
  const [wlpConfig, setWlpConfig] = React.useState<WinLeadPlusConfig | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [wlpTestStatus, setWlpTestStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")
  const [wlpTestMessage, setWlpTestMessage] = React.useState("")

  const [apiEndpoint, setApiEndpoint] = React.useState("")
  const [apiToken, setApiToken] = React.useState("")
  const [showApiToken, setShowApiToken] = React.useState(false)
  const [enabled, setEnabled] = React.useState(false)
  const [syncInterval, setSyncInterval] = React.useState(60)
  const [showTokenInput, setShowTokenInput] = React.useState(false)

  // WooCommerce state
  const [wooConfig, setWooConfig] = React.useState<WooCommerceConfig | null>(null)
  const [wooTestStatus, setWooTestStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")
  const [wooTestMessage, setWooTestMessage] = React.useState("")

   // Catalogue REST API state
   const [catalogueApiUrl, setCatalogueApiUrl] = React.useState("")
   const [catalogueApiToken, setCatalogueApiToken] = React.useState("")
   const [showCatalogueToken, setShowCatalogueToken] = React.useState(false)
   const [catalogueTestStatus, setCatalogueTestStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")
   const [catalogueTestMessage, setCatalogueTestMessage] = React.useState("")
   const [catalogueTestDetails, setCatalogueTestDetails] = React.useState<{ productCount: number; sampleCategories: string[] }>({ productCount: 0, sampleCategories: [] })
   const [catalogueImportStatus, setCatalogueImportStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")
   const [catalogueImportMessage, setCatalogueImportMessage] = React.useState("")
   const [catalogueImportDetails, setCatalogueImportDetails] = React.useState<{ imported: number; skipped: number; errors: Array<{ productId: string | number; nom: string; error: string }>; gammesCreated: number }>({ imported: 0, skipped: 0, errors: [], gammesCreated: 0 })

  // Load configs
  React.useEffect(() => {
    if (!activeOrganisation?.organisationId) return

    setIsLoading(true)
    Promise.all([
      getWinLeadPlusConfig({ organisationId: activeOrganisation.organisationId }),
      getWooCommerceConfigByOrganisation(activeOrganisation.organisationId),
    ])
      .then(([wlpResult, wooResult]) => {
        if (wlpResult.data) {
          setWlpConfig(wlpResult.data)
          setApiEndpoint(wlpResult.data.api_endpoint || "")
          setEnabled(wlpResult.data.enabled || false)
          setSyncInterval(wlpResult.data.sync_interval_minutes || 60)
          setShowTokenInput(!wlpResult.data.has_api_token)
        }
        if (wooResult.data) {
          setWooConfig(wooResult.data)
        }
      })
      .finally(() => setIsLoading(false))
  }, [activeOrganisation?.organisationId])

  if (!activeOrganisation) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <p>Sélectionnez une organisation pour configurer les intégrations</p>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock className="h-4 w-4" />
        <p>Accès réservé aux administrateurs de l&apos;organisation</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        <p>Chargement des intégrations…</p>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // WinLeadPlus handlers
  // ---------------------------------------------------------------------------

  const handleTestWlp = async () => {
    if (!apiEndpoint) {
      toast.error("Veuillez saisir l'URL de l'API")
      return
    }
    setWlpTestStatus("loading")
    const { data, error } = await testWinLeadPlusConnection({
      organisationId: activeOrganisation.organisationId,
      apiEndpoint,
    })
    if (error || !data?.success) {
      setWlpTestStatus("error")
      setWlpTestMessage(error || data?.message || "Échec de la connexion")
    } else {
      setWlpTestStatus("success")
      setWlpTestMessage(data.message || "Connexion réussie")
    }
  }

  const handleSaveWlp = async () => {
    if (!apiEndpoint) {
      toast.error("Veuillez saisir l'URL de l'API")
      return
    }
    setIsSaving(true)
    const { data, error } = await saveWinLeadPlusConfig({
      id: wlpConfig?.id,
      organisationId: activeOrganisation.organisationId,
      apiEndpoint,
      enabled,
      syncIntervalMinutes: syncInterval,
      apiToken: apiToken || undefined,
    })
    setIsSaving(false)
    if (error) {
      toast.error("Erreur lors de la sauvegarde")
    } else {
      setWlpConfig(data)
      setApiToken("")
      setShowTokenInput(false)
      setShowApiToken(false)
      toast.success("Configuration enregistrée")
    }
  }

  // ---------------------------------------------------------------------------
  // WooCommerce handlers
  // ---------------------------------------------------------------------------

  const handleTestWoo = async () => {
    setWooTestStatus("loading")
    const { data, error } = await testWooCommerceConnection(activeOrganisation.organisationId)
    if (error || !data?.success) {
      setWooTestStatus("error")
      setWooTestMessage(error || data?.message || "Échec de la connexion")
    } else {
      setWooTestStatus("success")
      setWooTestMessage(data.message || "Connexion réussie")
    }
  }

  const handleGoToWooCommerce = () => {
    router.push("/integrations/woocommerce")
    onOpenChange(false)
  }

  // ---------------------------------------------------------------------------
  // Catalogue REST API handlers
  // ---------------------------------------------------------------------------

   const handleTestCatalogueApi = async () => {
     if (!catalogueApiUrl) {
       toast.error("Veuillez saisir l'URL de l'API")
       return
     }
     setCatalogueTestStatus("loading")
     const { data, error } = await testCatalogueApiConnection(catalogueApiUrl, catalogueApiToken || undefined)
     if (error || !data?.success) {
       setCatalogueTestStatus("error")
       setCatalogueTestMessage(error || data?.message || "Échec de la connexion")
     } else {
       setCatalogueTestStatus("success")
       setCatalogueTestMessage(data.message || "Connexion réussie")
       setCatalogueTestDetails({
         productCount: data.productCount,
         sampleCategories: data.sampleCategories,
       })
     }
   }

   const handleImportCatalogue = async () => {
     if (!catalogueApiUrl) {
       toast.error("Veuillez saisir l'URL de l'API")
       return
     }
     setCatalogueImportStatus("loading")
     const { data, error } = await importCatalogueFromApi({
       organisationId: activeOrganisation.organisationId,
       apiUrl: catalogueApiUrl,
       authToken: catalogueApiToken || undefined,
     })
     if (error || !data) {
       setCatalogueImportStatus("error")
       setCatalogueImportMessage(error || "Échec de l'import")
     } else {
       setCatalogueImportStatus("success")
       setCatalogueImportMessage(`${data.imported} produit(s) importé(s)`)
       setCatalogueImportDetails({
         imported: data.imported,
         skipped: data.skipped,
         errors: data.errors,
         gammesCreated: data.gammesCreated,
       })
     }
   }

  // ---------------------------------------------------------------------------
  // Render helper — test result badge
  // ---------------------------------------------------------------------------

  const renderTestResult = (status: "idle" | "loading" | "success" | "error", message: string) => {
    if (status === "loading") {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Test en cours…
        </span>
      )
    }
    if (status === "success") {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
          <Check className="size-3.5" />
          {message}
        </span>
      )
    }
    if (status === "error") {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <X className="size-3.5" />
          {message}
        </span>
      )
    }
    return null
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Intégrations Externes</h3>
          <p className="text-sm text-muted-foreground">
            Configurez les accès aux catalogues de produits et services externes.
          </p>
        </div>

        {/* ================================================================ */}
        {/* WinLeadPlus */}
        {/* ================================================================ */}
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Zap className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">WinLeadPlus</span>
                  {wlpConfig?.enabled ? (
                    <Badge variant="default" className="gap-1 text-xs">
                      <Wifi className="size-3" />
                      Connecté
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <WifiOff className="size-3" />
                      Déconnecté
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Synchronisation de prospects et leads</p>
              </div>
            </div>
            {wlpConfig && (
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wlp-api-endpoint">URL de l&apos;API *</Label>
              <Input
                id="wlp-api-endpoint"
                type="url"
                placeholder="https://api.winleadplus.com/v1"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="wlp-api-token">Clé API</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Info className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs font-medium mb-1">Format JSON attendu :</p>
                    <pre className="text-xs font-mono whitespace-pre bg-muted p-2 rounded">
                      {WIN_LEAD_PLUS_JSON_EXAMPLE}
                    </pre>
                  </TooltipContent>
                </Tooltip>
              </div>
              {wlpConfig?.has_api_token && !showTokenInput ? (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Token configuré</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTokenInput(true)}
                  >
                    Modifier
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="wlp-api-token"
                    type={showApiToken ? "text" : "password"}
                    placeholder="wlp_xxxxxxxxxxxx"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiToken(!showApiToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showApiToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wlp-sync-interval">Intervalle de synchronisation (minutes)</Label>
              <Input
                id="wlp-sync-interval"
                type="number"
                min={5}
                max={1440}
                value={syncInterval}
                onChange={(e) => setSyncInterval(parseInt(e.target.value, 10) || 60)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestWlp}
                disabled={wlpTestStatus === "loading" || !apiEndpoint}
              >
                {wlpTestStatus === "loading" ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : (
                  <Wifi className="size-4 mr-1.5" />
                )}
                Tester la connexion
              </Button>
              <Button size="sm" onClick={handleSaveWlp} disabled={isSaving}>
                {isSaving && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                {wlpConfig ? "Enregistrer" : "Activer WinLeadPlus"}
              </Button>
            </div>
            {renderTestResult(wlpTestStatus, wlpTestMessage)}
          </div>
        </div>

        {/* ================================================================ */}
        {/* WooCommerce */}
        {/* ================================================================ */}
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <ShoppingCart className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">WooCommerce</span>
                  {wooConfig?.active ? (
                    <Badge variant="default" className="gap-1 text-xs">
                      <Wifi className="size-3" />
                      Connecté
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <WifiOff className="size-3" />
                      Déconnecté
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Synchronisation e-commerce et produits</p>
              </div>
            </div>
          </div>

          {wooConfig && (
            <>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">URL Boutique</span>
                  <span className="font-mono text-xs truncate max-w-[200px]">{wooConfig.storeUrl || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Consumer Key</span>
                  <span className="font-mono text-xs">
                    {wooConfig.consumerKey ? wooConfig.consumerKey.substring(0, 8) + "••••" : "—"}
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleGoToWooCommerce}>
              <ExternalLink className="size-4 mr-1.5" />
              {wooConfig ? "Gérer WooCommerce" : "Configurer"}
            </Button>
            {wooConfig && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestWoo}
                disabled={wooTestStatus === "loading"}
              >
                {wooTestStatus === "loading" ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : (
                  <Wifi className="size-4 mr-1.5" />
                )}
                Tester
              </Button>
            )}
          </div>
          {renderTestResult(wooTestStatus, wooTestMessage)}
        </div>

        {/* ================================================================ */}
        {/* Catalogue REST API */}
        {/* ================================================================ */}
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Package className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Catalogue REST API</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connecteur API REST pour importer des offres externes
                </p>
              </div>
            </div>
          </div>

          <Separator />

           <div className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="catalogue-api-url">URL de l&apos;API *</Label>
               <Input
                 id="catalogue-api-url"
                 type="url"
                 placeholder="https://api.example.com/products"
                 value={catalogueApiUrl}
                 onChange={(e) => setCatalogueApiUrl(e.target.value)}
               />
             </div>

              <div className="space-y-2">
                <Label htmlFor="catalogue-api-token">Token d&apos;authentification (optionnel — auto si vide)</Label>
                <div className="relative">
                  <Input
                    id="catalogue-api-token"
                    type={showCatalogueToken ? "text" : "password"}
                    placeholder="eyJhbGciOiJSUzI1NiIs..."
                    value={catalogueApiToken}
                    onChange={(e) => setCatalogueApiToken(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCatalogueToken(!showCatalogueToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCatalogueToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Laissez vide pour utiliser le token de votre session Keycloak</p>
              </div>

             <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestCatalogueApi}
                disabled={catalogueTestStatus === "loading" || !catalogueApiUrl}
              >
                {catalogueTestStatus === "loading" ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : (
                  <Wifi className="size-4 mr-1.5" />
                )}
                Tester la connexion
              </Button>
              <Button
                size="sm"
                onClick={handleImportCatalogue}
                disabled={catalogueImportStatus === "loading" || catalogueTestStatus !== "success" || !catalogueApiUrl}
              >
                {catalogueImportStatus === "loading" ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : null}
                Importer les produits
              </Button>
            </div>

            {catalogueTestStatus !== "idle" && (
              <div className="space-y-2">
                {renderTestResult(catalogueTestStatus, catalogueTestMessage)}
                {catalogueTestStatus === "success" && catalogueTestDetails.productCount > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">
                      {catalogueTestDetails.productCount} produits trouvés
                    </span>
                    {catalogueTestDetails.sampleCategories.map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {catalogueImportStatus !== "idle" && (
              <div className="space-y-2">
                {renderTestResult(catalogueImportStatus, catalogueImportMessage)}
                {catalogueImportStatus === "success" && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Importés</span>
                      <span className="font-semibold">{catalogueImportDetails.imported}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ignorés</span>
                      <span className="font-semibold">{catalogueImportDetails.skipped}</span>
                    </div>
                    {catalogueImportDetails.gammesCreated > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Gammes créées</span>
                        <span className="font-semibold">{catalogueImportDetails.gammesCreated}</span>
                      </div>
                    )}
                    {catalogueImportDetails.errors.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded text-xs">
                        <p className="font-semibold text-red-700 dark:text-red-300 mb-1">Erreurs ({catalogueImportDetails.errors.length})</p>
                        <ul className="space-y-1">
                          {catalogueImportDetails.errors.slice(0, 3).map((err) => (
                            <li key={`${err.productId}-${err.nom}`} className="text-red-600 dark:text-red-400">
                              {err.nom}: {err.error}
                            </li>
                          ))}
                          {catalogueImportDetails.errors.length > 3 && (
                            <li className="text-red-600 dark:text-red-400">
                              +{catalogueImportDetails.errors.length - 3} autres erreurs
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeSection, setActiveSection] = React.useState("profil")

  const renderContent = () => {
    switch (activeSection) {
      case "profil":
        return <ProfilSettings />
      case "notifications":
        return <NotificationsSettings />
      case "paiements":
        return <PaiementsSettings />
      case "securite":
        return <SecuriteSettings />
      case "roles-permissions":
        return <RolesPermissionsSettingsWrapper onOpenChange={onOpenChange} />
      case "marque-blanche":
        return <MarqueBlancheSettings onOpenChange={onOpenChange} />
      case "calendrier":
        return <CalendrierSettings onOpenChange={onOpenChange} />
      case "types-activites":
        return <TypesActivitesSettings onOpenChange={onOpenChange} />
      case "integrations":
        return <IntegrationsSettings onOpenChange={onOpenChange} />
      default:
        return <ProfilSettings />
    }
  }

  const activeItem = navItems.find((item) => item.id === activeSection)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[700px] md:max-w-[900px] lg:max-w-[1000px]">
        <DialogTitle className="sr-only">Paramètres</DialogTitle>
        <DialogDescription className="sr-only">
          Personnalisez vos paramètres ici.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex bg-background text-foreground">
            <SidebarContent>
              {/* Groupe Compte */}
              <SidebarGroup>
                <SidebarGroupLabel>Compte</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.filter(item => item.group === "compte").map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={item.id === activeSection}
                          onClick={() => setActiveSection(item.id)}
                        >
                          <item.icon />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarSeparator />

              {/* Groupe Organisation */}
              <SidebarGroup>
                <SidebarGroupLabel>Organisation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.filter(item => item.group === "organisation").map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={item.id === activeSection}
                          onClick={() => setActiveSection(item.id)}
                        >
                          <item.icon />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[640px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#" onClick={(e) => e.preventDefault()}>
                      Paramètres
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeItem?.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              {renderContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
