"use client";

import {
  AlertCircle,
  Bell,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  ListTree,
  Loader2,
  Lock,
  Package,
  Palette,
  Shield,
  ShieldCheck,
  ShoppingCart,
  User,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import {
  importCatalogueFromApi,
  testCatalogueApiConnection,
} from "@/actions/catalogue-api";
import {
  getWooCommerceConfigByOrganisation,
  testWooCommerceConnection,
} from "@/actions/woocommerce";
import { RolesPermissionsSettings } from "@/components/settings/roles-permissions-settings";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import { useOrganisation } from "@/contexts/organisation-context";
import type { WooCommerceConfig } from "@/proto/woocommerce/woocommerce";

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
  {
    id: "marque-blanche",
    name: "Marque Blanche",
    icon: Palette,
    group: "organisation",
  },
  {
    id: "types-activites",
    name: "Types d'activités",
    icon: ListTree,
    group: "organisation",
  },
  {
    id: "integrations",
    name: "Intégrations",
    icon: Zap,
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

function MarqueBlancheSettings({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AdminSectionLink
      title="Marque Blanche"
      description="Personnalisez l'apparence de votre plateforme."
      path="/parametres/marque-blanche"
      onOpenChange={onOpenChange}
    />
  );
}

function PermissionsSettings({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AdminSectionLink
      title="Permissions"
      description="Gérez les rôles et permissions des utilisateurs."
      path="/parametres/permissions"
      onOpenChange={onOpenChange}
    />
  );
}

function TypesActivitesSettings({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AdminSectionLink
      title="Types d'activités"
      description="Configurez les types d'activités disponibles."
      path="/parametres/types-activites"
      onOpenChange={onOpenChange}
    />
  );
}

function IntegrationsSettings({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { activeOrganisation, isOwner } = useOrganisation();
  const [isLoading, setIsLoading] = React.useState(true);

  // WooCommerce state
  const [wooConfig, setWooConfig] = React.useState<WooCommerceConfig | null>(
    null,
  );
  const [wooTestStatus, setWooTestStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [wooTestMessage, setWooTestMessage] = React.useState("");

  // Catalogue REST API state
  const [catalogueApiUrl, setCatalogueApiUrl] = React.useState("");
  const [catalogueApiToken, setCatalogueApiToken] = React.useState("");
  const [showCatalogueToken, setShowCatalogueToken] = React.useState(false);
  const [catalogueTestStatus, setCatalogueTestStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [catalogueTestMessage, setCatalogueTestMessage] = React.useState("");
  const [catalogueTestDetails, setCatalogueTestDetails] = React.useState<{
    productCount: number;
    sampleCategories: string[];
  }>({ productCount: 0, sampleCategories: [] });
  const [catalogueImportStatus, setCatalogueImportStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [catalogueImportMessage, setCatalogueImportMessage] =
    React.useState("");
  const [catalogueImportDetails, setCatalogueImportDetails] = React.useState<{
    imported: number;
    skipped: number;
    errors: Array<{ productId: string | number; nom: string; error: string }>;
    gammesCreated: number;
  }>({ imported: 0, skipped: 0, errors: [], gammesCreated: 0 });

  // Load WooCommerce config
  React.useEffect(() => {
    if (!activeOrganisation?.organisationId) return;

    setIsLoading(true);
    getWooCommerceConfigByOrganisation(activeOrganisation.organisationId)
      .then((result) => {
        if (result.data) {
          setWooConfig(result.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, [activeOrganisation?.organisationId]);

  if (!activeOrganisation) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <p>Sélectionnez une organisation pour configurer les intégrations</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock className="h-4 w-4" />
        <p>Accès réservé aux administrateurs de l&apos;organisation</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        <p>Chargement des intégrations…</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // WooCommerce handlers
  // ---------------------------------------------------------------------------

  const handleTestWoo = async () => {
    setWooTestStatus("loading");
    const { data, error } = await testWooCommerceConnection(
      activeOrganisation.organisationId,
    );
    if (error || !data?.success) {
      setWooTestStatus("error");
      setWooTestMessage(error || data?.message || "Échec de la connexion");
    } else {
      setWooTestStatus("success");
      setWooTestMessage(data.message || "Connexion réussie");
    }
  };

  const handleGoToWooCommerce = () => {
    router.push("/integrations/woocommerce");
    onOpenChange(false);
  };

  // ---------------------------------------------------------------------------
  // Catalogue REST API handlers
  // ---------------------------------------------------------------------------

  const handleTestCatalogueApi = async () => {
    if (!catalogueApiUrl) {
      toast.error("Veuillez saisir l'URL de l'API");
      return;
    }
    setCatalogueTestStatus("loading");
    const { data, error } = await testCatalogueApiConnection(
      catalogueApiUrl,
      catalogueApiToken || undefined,
    );
    if (error || !data?.success) {
      setCatalogueTestStatus("error");
      setCatalogueTestMessage(
        error || data?.message || "Échec de la connexion",
      );
    } else {
      setCatalogueTestStatus("success");
      setCatalogueTestMessage(data.message || "Connexion réussie");
      setCatalogueTestDetails({
        productCount: data.productCount,
        sampleCategories: data.sampleCategories,
      });
    }
  };

  const handleImportCatalogue = async () => {
    if (!catalogueApiUrl) {
      toast.error("Veuillez saisir l'URL de l'API");
      return;
    }
    setCatalogueImportStatus("loading");
    const { data, error } = await importCatalogueFromApi({
      organisationId: activeOrganisation.organisationId,
      apiUrl: catalogueApiUrl,
      authToken: catalogueApiToken || undefined,
    });
    if (error || !data) {
      setCatalogueImportStatus("error");
      setCatalogueImportMessage(error || "Échec de l'import");
    } else {
      setCatalogueImportStatus("success");
      setCatalogueImportMessage(`${data.imported} produit(s) importé(s)`);
      setCatalogueImportDetails({
        imported: data.imported,
        skipped: data.skipped,
        errors: data.errors,
        gammesCreated: data.gammesCreated,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Render helper — test result badge
  // ---------------------------------------------------------------------------

  const renderTestResult = (
    status: "idle" | "loading" | "success" | "error",
    message: string,
  ) => {
    if (status === "loading") {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Test en cours…
        </span>
      );
    }
    if (status === "success") {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
          <Check className="size-3.5" />
          {message}
        </span>
      );
    }
    if (status === "error") {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <X className="size-3.5" />
          {message}
        </span>
      );
    }
    return null;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Intégrations Externes</h3>
          <p className="text-sm text-muted-foreground">
            Configurez les accès aux catalogues de produits et services
            externes.
          </p>
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
                <p className="text-sm text-muted-foreground">
                  Synchronisation e-commerce et produits
                </p>
              </div>
            </div>
          </div>

          {wooConfig && (
            <>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">URL Boutique</span>
                  <span className="font-mono text-xs truncate max-w-[200px]">
                    {wooConfig.storeUrl || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Consumer Key</span>
                  <span className="font-mono text-xs">
                    {wooConfig.consumerKey
                      ? wooConfig.consumerKey.substring(0, 8) + "••••"
                      : "—"}
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
              <Label htmlFor="catalogue-api-token">
                Token d&apos;authentification (optionnel — auto si vide)
              </Label>
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
                  {showCatalogueToken ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Laissez vide pour utiliser le token de votre session Keycloak
              </p>
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
                disabled={
                  catalogueImportStatus === "loading" ||
                  catalogueTestStatus !== "success" ||
                  !catalogueApiUrl
                }
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
                {catalogueTestStatus === "success" &&
                  catalogueTestDetails.productCount > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">
                        {catalogueTestDetails.productCount} produits trouvés
                      </span>
                      {catalogueTestDetails.sampleCategories.map((cat) => (
                        <Badge
                          key={cat}
                          variant="secondary"
                          className="text-xs"
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {catalogueImportStatus !== "idle" && (
              <div className="space-y-2">
                {renderTestResult(
                  catalogueImportStatus,
                  catalogueImportMessage,
                )}
                {catalogueImportStatus === "success" && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Importés</span>
                      <span className="font-semibold">
                        {catalogueImportDetails.imported}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ignorés</span>
                      <span className="font-semibold">
                        {catalogueImportDetails.skipped}
                      </span>
                    </div>
                    {catalogueImportDetails.gammesCreated > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Gammes créées
                        </span>
                        <span className="font-semibold">
                          {catalogueImportDetails.gammesCreated}
                        </span>
                      </div>
                    )}
                    {catalogueImportDetails.errors.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded text-xs">
                        <p className="font-semibold text-red-700 dark:text-red-300 mb-1">
                          Erreurs ({catalogueImportDetails.errors.length})
                        </p>
                        <ul className="space-y-1">
                          {catalogueImportDetails.errors
                            .slice(0, 3)
                            .map((err) => (
                              <li
                                key={`${err.productId}-${err.nom}`}
                                className="text-red-600 dark:text-red-400"
                              >
                                {err.nom}: {err.error}
                              </li>
                            ))}
                          {catalogueImportDetails.errors.length > 3 && (
                            <li className="text-red-600 dark:text-red-400">
                              +{catalogueImportDetails.errors.length - 3} autres
                              erreurs
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
  );
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
      case "marque-blanche":
        return <MarqueBlancheSettings onOpenChange={onOpenChange} />;
      case "permissions":
        return <PermissionsSettings onOpenChange={onOpenChange} />;
      case "types-activites":
        return <TypesActivitesSettings onOpenChange={onOpenChange} />;
      case "integrations":
        return <IntegrationsSettings onOpenChange={onOpenChange} />;
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
