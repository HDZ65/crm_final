"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  AlertCircle,
  FileText,
  UserPlus,
  UserCheck,
  Clock,
  Info,
  AlertTriangle,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useNotifications } from "@/contexts/notification-context";
import { NotificationType, type Notification } from "@proto/notifications/notifications";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.NOTIFICATION_TYPE_CONTRAT_EXPIRE:
      return <AlertCircle className="size-4 text-destructive" />;
    case NotificationType.NOTIFICATION_TYPE_CONTRAT_BIENTOT_EXPIRE:
      return <Clock className="size-4 text-amber-500" />;
    case NotificationType.NOTIFICATION_TYPE_IMPAYE:
      return <AlertTriangle className="size-4 text-destructive" />;
    case NotificationType.NOTIFICATION_TYPE_NOUVEAU_CLIENT:
      return <UserCheck className="size-4 text-emerald-500" />;
    case NotificationType.NOTIFICATION_TYPE_NOUVEAU_CONTRAT:
      return <FileText className="size-4 text-blue-500" />;
    case NotificationType.NOTIFICATION_TYPE_TACHE_ASSIGNEE:
      return <UserPlus className="size-4 text-purple-500" />;
    case NotificationType.NOTIFICATION_TYPE_RAPPEL:
      return <Clock className="size-4 text-amber-500" />;
    case NotificationType.NOTIFICATION_TYPE_ALERTE:
      return <AlertTriangle className="size-4 text-amber-500" />;
    case NotificationType.NOTIFICATION_TYPE_INFO:
      return <Info className="size-4 text-blue-500" />;
    case NotificationType.NOTIFICATION_TYPE_SYSTEME:
      return <Settings className="size-4 text-muted-foreground" />;
    default:
      return <Bell className="size-4" />;
  }
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

export function HeaderNotificationsDropdown() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();

  return (
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
  );
}
