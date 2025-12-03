"use client";

import { useState } from "react";
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
  AlertCircle,
  FileWarning,
  UserCheck,
  Clock,
  Info,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateContratDialog } from "@/components/create-contrat-dialog";
import { CreateClientDialog } from "@/components/create-client-dialog";
import { useNotifications } from "@/contexts/notification-context";
import { NotificationType, type Notification } from "@/types/notification";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
    default:
      return <Bell className="size-4" />;
  }
}

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <DropdownMenuItem
      className={cn(
        "flex-col items-start gap-1 py-3 cursor-pointer",
        !notification.lue && "bg-muted/50"
      )}
      onClick={() => {
        if (!notification.lue) {
          onMarkAsRead(notification.id);
        }
      }}
    >
      <div className="flex w-full items-start gap-2">
        <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex w-full items-start justify-between gap-2">
            <span className={cn("font-medium truncate", !notification.lue && "text-foreground")}>
              {notification.titre}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
          </div>
          <span className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </span>
        </div>
        {!notification.lue && (
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
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const title = (() => {
    if (!pathname) return "";
    if (pathname === "/") return "Tableau de Bord";
    if (pathname.startsWith("/clients/")) return "Fiche Client";
    if (pathname === "/clients") return "Gestion Clients";
    if (pathname === "/commerciaux") return "Gestion Commerciaux";
    if (pathname === "/catalogue") return "Catalogue Produits";
    if (pathname === "/expeditions") return "Expéditions";
    if (pathname === "/commissions") return "Commissions";
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
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
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
                    Tout marquer comme lu
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[400px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-2">
                        <Skeleton className="size-4 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
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
                <DropdownMenuItem>
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
    </header>
  );
}
