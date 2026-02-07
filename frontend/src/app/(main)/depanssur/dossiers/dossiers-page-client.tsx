'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { depanssurClient } from '@/lib/grpc/clients/depanssur';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileText } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';

export function DossiersPageClient() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data: dossiers, isLoading } = useQuery({
    queryKey: ['dossiers-depanssur', search, statutFilter, typeFilter],
    queryFn: () =>
      depanssurClient.listDossiers({
        organisationId: 'org-id', // TODO: Get from context
        search,
        statut: statutFilter || undefined,
        type: typeFilter || undefined,
        pagination: { page: 1, pageSize: 50 },
      }),
  });

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
      EN_ATTENTE_INFO: 'En attente d\'info',
      CLOTURE: 'Clôturé',
    };
    return labels[statut] || statut;
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'referenceExterne',
      header: 'Référence',
      cell: ({ row }) => (
        <Link href={`/depanssur/dossiers/${row.original.id}`} className="font-medium text-blue-600 hover:underline">
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
            <span>{type}</span>
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
      header: 'Date d\'ouverture',
      cell: ({ row }) => format(new Date(row.original.dateOuverture), 'dd/MM/yyyy'),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dossiers Depanssur</h1>
          <p className="text-muted-foreground">Gestion des dossiers déclaratifs</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau dossier
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Recherchez et filtrez les dossiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par référence..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="ENREGISTRE">Enregistré</SelectItem>
                <SelectItem value="EN_ANALYSE">En analyse</SelectItem>
                <SelectItem value="ACCEPTE">Accepté</SelectItem>
                <SelectItem value="REFUSE">Refusé</SelectItem>
                <SelectItem value="EN_ATTENTE_INFO">En attente d'info</SelectItem>
                <SelectItem value="CLOTURE">Clôturé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les types</SelectItem>
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

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable columns={columns} data={dossiers?.dossiers || []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
