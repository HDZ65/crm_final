# Guide d'Implémentation — Tâches 1 & 5

> **Objectif** : Implémenter les 2 dernières tâches du plan `taches-ux-coherence`.
> Copier-coller les blocs de code ci-dessous en suivant les instructions pas-à-pas.

---

## TÂCHE 1 — Empty State, Error State, Skeleton Loading

**Fichier** : `frontend/src/app/(main)/taches/taches-page-client.tsx`

### Modification 1/4 — Ajouter les imports

Trouver ce bloc (lignes 28-29) :
```tsx
import { toast } from "sonner"
import type { Tache, TacheStats } from "@proto/activites/activites"
```

**Remplacer par** :
```tsx
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/ui/error-state"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import type { Tache, TacheStats } from "@proto/activites/activites"
```

---

### Modification 2/4 — Ajouter la variable d'état `error`

Trouver ce bloc (ligne 98) :
```tsx
  const [stats, setStats] = React.useState<TacheStats | null>(initialStats || null)
```

**Remplacer par** :
```tsx
  const [stats, setStats] = React.useState<TacheStats | null>(initialStats || null)
  const [error, setError] = React.useState<string | null>(null)
```

---

### Modification 3/4 — Capturer les erreurs dans fetchTaches()

Trouver ce bloc (lignes 156-161) :
```tsx
    if (result.data) {
      setTaches(result.data.data)
      setTotal(result.data.total)
      setTotalPages(result.data.totalPages)
    }
    setIsRefetching(false)
```

**Remplacer par** :
```tsx
    if (result.data) {
      setTaches(result.data.data)
      setTotal(result.data.total)
      setTotalPages(result.data.totalPages)
      setError(null)
    } else {
      setError(result.error || "Erreur lors du chargement des tâches")
    }
    setIsRefetching(false)
```

---

### Modification 4/4 — Remplacer le rendu "Chargement..." par Error/Empty/Skeleton

Trouver ce bloc (lignes 382-396) :
```tsx
          {/* Tableau */}
          <div className="flex-1 min-h-0 flex flex-col">
            {loading && taches.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : (
              <div className={`flex-1 min-h-0 transition-opacity duration-150 ${isRefetching ? "opacity-50 pointer-events-none" : ""}`}>
                <DataTable
                  columns={columns}
                  data={taches}
                  headerClassName="bg-sidebar hover:bg-sidebar"
                />
              </div>
            )}
```

**Remplacer par** :
```tsx
          {/* Tableau */}
          <div className="flex-1 min-h-0 flex flex-col">
            {error ? (
              <div className="flex items-center justify-center py-12">
                <ErrorState
                  status="network"
                  onRetry={() => {
                    setError(null)
                    setLoading(true)
                    Promise.all([fetchTaches(), fetchStats()]).finally(() => setLoading(false))
                  }}
                />
              </div>
            ) : loading && taches.length === 0 ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <div className="flex-1" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                ))}
              </div>
            ) : !loading && taches.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia>
                      <ListTodo className="h-10 w-10 text-muted-foreground" />
                    </EmptyMedia>
                    <EmptyTitle>Aucune tâche</EmptyTitle>
                  </EmptyHeader>
                  <EmptyContent>
                    <EmptyDescription>
                      {activeFilter === "a_faire"
                        ? "Aucune tâche à faire pour le moment."
                        : activeFilter === "en_cours"
                          ? "Aucune tâche en cours actuellement."
                          : activeFilter === "terminees"
                            ? "Aucune tâche terminée."
                            : activeFilter === "en_retard"
                              ? "Aucune tâche en retard."
                              : debouncedSearch
                                ? "Aucune tâche trouvée pour cette recherche."
                                : "Aucune tâche créée. Commencez par en créer une !"}
                    </EmptyDescription>
                    <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Créer votre première tâche
                    </Button>
                  </EmptyContent>
                </Empty>
              </div>
            ) : (
              <div className={`flex-1 min-h-0 transition-opacity duration-150 ${isRefetching ? "opacity-50 pointer-events-none" : ""}`}>
                <DataTable
                  columns={columns}
                  data={taches}
                  headerClassName="bg-sidebar hover:bg-sidebar"
                />
              </div>
            )}
```

### Vérification Tâche 1

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Aucune nouvelle erreur ne doit apparaître (les erreurs proto préexistantes sont OK).

---

## TÂCHE 5 — Onglet "Tâches" dans la fiche client

### Partie A — Créer le fichier `client-taches.tsx`

**Fichier à créer** : `frontend/src/components/client-detail/client-taches.tsx`

```tsx
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { listTachesByClient, marquerTacheTerminee } from "@/actions/taches"
import { CreateTacheDialog } from "@/app/(main)/taches/create-tache-dialog"
import {
  CheckCircle,
  Clock,
  Phone,
  Mail,
  Calendar,
  FileText,
  MoreHorizontal,
  Plus,
} from "lucide-react"
import { format, isPast, isToday, isTomorrow } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import type { Tache } from "@proto/activites/activites"
import type { TacheType, TachePriorite } from "@/lib/ui/labels/tache"
import { TACHE_TYPE_LABELS, TACHE_PRIORITE_LABELS } from "@/lib/ui/labels/tache"

const TYPE_ICONS: Record<TacheType, React.ReactNode> = {
  APPEL: <Phone className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  RDV: <Calendar className="h-4 w-4" />,
  RELANCE_IMPAYE: <FileText className="h-4 w-4" />,
  RELANCE_CONTRAT: <FileText className="h-4 w-4" />,
  RENOUVELLEMENT: <FileText className="h-4 w-4" />,
  SUIVI: <Clock className="h-4 w-4" />,
  AUTRE: <MoreHorizontal className="h-4 w-4" />,
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return "Aujourd'hui"
  if (isTomorrow(date)) return "Demain"
  if (isPast(date)) return "En retard"
  return format(date, "dd MMM", { locale: fr })
}

interface ClientTachesProps {
  clientId: string
}

export function ClientTaches({ clientId }: ClientTachesProps) {
  const [taches, setTaches] = React.useState<Tache[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    const result = await listTachesByClient(clientId)

    if (result.data) {
      setTaches(result.data.data)
    }
    setLoading(false)
  }, [clientId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleComplete = async (id: string) => {
    const result = await marquerTacheTerminee(id)
    if (result.data) {
      toast.success("Tâche terminée")
      fetchData()
    } else {
      toast.error(result.error || "Erreur lors de la complétion")
    }
  }

  if (loading) {
    return (
      <Card className="h-96">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // Filtrer les tâches actives (non terminées, non annulées) en premier
  const activeTaches = taches.filter(
    (t) => t.statut === "A_FAIRE" || t.statut === "EN_COURS"
  )
  const doneTaches = taches.filter(
    (t) => t.statut === "TERMINEE" || t.statut === "ANNULEE"
  )
  const sortedTaches = [...activeTaches, ...doneTaches]

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Tâches client</h3>
            <Badge variant="secondary">{taches.length}</Badge>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle tâche
          </Button>
        </CardHeader>
        <CardContent>
          {sortedTaches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Aucune tâche enregistrée pour ce client
              </p>
              <p className="text-sm text-muted-foreground">
                Créez une tâche pour commencer le suivi
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {sortedTaches.map((tache) => {
                  const date = new Date(tache.dateEcheance)
                  const isLate =
                    tache.statut !== "TERMINEE" &&
                    tache.statut !== "ANNULEE" &&
                    isPast(date)
                  const isDone =
                    tache.statut === "TERMINEE" || tache.statut === "ANNULEE"

                  return (
                    <div
                      key={tache.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isLate
                          ? "border-destructive bg-destructive/5"
                          : isDone
                            ? "opacity-50"
                            : "border-border"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          isLate
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted"
                        }`}
                      >
                        {TYPE_ICONS[tache.type as TacheType]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${
                            isLate
                              ? "text-destructive"
                              : isDone
                                ? "line-through"
                                : ""
                          }`}
                        >
                          {tache.titre}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {TACHE_TYPE_LABELS[tache.type as TacheType]}
                          </span>
                          <span>•</span>
                          <span
                            className={
                              isLate
                                ? "text-destructive font-medium"
                                : isToday(date)
                                  ? "text-orange-600 font-medium"
                                  : ""
                            }
                          >
                            {getDateLabel(date)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            tache.priorite === "HAUTE"
                              ? "destructive"
                              : tache.priorite === "MOYENNE"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {
                            TACHE_PRIORITE_LABELS[
                              tache.priorite as TachePriorite
                            ]
                          }
                        </Badge>
                        {!isDone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleComplete(tache.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <CreateTacheDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clientId={clientId}
        onSuccess={fetchData}
      />
    </>
  )
}
```

---

### Partie B — Ajouter l'onglet dans `client-detail-client.tsx`

**Fichier** : `frontend/src/app/(main)/clients/[id]/client-detail-client.tsx`

#### Modification 1/2 — Ajouter l'import

Trouver cette ligne (ligne 15) :
```tsx
import { ClientActivites } from "@/components/activites/client-activites"
```

**Remplacer par** :
```tsx
import { ClientActivites } from "@/components/activites/client-activites"
import { ClientTaches } from "@/components/client-detail/client-taches"
```

---

#### Modification 2/2 — Ajouter le TabsTrigger et TabsContent

Trouver ce bloc (lignes 408-411) :
```tsx
            <TabsTrigger value="activites">Activités</TabsTrigger>
            <TabsTrigger value="paiements">Paiements & Échéanciers</TabsTrigger>
            <TabsTrigger value="expeditions">Expéditions & Colis</TabsTrigger>
            <TabsTrigger value="documents">Documents (GED)</TabsTrigger>
```

**Remplacer par** :
```tsx
            <TabsTrigger value="activites">Activités</TabsTrigger>
            <TabsTrigger value="taches">Tâches</TabsTrigger>
            <TabsTrigger value="paiements">Paiements & Échéanciers</TabsTrigger>
            <TabsTrigger value="expeditions">Expéditions & Colis</TabsTrigger>
            <TabsTrigger value="documents">Documents (GED)</TabsTrigger>
```

Ensuite, trouver ce bloc (lignes 437-439) :
```tsx
<TabsContent value="activites" className="flex-1">
            <ClientActivites clientId={clientId} />
          </TabsContent>
```

**Remplacer par** :
```tsx
<TabsContent value="activites" className="flex-1">
            <ClientActivites clientId={clientId} />
          </TabsContent>

          <TabsContent value="taches" className="flex-1">
            <ClientTaches clientId={clientId} />
          </TabsContent>
```

---

### Vérification Tâche 5

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Vérifier que :
1. Le fichier `frontend/src/components/client-detail/client-taches.tsx` existe
2. Aucune nouvelle erreur TypeScript n'apparaît
3. L'import de `ClientTaches` est résolu correctement

---

## Vérification Finale

```bash
# Vérifier que tous les fichiers existent
ls frontend/src/components/ui/error-state.tsx
ls frontend/src/components/client-detail/client-taches.tsx

# Compilation TypeScript complète
cd frontend && npx tsc --noEmit

# Vérifier qu'il n'y a plus de "Chargement..." dans le rendu
grep -n "Chargement..." frontend/src/app/\(main\)/taches/taches-page-client.tsx
# Attendu: aucun résultat

# Vérifier que les imports sont présents
grep -n "ErrorState" frontend/src/app/\(main\)/taches/taches-page-client.tsx
grep -n "Skeleton" frontend/src/app/\(main\)/taches/taches-page-client.tsx
grep -n "ClientTaches" frontend/src/app/\(main\)/clients/\[id\]/client-detail-client.tsx
```

---

## Résumé des Fichiers Modifiés

| Fichier | Action | Tâche |
|---------|--------|-------|
| `frontend/src/app/(main)/taches/taches-page-client.tsx` | MODIFIER (4 blocs) | Tâche 1 |
| `frontend/src/components/client-detail/client-taches.tsx` | CRÉER | Tâche 5 |
| `frontend/src/app/(main)/clients/[id]/client-detail-client.tsx` | MODIFIER (2 blocs) | Tâche 5 |

---

## Messages de Commit

```bash
# Après Tâche 1
git add frontend/src/app/\(main\)/taches/taches-page-client.tsx
git commit -m "feat(taches): add empty state, error state and skeleton loading"

# Après Tâche 5
git add frontend/src/components/client-detail/client-taches.tsx frontend/src/app/\(main\)/clients/\[id\]/client-detail-client.tsx
git commit -m "feat(clients): add Tasks tab to client detail page"
```
