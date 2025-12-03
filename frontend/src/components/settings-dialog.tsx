"use client"

import * as React from "react"
import {
  Bell,
  Globe,
  Lock,
  Paintbrush,
  Settings,
  User,
  Shield,
  Database,
} from "lucide-react"

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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
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
  { id: "profil", name: "Profil", icon: User },
  { id: "notifications", name: "Notifications", icon: Bell },
  { id: "apparence", name: "Apparence", icon: Paintbrush },
  { id: "langue", name: "Langue et région", icon: Globe },
  { id: "securite", name: "Sécurité", icon: Shield },
  { id: "confidentialite", name: "Confidentialité", icon: Lock },
  { id: "donnees", name: "Données", icon: Database },
  { id: "avance", name: "Avancé", icon: Settings },
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

function ApparenceSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Apparence</h3>
        <p className="text-sm text-muted-foreground">
          Personnalisez l&apos;apparence de l&apos;application.
        </p>
      </div>
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label>Thème</Label>
          <Select defaultValue="system">
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un thème" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Clair</SelectItem>
              <SelectItem value="dark">Sombre</SelectItem>
              <SelectItem value="system">Système</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Animations</Label>
            <p className="text-sm text-muted-foreground">
              Activer les animations de l&apos;interface.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Sidebar compacte</Label>
            <p className="text-sm text-muted-foreground">
              Réduire la taille de la sidebar.
            </p>
          </div>
          <Switch />
        </div>
      </div>
    </div>
  )
}

function LangueSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Langue et région</h3>
        <p className="text-sm text-muted-foreground">
          Configurez vos préférences régionales.
        </p>
      </div>
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label>Langue</Label>
          <Select defaultValue="fr">
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une langue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Fuseau horaire</Label>
          <Select defaultValue="europe-paris">
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un fuseau horaire" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="europe-paris">Europe/Paris (UTC+1)</SelectItem>
              <SelectItem value="europe-london">Europe/London (UTC+0)</SelectItem>
              <SelectItem value="america-new_york">America/New_York (UTC-5)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Format de date</Label>
          <Select defaultValue="dd-mm-yyyy">
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
              <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
              <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
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

function ConfidentialiteSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Confidentialité</h3>
        <p className="text-sm text-muted-foreground">
          Gérez vos paramètres de confidentialité.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Profil public</Label>
            <p className="text-sm text-muted-foreground">
              Rendre votre profil visible aux autres utilisateurs.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Statut en ligne</Label>
            <p className="text-sm text-muted-foreground">
              Afficher quand vous êtes en ligne.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Historique d&apos;activité</Label>
            <p className="text-sm text-muted-foreground">
              Enregistrer votre historique d&apos;activité.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>
    </div>
  )
}

function DonneesSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Données</h3>
        <p className="text-sm text-muted-foreground">
          Gérez vos données personnelles.
        </p>
      </div>
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label>Exporter mes données</Label>
          <p className="text-sm text-muted-foreground">
            Télécharger une copie de toutes vos données.
          </p>
          <Button variant="outline" className="w-fit">
            Exporter
          </Button>
        </div>
        <div className="grid gap-2">
          <Label>Supprimer le compte</Label>
          <p className="text-sm text-muted-foreground">
            Supprimer définitivement votre compte et toutes vos données.
          </p>
          <Button variant="destructive" className="w-fit">
            Supprimer mon compte
          </Button>
        </div>
      </div>
    </div>
  )
}

function AvanceSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Avancé</h3>
        <p className="text-sm text-muted-foreground">
          Paramètres avancés de l&apos;application.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Mode développeur</Label>
            <p className="text-sm text-muted-foreground">
              Activer les fonctionnalités de développement.
            </p>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Logs de débogage</Label>
            <p className="text-sm text-muted-foreground">
              Activer les logs détaillés pour le débogage.
            </p>
          </div>
          <Switch />
        </div>
        <div className="grid gap-2">
          <Label>Vider le cache</Label>
          <p className="text-sm text-muted-foreground">
            Supprimer les données en cache de l&apos;application.
          </p>
          <Button variant="outline" className="w-fit">
            Vider le cache
          </Button>
        </div>
      </div>
    </div>
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
      case "apparence":
        return <ApparenceSettings />
      case "langue":
        return <LangueSettings />
      case "securite":
        return <SecuriteSettings />
      case "confidentialite":
        return <ConfidentialiteSettings />
      case "donnees":
        return <DonneesSettings />
      case "avance":
        return <AvanceSettings />
      default:
        return <ProfilSettings />
    }
  }

  const activeItem = navItems.find((item) => item.id === activeSection)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Paramètres</DialogTitle>
        <DialogDescription className="sr-only">
          Personnalisez vos paramètres ici.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex bg-background text-foreground">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent >
                  <SidebarMenu >
                    {navItems.map((item) => (
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
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
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
