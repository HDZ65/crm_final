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
} from "lucide-react"
import { usePspAccounts, PspType } from "@/hooks/use-psp-accounts"
import { useOrganisation } from "@/contexts/organisation-context"
import { useSocietes } from "@/hooks/clients"
import { RolesPermissionsSettings } from "@/components/settings/roles-permissions-settings"

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
          value={selectedSocieteId || ""}
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

function IntegrationsSettings({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  return (
    <AdminSectionLink
      title="Intégrations"
      description="Gérez les intégrations externes."
      path="/integrations/woocommerce"
      onOpenChange={onOpenChange}
    />
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
