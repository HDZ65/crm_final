"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  UserPlus,
  FileText,
  Mail,
  Briefcase,
  CalendarPlus,
  Bell,
  Check,
  CheckCircle,
  AlertCircle,
  FileWarning,
  UserCheck,
  Clock,
  Info,
  AlertTriangle,
  Settings,
  ListTodo,
  Phone,
  Calendar,
  MoreHorizontal,
  Trash2,
  X,
  CheckCheck,
  Users,
  LogOut,
  Building2,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateContratDialog } from "@/components/create-contrat-dialog";
import { CreateClientDialog } from "@/components/create-client-dialog";
import { CreateCommercialDialog } from "@/components/commerciaux/create-commercial-dialog";
import { CreateSocieteDialog } from "@/components/create-societe-dialog";
import { useNotifications } from "@/contexts/notification-context";
import { NotificationType, type Notification } from "@/types/notification";
import { formatDistanceToNow, isPast, isToday, isTomorrow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { TacheDto, TacheType } from "@/types/tache";
import { TACHE_TYPE_LABELS, TACHE_PRIORITE_LABELS } from "@/types/tache";
import { toast } from "sonner";
import { useSocieteStore } from "@/stores/societe-store";
import { useOrganisation } from "@/contexts/organisation-context";
import { listMyTaches, marquerTacheTerminee } from "@/actions/taches";
import { listSocietesByOrganisation, type SocieteDto } from "@/actions/societes";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.CONTRAT_EXPIRE:
      return <AlertCircle className="size-4 text-destructive" />;
    case NotificationType.CONTRAT_BIENTOT_EXPIRE:
      return <Clock className="size-4 text-amber-500" />;
    case NotificationType.IMPAYE:
      return <AlertTriangle className="size-4 text-destructive" />;
    case NotificationType.NOUVEAU_CLIENT:
      return <UserCheck className="size-4 text-emerald-500" />;
    case NotificationType.NOUVEAU_CONTRAT:
      return <FileText className="size-4 text-blue-500" />;
    case NotificationType.TACHE_ASSIGNEE:
      return <UserPlus className="size-4 text-purple-500" />;
    case NotificationType.RAPPEL:
      return <Clock className="size-4 text-amber-500" />;
    case NotificationType.ALERTE:
      return <AlertTriangle className="size-4 text-amber-500" />;
    case NotificationType.INFO:
      return <Info className="size-4 text-blue-500" />;
    case NotificationType.SYSTEME:
      return <Settings className="size-4 text-muted-foreground" />;
    case NotificationType.INVITATION_RECEIVED:
      return <Mail className="size-4 text-blue-500" />;
    case NotificationType.MEMBER_JOINED:
      return <Users className="size-4 text-emerald-500" />;
    case NotificationType.MEMBER_LEFT:
      return <LogOut className="size-4 text-amber-500" />;
    default:
      return <Bell className="size-4" />;
  }
}

const TYPE_ICONS: Record<TacheType, React.ReactNode> = {
  APPEL: <Phone className="size-4" />,
  EMAIL: <Mail className="size-4" />,
  RDV: <Calendar className="size-4" />,
  RELANCE_IMPAYE: <FileText className="size-4" />,
  RELANCE_CONTRAT: <FileText className="size-4" />,
  RENOUVELLEMENT: <FileText className="size-4" />,
  SUIVI: <Clock className="size-4" />,
  AUTRE: <MoreHorizontal className="size-4" />,
}

function getTaskDateLabel(date: Date): string {
  if (isToday(date)) return "Aujourd'hui"
  if (isTomorrow(date)) return "Demain"
  if (isPast(date)) return "En retard"
  return format(date, "dd MMM", { locale: fr })
}

function TacheDropdownItem({
  tache,
  onComplete,
}: {
  tache: TacheDto;
  onComplete: (id: string) => void;
}) {
  const date = new Date(tache.dateEcheance);
  const isLate = tache.statut !== "TERMINEE" && tache.statut !== "ANNULEE" && isPast(date);
  const isDueToday = isToday(date);

  return (
    <DropdownMenuItem
      className={cn(
        "flex items-start gap-2 py-2.5 cursor-pointer",
        isLate && "bg-destructive/5"
      )}
      onSelect={(e) => e.preventDefault()}
    >
      <div className={cn("p-1.5 rounded-full mt-0.5", isLate ? "bg-destructive/10 text-destructive" : "bg-muted")}>
        {TYPE_ICONS[tache.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm truncate", isLate && "text-destructive")}>
          {tache.titre}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{TACHE_TYPE_LABELS[tache.type]}</span>
          <span>•</span>
          <span className={cn(isLate ? "text-destructive font-medium" : isDueToday ? "text-orange-600 font-medium" : "")}>
            {getTaskDateLabel(date)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge
          variant={tache.priorite === "HAUTE" ? "destructive" : tache.priorite === "MOYENNE" ? "default" : "secondary"}
          className="text-[10px] px-1.5 h-5"
        >
          {TACHE_PRIORITE_LABELS[tache.priorite]}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onComplete(tache.id);
          }}
        >
          <CheckCircle className="h-3.5 w-3.5" />
        </Button>
      </div>
    </DropdownMenuItem>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  const handleClick = () => {
    // Marquer comme lu si non lu
    if (!notification.lu) {
      onMarkAsRead(notification.id);
    }

    // Naviguer vers le lien si disponible
    if (notification.lienUrl) {
      router.push(notification.lienUrl);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(notification.id);
  };

  return (
    <DropdownMenuItem
      className={cn(
        "flex-col items-start gap-1 py-3 cursor-pointer group",
        !notification.lu && "bg-muted/50"
      )}
      onClick={handleClick}
      onSelect={(e) => e.preventDefault()}
    >
      <div className="flex w-full items-start gap-2">
        <div className="mt-0.5 shrink-0">{getNotificationIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex w-full items-start justify-between gap-2">
            <span className={cn("font-medium truncate", !notification.lu && "text-foreground")}>
              {notification.titre}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <X className="size-3" />
              </Button>
            </div>
          </div>
          <span className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </span>
        </div>
        {!notification.lu && (
          <div className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
        )}
      </div>
    </DropdownMenuItem>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [createContratOpen, setCreateContratOpen] = useState(false);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [createCommercialOpen, setCreateCommercialOpen] = useState(false);
  const [createSocieteOpen, setCreateSocieteOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();

  // Société (multi-tenant context)
  const { activeOrganisation, utilisateur } = useOrganisation();
  const [societes, setSocietes] = React.useState<SocieteDto[]>([]);
  const [societesLoading, setSocietesLoading] = React.useState(false);
  const activeSocieteId = useSocieteStore((state) => state.activeSocieteId);
  const setActiveSociete = useSocieteStore((state) => state.setActiveSociete);

  // Fetch societes
  React.useEffect(() => {
    if (!activeOrganisation?.organisationId) {
      setSocietes([]);
      return;
    }
    setSocietesLoading(true);
    listSocietesByOrganisation(activeOrganisation.organisationId).then((result) => {
      if (result.data) {
        setSocietes(result.data);
      }
      setSocietesLoading(false);
    });
  }, [activeOrganisation?.organisationId]);

  const activeSociete = useMemo(() => {
    if (!activeSocieteId) return null;
    return societes.find((s) => s.id === activeSocieteId) || null;
  }, [activeSocieteId, societes]);

  // Tâches - filtrées par l'utilisateur connecté
  const [taches, setTaches] = React.useState<TacheDto[]>([]);
  const [tachesLoading, setTachesLoading] = React.useState(false);

  const fetchTaches = React.useCallback(async () => {
    if (!utilisateur?.id) return;
    setTachesLoading(true);
    const result = await listMyTaches(utilisateur.id, "semaine");
    if (result.data) {
      setTaches(result.data);
    }
    setTachesLoading(false);
  }, [utilisateur?.id]);

  React.useEffect(() => {
    fetchTaches();
  }, [fetchTaches]);

  const handleCompleteTache = async (id: string) => {
    const result = await marquerTacheTerminee(id);
    if (result.data) {
      toast.success("Tâche terminée");
      fetchTaches();
    } else {
      toast.error(result.error || "Erreur lors de la complétion");
    }
  };

  const sortedTaches = useMemo(() => {
    const priorityOrder = { HAUTE: 0, MOYENNE: 1, BASSE: 2 };
    return [...taches]
      .filter((t) => t.statut === "A_FAIRE" || t.statut === "EN_COURS")
      .sort((a, b) => {
        const aLate = isPast(new Date(a.dateEcheance)) ? 0 : 1;
        const bLate = isPast(new Date(b.dateEcheance)) ? 0 : 1;
        if (aLate !== bLate) return aLate - bLate;
        const aPriority = priorityOrder[a.priorite];
        const bPriority = priorityOrder[b.priorite];
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime();
      })
      .slice(0, 5);
  }, [taches]);

  const lateCount = taches.filter(
    (t) => (t.statut === "A_FAIRE" || t.statut === "EN_COURS") && isPast(new Date(t.dateEcheance))
  ).length;

  const pendingCount = taches.filter(
    (t) => t.statut === "A_FAIRE" || t.statut === "EN_COURS"
  ).length;

  const title = (() => {
    if (!pathname) return "";
    if (pathname === "/") return "Tableau de Bord";
    if (pathname.startsWith("/clients/")) return "Fiche Client";
    if (pathname === "/clients") return "Gestion Clients";
    if (pathname === "/commerciaux") return "Gestion Commerciaux";
    if (pathname === "/catalogue") return "Catalogue Produits";
    if (pathname === "/expeditions") return "Expéditions";
    if (pathname === "/commissions") return "Commissions";
    if (pathname === "/facturation") return "Facturation";
    if (pathname === "/statistiques") return "Statistiques";
    if (pathname === "/paiements") return "Gestion des Paiements";
    if (pathname === "/contrats") return "Gestion Contrats";
    return "";
  })();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{title}</h1>

        {/* Sélecteur de société (multi-tenant) */}
        {activeOrganisation && (
          <>
            <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 h-9 px-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-medium shadow-sm"
                >
                  <Building2 className="size-4" />
                  <span className="max-w-40 truncate">
                    {societesLoading ? "..." : activeSociete?.raisonSociale || "Toutes les sociétés"}
                  </span>
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Filtrer par société</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setActiveSociete(null)}
                  className={cn(!activeSocieteId && "bg-accent")}
                >
                  <Building2 className="mr-2 size-4" />
                  Toutes les sociétés
                  {!activeSocieteId && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {societes.map((societe) => (
                  <DropdownMenuItem
                    key={societe.id}
                    onSelect={() => setActiveSociete(societe.id)}
                    className={cn(activeSocieteId === societe.id && "bg-accent")}
                  >
                    <Building2 className="mr-2 size-4" />
                    <span className="truncate">{societe.raisonSociale}</span>
                    {activeSocieteId === societe.id && <Check className="ml-auto size-4" />}
                  </DropdownMenuItem>
                ))}
                {societes.length === 0 && !societesLoading && (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    Aucune société
                  </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setCreateSocieteOpen(true)}
                  className="text-primary"
                >
                  <Plus className="mr-2 size-4" />
                  Créer une société
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Dropdown Tâches */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <ListTodo className="size-4" />
                {pendingCount > 0 && (
                  <Badge
                    variant={lateCount > 0 ? "destructive" : "default"}
                    className="absolute -right-1.5 -top-1.5 h-4 min-w-4 flex items-center justify-center px-1 text-[9px] rounded-full"
                  >
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
              <div className="flex items-center justify-between px-2">
                <DropdownMenuLabel className="flex items-center gap-2">
                  Mes tâches
                  {lateCount > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1 text-[10px] h-5">
                      <AlertTriangle className="h-3 w-3" />
                      {lateCount} en retard
                    </Badge>
                  )}
                </DropdownMenuLabel>
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[400px] overflow-y-auto">
                {sortedTaches.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <CheckCircle className="mx-auto size-8 mb-2 opacity-50" />
                    <p className="text-sm">Aucune tâche en attente</p>
                    <p className="text-xs">Vous êtes à jour !</p>
                  </div>
                ) : (
                  sortedTaches.map((tache) => (
                    <TacheDropdownItem
                      key={tache.id}
                      tache={tache}
                      onComplete={handleCompleteTache}
                    />
                  ))
                )}
              </div>
              {sortedTaches.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="justify-center text-sm text-primary cursor-pointer">
                    <Link href="/taches">Voir toutes les tâches</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dropdown Notifications */}
          <DropdownMenu onOpenChange={(open) => {
            if (open && unreadCount > 0) {
              markAllAsRead();
            }
          }}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1.5 -top-1.5 h-4 min-w-4 flex items-center justify-center px-1 text-[9px] rounded-full"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
              <div className="flex items-center justify-between px-2">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        markAllAsRead();
                      }}
                    >
                      <Check className="mr-1 size-3" />
                      Tout lire
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        deleteAllNotifications();
                      }}
                    >
                      <Trash2 className="mr-1 size-3" />
                      Tout supprimer
                    </Button>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Bell className="mx-auto size-8 mb-2 opacity-50" />
                    <p className="text-sm">Aucune notification</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-sm text-primary cursor-pointer">
                    Voir toutes les notifications
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="icon">
                <Plus className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Actions rapides</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setCreateClientOpen(true)}>
                  <UserPlus className="mr-2 size-4" />
                  <span>Nouveau client</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setCreateCommercialOpen(true)}>
                  <Briefcase className="mr-2 size-4" />
                  <span>Nouveau commercial</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setCreateContratOpen(true)}>
                  <FileText className="mr-2 size-4" />
                  <span>Nouveau contrat</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Mail className="mr-2 size-4" />
                  <span>Envoyer un email</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CalendarPlus className="mr-2 size-4" />
                  <span>Créer un événement</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Dialog création de contrat */}
      <CreateContratDialog
        open={createContratOpen}
        onOpenChange={setCreateContratOpen}
      />

      {/* Dialog création de client */}
      <CreateClientDialog
        open={createClientOpen}
        onOpenChange={setCreateClientOpen}
      />

      {/* Dialog création de commercial */}
      <CreateCommercialDialog
        open={createCommercialOpen}
        onOpenChange={setCreateCommercialOpen}
      />

      {/* Dialog création de société */}
      <CreateSocieteDialog
        open={createSocieteOpen}
        onOpenChange={setCreateSocieteOpen}
        organisationId={activeOrganisation?.organisationId || ""}
        onSuccess={() => {
          // Refresh societes list
          if (activeOrganisation?.organisationId) {
            listSocietesByOrganisation(activeOrganisation.organisationId).then((result) => {
              if (result.data) {
                setSocietes(result.data);
              }
            });
          }
        }}
      />
    </header>
  );
}
