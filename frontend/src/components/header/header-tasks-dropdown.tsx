"use client";

import * as React from "react";
import { useMemo } from "react";
import Link from "next/link";
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
  ListTodo,
  Phone,
  Mail,
  Calendar,
  FileText,
  Clock,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isPast, isToday, isTomorrow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useOrganisation } from "@/contexts/organisation-context";
import { listMyTaches, marquerTacheTerminee } from "@/actions/taches";
import type { Tache } from "@proto/activites/activites";
import type { TacheType } from "@/lib/ui/labels/tache";
import { TACHE_TYPE_LABELS, TACHE_PRIORITE_LABELS } from "@/lib/ui/labels/tache";

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
  tache: Tache;
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
        {TYPE_ICONS[tache.type as TacheType]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm truncate", isLate && "text-destructive")}>
          {tache.titre}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{TACHE_TYPE_LABELS[tache.type as TacheType]}</span>
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
          {TACHE_PRIORITE_LABELS[tache.priorite as import("@/lib/ui/labels/tache").TachePriorite]}
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

export function HeaderTasksDropdown() {
  const { utilisateur } = useOrganisation();

  // Tâches - filtrées par l'utilisateur connecté
  const [taches, setTaches] = React.useState<Tache[]>([]);
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
    const priorityOrder: Record<string, number> = { HAUTE: 0, MOYENNE: 1, BASSE: 2 };
    return [...taches]
      .filter((t) => t.statut === "A_FAIRE" || t.statut === "EN_COURS")
      .sort((a, b) => {
        const aLate = isPast(new Date(a.dateEcheance)) ? 0 : 1;
        const bLate = isPast(new Date(b.dateEcheance)) ? 0 : 1;
        if (aLate !== bLate) return aLate - bLate;
        const aPriority = priorityOrder[a.priorite] ?? 1;
        const bPriority = priorityOrder[b.priorite] ?? 1;
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

  return (
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
  );
}
