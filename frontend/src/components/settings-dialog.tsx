"use client";

import {
  AlertCircle,
  Bell,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { RolesPermissionsSettings } from "@/components/settings/roles-permissions-settings";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";

const navItems = [
  // Groupe Compte
  { id: "profil", name: "Profil", icon: User, group: "compte" },
  { id: "notifications", name: "Notifications", icon: Bell, group: "compte" },
  { id: "securite", name: "Sécurité", icon: Shield, group: "compte" },
  // Groupe Organisation

  {
    id: "roles-permissions",
    name: "Rôles & Permissions",
    icon: ShieldCheck,
    group: "organisation",
  },
];

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
          <Input
            id="email"
            type="email"
            placeholder="votre@email.com"
            disabled
          />
          <p className="text-xs text-muted-foreground">
            L&apos;email ne peut pas être modifié.
          </p>
        </div>
      </div>
    </div>
  );
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
  );
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
  );
}

function AdminSectionLink({
  title,
  description,
  path,
  onOpenChange,
}: {
  title: string;
  description: string;
  path: string;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(path);
    onOpenChange(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
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
  );
}

function RolesPermissionsSettingsWrapper({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  return <RolesPermissionsSettings onOpenChange={onOpenChange} />;
}


export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeSection, setActiveSection] = React.useState("profil");

  const renderContent = () => {
    switch (activeSection) {
      case "profil":
        return <ProfilSettings />;
      case "notifications":
        return <NotificationsSettings />;

      case "securite":
        return <SecuriteSettings />;
      case "roles-permissions":
        return <RolesPermissionsSettingsWrapper onOpenChange={onOpenChange} />;
      default:
        return <ProfilSettings />;
    }
  };

  const activeItem = navItems.find((item) => item.id === activeSection);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[700px] md:max-w-[900px] lg:max-w-[1000px]">
        <DialogTitle className="sr-only">Paramètres</DialogTitle>
        <DialogDescription className="sr-only">
          Personnalisez vos paramètres ici.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar
            collapsible="none"
            className="hidden md:flex bg-background text-foreground"
          >
            <SidebarContent>
              {/* Groupe Compte */}
              <SidebarGroup>
                <SidebarGroupLabel>Compte</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems
                      .filter((item) => item.group === "compte")
                      .map((item) => (
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
                    {navItems
                      .filter((item) => item.group === "organisation")
                      .map((item) => (
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
                    <BreadcrumbLink
                      href="#"
                      onClick={(e) => e.preventDefault()}
                    >
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
  );
}
