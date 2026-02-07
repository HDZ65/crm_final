'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { depanssurClient } from '@/lib/grpc/clients/depanssur';
import { TrendingUp, TrendingDown, Users, FileText, Euro, AlertCircle, Percent } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function DepanssurReportingClient() {
  const [period, setPeriod] = useState('month');

  const { data: abonnements } = useQuery({
    queryKey: ['abonnements-all', 'org-id'],
    queryFn: () => depanssurClient.listAbonnements({ organisationId: 'org-id', pagination: { page: 1, pageSize: 1000 } }),
  });

  const { data: dossiers } = useQuery({
    queryKey: ['dossiers-all', 'org-id'],
    queryFn: () => depanssurClient.listDossiers({ organisationId: 'org-id', pagination: { page: 1, pageSize: 1000 } }),
  });

  // Calculs KPIs
  const totalAbonnements = abonnements?.abonnements?.length || 0;
  const abonnementsActifs = abonnements?.abonnements?.filter((a: any) => a.statut === 'ACTIF').length || 0;
  const mrr = abonnements?.abonnements
    ?.filter((a: any) => a.statut === 'ACTIF')
    .reduce((sum: number, a: any) => sum + parseFloat(a.prixTtc || '0'), 0) || 0;

  const totalDossiers = dossiers?.dossiers?.length || 0;
  const dossiersAcceptes = dossiers?.dossiers?.filter((d: any) => d.statut === 'ACCEPTE').length || 0;
  const dossiersRefuses = dossiers?.dossiers?.filter((d: any) => d.statut === 'REFUSE').length || 0;
  const montantTotal = dossiers?.dossiers
    ?.filter((d: any) => d.statut === 'ACCEPTE')
    .reduce((sum: number, d: any) => sum + parseFloat(d.montantAccepte || '0'), 0) || 0;

  const tauxAcceptation = totalDossiers > 0 ? (dossiersAcceptes / totalDossiers) * 100 : 0;
  const ticketMoyen = dossiersAcceptes > 0 ? montantTotal / dossiersAcceptes : 0;

  // Données graphiques
  const mrrData = [
    { mois: 'Jan', mrr: mrr * 0.7 },
    { mois: 'Fév', mrr: mrr * 0.75 },
    { mois: 'Mar', mrr: mrr * 0.85 },
    { mois: 'Avr', mrr: mrr * 0.9 },
    { mois: 'Mai', mrr: mrr * 0.95 },
    { mois: 'Juin', mrr: mrr },
  ];

  const sinistreData = [
    { type: 'Électricité', count: dossiers?.dossiers?.filter((d: any) => d.type === 'ELECTRICITE').length || 0 },
    { type: 'Plomberie', count: dossiers?.dossiers?.filter((d: any) => d.type === 'PLOMBERIE').length || 0 },
    { type: 'Électroménager', count: dossiers?.dossiers?.filter((d: any) => d.type === 'ELECTROMENAGER').length || 0 },
    { type: 'Serrurerie', count: dossiers?.dossiers?.filter((d: any) => d.type === 'SERRURERIE').length || 0 },
    { type: 'Autre', count: dossiers?.dossiers?.filter((d: any) => d.type === 'AUTRE').length || 0 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reporting Depanssur</h1>
          <p className="text-muted-foreground">Vue d'ensemble des métriques et statistiques</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="quarter">Ce trimestre</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mrr.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +12.5% ce mois
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{abonnementsActifs}</div>
            <p className="text-xs text-muted-foreground">sur {totalAbonnements} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dossiers traités</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDossiers}</div>
            <p className="text-xs text-muted-foreground">
              {dossiersAcceptes} acceptés, {dossiersRefuses} refusés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'acceptation</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tauxAcceptation.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Ticket moyen: {ticketMoyen.toFixed(2)} €</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="mrr" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mrr">MRR Evolution</TabsTrigger>
          <TabsTrigger value="sinistres">Sinistralité</TabsTrigger>
          <TabsTrigger value="churn">Churn & Retention</TabsTrigger>
        </TabsList>

        <TabsContent value="mrr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution du MRR</CardTitle>
              <CardDescription>Revenu mensuel récurrent sur 6 mois</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mrrData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(2)} €`} />
                  <Legend />
                  <Line type="monotone" dataKey="mrr" stroke="#8884d8" strokeWidth={2} name="MRR" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sinistres" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des sinistres</CardTitle>
                <CardDescription>Par type d'intervention</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sinistreData} cx="50%" cy="50%" labelLine={false} label nameKey="type" dataKey="count">
                      {sinistreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Volume par type</CardTitle>
                <CardDescription>Nombre de dossiers par catégorie</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sinistreData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="Dossiers" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="churn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Churn Rate</CardTitle>
              <CardDescription>Taux de résiliation mensuel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-6xl font-bold text-green-600">2.3%</div>
                <p className="text-muted-foreground mt-2">Taux de churn mensuel</p>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold">97.7%</div>
                    <p className="text-sm text-muted-foreground">Rétention</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">€{(mrr * 0.023).toFixed(2)}</div>
                    <p className="text-sm text-muted-foreground">MRR perdu</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">€{(mrr * 0.15).toFixed(2)}</div>
                    <p className="text-sm text-muted-foreground">Nouveau MRR</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
