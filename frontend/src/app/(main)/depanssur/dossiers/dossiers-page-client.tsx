'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listDossiersAction } from '@/actions/depanssur';
import { DataTable } from '@/components/data-table-basic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Plus, Search, FileText, RefreshCw, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

const getStatutColor = (statut: string) => {
  const colors: Record<string, string> = {
    ENREGISTRE: 'bg-blue-500',
    EN_ANALYSE: 'bg-yellow-500',
    ACCEPTE: 'bg-green-500',
    REFUSE: 'bg-red-500',
    EN_ATTENTE_INFO: 'bg-orange-500',
    CLOTURE: 'bg-gray-500',
  };
  return colors[statut] || 'bg-gray-400';
};

const getStatutLabel = (statut: string) => {
  const labels: Record<string, string> = {
    ENREGISTRE: 'Enregistré',
    EN_ANALYSE: 'En analyse',
    ACCEPTE: 'Accepté',
    REFUSE: 'Refusé',
    EN_ATTENTE_INFO: "En attente d'info",
    CLOTURE: 'Clôturé',
  };
  return labels[statut] || statut;
};

const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'referenceExterne',
    header: 'Référence',
    cell: ({ row }) => (
      <Link href={`/depanssur/dossiers/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.original.referenceExterne}
      </Link>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.type;
      const icons: Record<string, string> = {
        ELECTRICITE: '⚡',
        PLOMBERIE: '🚰',
        ELECTROMENAGER: '🔌',
        SERRURERIE: '🔑',
        AUTRE: '🔧',
      };
      return (
        <div className="flex items-center gap-2">
          <span>{icons[type] || '🔧'}</span>
          <span className="capitalize">{type?.toLowerCase().replace(/_/g, ' ')}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }) => (
      <Badge className={getStatutColor(row.original.statut)}>{getStatutLabel(row.original.statut)}</Badge>
    ),
  },
  {
    accessorKey: 'dateOuverture',
    header: "Date d'ouverture",
    cell: ({ row }) => {
      try {
        return format(new Date(row.original.dateOuverture), 'dd/MM/yyyy');
      } catch {
        return '-';
      }
    },
  },
  {
    accessorKey: 'montantDemande',
    header: 'Montant demandé',
    cell: ({ row }) => {
      const montant = parseFloat(row.original.montantDemande || '0');
      return `${montant.toFixed(2)} €`;
    },
  },
  {
    accessorKey: 'montantAccepte',
    header: 'Montant accepté',
    cell: ({ row }) => {
      const montant = parseFloat(row.original.montantAccepte || '0');
      return montant > 0 ? `${montant.toFixed(2)} €` : '-';
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/depanssur/dossiers/${row.original.id}`}>
          <FileText className="h-4 w-4 mr-2" />
          Détails
        </Link>
      </Button>
    ),
  },
];

export function DossiersPageClient() {
  const [search, setSearch] = React.useState('');
  const [statutFilter, setStatutFilter] = React.useState<string>('all');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const { data: dossiers, refetch } = useQuery({
    queryKey: ['dossiers-depanssur', statutFilter, typeFilter],
    queryFn: async () => {
      const result = await listDossiersAction({
        organisationId: 'org-id',
        search: '',
        statut: statutFilter && statutFilter !== 'all' ? (statutFilter as any) : undefined,
        type: typeFilter && typeFilter !== 'all' ? (typeFilter as any) : undefined,
        pagination: { page: 1, limit: 50, sortBy: '', sortOrder: '' },
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  const allDossiers = dossiers?.dossiers || [];

  // Filtrage local par recherche
  const filteredDossiers = React.useMemo(() => {
    if (!search) return allDossiers;
    const s = search.toLowerCase();
    return allDossiers.filter((d: any) =>
      d.referenceExterne?.toLowerCase().includes(s)
    );
  }, [search, allDossiers]);

  // Compteur de filtres actifs
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (statutFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    return count;
  }, [statutFilter, typeFilter]);

  const isAdvancedFiltersOpen = showAdvancedFilters || activeFiltersCount > 0;

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success('Liste actualisée');
  }, [refetch]);

  const handleResetFilters = React.useCallback(() => {
    setStatutFilter('all');
    setTypeFilter('all');
    setSearch('');
  }, []);

  return (
    <main className="flex flex-1 flex-col gap-4 min-h-0">
      <div className="flex flex-col gap-4 min-h-full">
        {/* Barre de recherche + Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              'gap-2',
              isAdvancedFiltersOpen && 'bg-accent text-accent-foreground'
            )}
          >
            <SlidersHorizontal className="size-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 size-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={cn('size-4 transition-transform', isAdvancedFiltersOpen && 'rotate-180')} />
          </Button>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="gap-1 text-muted-foreground">
              <X className="size-4" />
              Réinitialiser
            </Button>
          )}

          <div className="flex-1" />

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className="size-4" />
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Nouveau dossier
          </Button>
        </div>

        {/* Filtres avancés (collapsible) */}
        <Collapsible open={isAdvancedFiltersOpen}>
          <CollapsibleContent>
            <Card className="bg-card border">
              <CardContent className="pt-4 pb-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Select value={statutFilter} onValueChange={setStatutFilter}>
                    <SelectTrigger className="bg-white w-full">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="ENREGISTRE">Enregistré</SelectItem>
                      <SelectItem value="EN_ANALYSE">En analyse</SelectItem>
                      <SelectItem value="ACCEPTE">Accepté</SelectItem>
                      <SelectItem value="REFUSE">Refusé</SelectItem>
                      <SelectItem value="EN_ATTENTE_INFO">En attente d&apos;info</SelectItem>
                      <SelectItem value="CLOTURE">Clôturé</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="bg-white w-full">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="ELECTRICITE">⚡ Électricité</SelectItem>
                      <SelectItem value="PLOMBERIE">🚰 Plomberie</SelectItem>
                      <SelectItem value="ELECTROMENAGER">🔌 Électroménager</SelectItem>
                      <SelectItem value="SERRURERIE">🔑 Serrurerie</SelectItem>
                      <SelectItem value="AUTRE">🔧 Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Table des dossiers */}
        <Card className="flex-1 min-h-0 bg-card border flex flex-col">
          <CardContent className="flex-1 min-h-0 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {filteredDossiers.length} dossier{filteredDossiers.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex-1 min-h-0">
              <DataTable
                columns={columns}
                data={filteredDossiers}
                headerClassName="bg-sidebar hover:bg-sidebar"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
