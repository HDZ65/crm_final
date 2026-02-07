'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { depanssurClient } from '@/lib/grpc/clients/depanssur';
import { Loader2, AlertCircle, Calendar, Euro, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ClientAbonnementDepanssurProps {
  clientId: string;
  organisationId: string;
}

export function ClientAbonnementDepanssur({ clientId, organisationId }: ClientAbonnementDepanssurProps) {
  const { data: abonnement, isLoading, error } = useQuery({
    queryKey: ['abonnement-depanssur', clientId, organisationId],
    queryFn: () => depanssurClient.getAbonnementByClient({ clientId, organisationId }),
  });

  const { data: compteur } = useQuery({
    queryKey: ['compteur-depanssur', abonnement?.id, organisationId],
    queryFn: () => depanssurClient.getCurrentCompteur({ abonnementId: abonnement!.id, organisationId }),
    enabled: !!abonnement?.id,
  });

  const { data: options } = useQuery({
    queryKey: ['options-depanssur', abonnement?.id, organisationId],
    queryFn: () => depanssurClient.listOptions({ abonnementId: abonnement!.id, organisationId }),
    enabled: !!abonnement?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !abonnement) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Aucun abonnement Depanssur</p>
          <p className="text-sm text-muted-foreground mt-2">Ce client n'a pas d'abonnement actif</p>
        </CardContent>
      </Card>
    );
  }

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      ACTIF: 'bg-green-500',
      SUSPENDU_IMPAYE: 'bg-red-500',
      PAUSE: 'bg-yellow-500',
      RESILIE: 'bg-gray-500',
      BROUILLON: 'bg-gray-400',
    };
    return colors[statut] || 'bg-gray-400';
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      ACTIF: 'Actif',
      SUSPENDU_IMPAYE: 'Suspendu (Impayé)',
      PAUSE: 'En pause',
      RESILIE: 'Résilié',
      BROUILLON: 'Brouillon',
    };
    return labels[statut] || statut;
  };

  const calculateProgress = (used: number, max: number) => {
    if (!max || max === 0) return 0;
    return Math.min((used / max) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const nbInterventionsUtilisees = compteur?.nbInterventionsUtilisees || 0;
  const montantUtilise = parseFloat(compteur?.montantCumule || '0');
  const progressInterventions = calculateProgress(nbInterventionsUtilisees, abonnement.nbInterventionsMax || 0);
  const progressMontant = calculateProgress(montantUtilise, parseFloat(abonnement.plafondAnnuel || '0'));

  return (
    <div className="space-y-6">
      {/* Card Principale Abonnement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Abonnement {abonnement.planType}</CardTitle>
              <CardDescription>Souscrit le {format(new Date(abonnement.dateEffet), 'PPP', { locale: fr })}</CardDescription>
            </div>
            <Badge className={getStatutColor(abonnement.statut)}>{getStatutLabel(abonnement.statut)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                Date d'effet
              </div>
              <p className="font-medium">{format(new Date(abonnement.dateEffet), 'dd/MM/yyyy')}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                Prochaine échéance
              </div>
              <p className="font-medium">{format(new Date(abonnement.prochaineEcheance), 'dd/MM/yyyy')}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Euro className="h-4 w-4 mr-1" />
                Prix
              </div>
              <p className="font-medium">{parseFloat(abonnement.prixTtc).toFixed(2)} € TTC</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Activity className="h-4 w-4 mr-1" />
                Périodicité
              </div>
              <p className="font-medium">{abonnement.periodicite}</p>
            </div>
          </div>

          <Separator />

          {/* Période d'attente (Carence) */}
          {abonnement.periodeAttente > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-900 mb-2">Période d'attente (Carence)</h4>
              <p className="text-sm text-amber-700">
                {abonnement.periodeAttente} jours - Effective jusqu'au{' '}
                {format(
                  new Date(new Date(abonnement.dateEffet).getTime() + abonnement.periodeAttente * 24 * 60 * 60 * 1000),
                  'dd/MM/yyyy'
                )}
              </p>
            </div>
          )}

          {/* Garanties */}
          <div>
            <h4 className="font-medium mb-3">Garanties & Franchises</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Franchise</p>
                <p className="text-lg font-semibold">{parseFloat(abonnement.franchise || '0').toFixed(2)} €</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Plafond par intervention</p>
                <p className="text-lg font-semibold">{parseFloat(abonnement.plafondParIntervention || '0').toFixed(2)} €</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Plafond annuel</p>
                <p className="text-lg font-semibold">{parseFloat(abonnement.plafondAnnuel || '0').toFixed(2)} €</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Plafonds & Consommation */}
      <Card>
        <CardHeader>
          <CardTitle>Consommation des plafonds</CardTitle>
          <CardDescription>Année glissante en cours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interventions */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Nombre d'interventions</span>
              <span className="text-sm text-muted-foreground">
                {nbInterventionsUtilisees} / {abonnement.nbInterventionsMax || 'Illimité'}
              </span>
            </div>
            <Progress value={progressInterventions} className={getProgressColor(progressInterventions)} />
            {progressInterventions >= 80 && (
              <p className="text-xs text-orange-600 mt-1">⚠️ Vous approchez de la limite</p>
            )}
          </div>

          {/* Montant annuel */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Montant annuel consommé</span>
              <span className="text-sm text-muted-foreground">
                {montantUtilise.toFixed(2)} € / {parseFloat(abonnement.plafondAnnuel || '0').toFixed(2)} €
              </span>
            </div>
            <Progress value={progressMontant} className={getProgressColor(progressMontant)} />
            {progressMontant >= 80 && (
              <p className="text-xs text-orange-600 mt-1">⚠️ Vous approchez de la limite</p>
            )}
          </div>

          {compteur && (
            <div className="text-xs text-muted-foreground">
              Période: {format(new Date(compteur.anneeGlissanteDebut), 'dd/MM/yyyy')} -{' '}
              {format(new Date(compteur.anneeGlissanteFin), 'dd/MM/yyyy')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card Options */}
      {options && options.options && options.options.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Options souscrites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {options.options.map((option: any) => (
                <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{option.type}</p>
                    <p className="text-sm text-muted-foreground">{option.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{parseFloat(option.prixTtc).toFixed(2)} € TTC</p>
                    <Badge variant={option.actif ? 'default' : 'secondary'}>
                      {option.actif ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Upgrader le plan
            </Button>
            <Button variant="outline" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Downgrader le plan
            </Button>
            <Button variant="outline">Gérer les options</Button>
            <Separator orientation="vertical" className="h-8" />
            {abonnement.statut === 'ACTIF' ? (
              <Button variant="destructive">Suspendre l'abonnement</Button>
            ) : abonnement.statut === 'SUSPENDU_IMPAYE' ? (
              <Button variant="default">Réactiver l'abonnement</Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
