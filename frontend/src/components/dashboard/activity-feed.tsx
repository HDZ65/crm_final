"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/contexts/notification-context";
import {
  UserPlus,
  FileText,
  Clock,
  AlertTriangle,
  Bell,
  WifiOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AskAiCardButton } from "@/components/dashboard/ask-ai-card-button";

// Icon mapping by notification type
const getIconByType = (type: string | number | undefined) => {
  const typeStr = String(type);
  switch (typeStr) {
    case "client:new":
    case "4": // NOTIFICATION_TYPE_NOUVEAU_CLIENT
      return { icon: UserPlus, color: "text-green-600 bg-green-100 dark:bg-green-900/30" };
    case "contrat:new":
    case "5": // NOTIFICATION_TYPE_NOUVEAU_CONTRAT
      return { icon: FileText, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" };
    case "contrat:expiring-soon":
    case "2": // NOTIFICATION_TYPE_CONTRAT_BIENTOT_EXPIRE
      return { icon: Clock, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" };
    case "client:impaye":
    case "3": // NOTIFICATION_TYPE_IMPAYE
      return { icon: AlertTriangle, color: "text-red-600 bg-red-100 dark:bg-red-900/30" };
    default:
      return { icon: Bell, color: "text-gray-600 bg-gray-100 dark:bg-gray-800" };
  }
};

// Format notification message based on type
const formatNotificationMessage = (notification: any): string => {
  const metadata = notification.metadata || {};
  
  switch (notification.type) {
    case "client:new":
      return `Nouveau client: ${metadata.clientName || "Un client"}`;
    case "contrat:new":
      return `Nouveau contrat signé: ${metadata.contractRef || "Contrat"}`;
    case "contrat:expiring-soon":
      return `Contrat expirant bientôt: ${metadata.contractRef || "Contrat"}`;
    case "client:impaye":
      return `Impayé détecté: ${metadata.clientName || "Client"} - ${metadata.amount || ""}`;
    case "notification:new":
      return notification.message || "Nouvelle notification";
    default:
      return notification.message || notification.titre || "Notification";
  }
};

export function ActivityFeed() {
  const {
    notifications,
    isLoading,
    isConnected,
    error,
  } = useNotifications();

  // Take only the last 10 notifications
  const recentNotifications = React.useMemo(() => {
    return notifications.slice(0, 10);
  }, [notifications]);

  const aiPrompt = `Analyse les notifications recentes CRM et propose les priorites de traitement. Notifications: ${recentNotifications
    .slice(0, 5)
    .map((notification) => formatNotificationMessage(notification))
    .join(" | ") || "Aucune notification recente"}.`;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Activité récente</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[200px] gap-2">
          <p className="text-sm text-muted-foreground text-center">
            Erreur de chargement des notifications
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg">Activité récente</CardTitle>
          <div className="flex items-center gap-1">
            <AskAiCardButton prompt={aiPrompt} title="Demander une analyse IA de l'activite recente" />
            {!isConnected && (
              <Badge variant="secondary" className="gap-1 text-amber-600">
                <WifiOff className="h-3 w-3" />
                Hors ligne
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recentNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] gap-2">
            <Bell className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground text-center">
              Aucune activité récente
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {recentNotifications.map((notification, index) => {
                const { icon: Icon, color } = getIconByType(notification.type);
                const message = formatNotificationMessage(notification);
                const timestamp = notification.createdAt
                  ? formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })
                  : "";

                return (
                  <div
                    key={notification.id || index}
                    className={cn(
                      "flex items-start gap-3 p-2 rounded-lg transition-colors",
                      "hover:bg-muted/50"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
                        color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">
                        {message}
                      </p>
                      {timestamp && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {timestamp}
                        </p>
                      )}
                    </div>
                    {notification.lienUrl && (
                      <Link
                        href={notification.lienUrl}
                        className="text-xs text-primary hover:underline shrink-0"
                      >
                        Voir →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {notifications.length > 10 && (
          <div className="mt-4 text-center">
            <Link
              href="/notifications"
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Voir toutes les notifications
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
