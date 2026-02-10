'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createAbonnementAction } from '@/actions/depanssur';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';

interface CreateAbonnementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  organisationId: string;
  onSuccess?: () => void;
}

const PLANS = [
  {
    type: 'ESSENTIEL',
    name: 'Essentiel',
    prixTtc: 19.99,
    description: 'Couverture de base',
    plafondParIntervention: 150,
    plafondAnnuel: 500,
    nbInterventionsMax: 3,
    franchise: 50,
  },
  {
    type: 'STANDARD',
    name: 'Standard',
    prixTtc: 29.99,
    description: 'Protection complète',
    plafondParIntervention: 300,
    plafondAnnuel: 1000,
    nbInterventionsMax: 5,
    franchise: 30,
  },
  {
    type: 'PREMIUM',
    name: 'Premium',
    prixTtc: 49.99,
    description: 'Couverture maximale',
    plafondParIntervention: 500,
    plafondAnnuel: 2000,
    nbInterventionsMax: 10,
    franchise: 0,
  },
];

const OPTIONS = [
  { type: 'ASSISTANCE_24H', label: 'Assistance 24h/24', prixTtc: 5.99 },
  { type: 'DEPANNAGE_EXPRESS', label: 'Dépannage express (2h)', prixTtc: 9.99 },
  { type: 'GARANTIE_PIECES', label: 'Garantie pièces détachées', prixTtc: 7.99 },
];

export function CreateAbonnementDialog({ open, onOpenChange, clientId, organisationId, onSuccess }: CreateAbonnementDialogProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [periodicite, setPeriodicite] = useState('MENSUELLE');
  const [periodeAttente, setPeriodeAttente] = useState(30);

  const handleToggleOption = (optionType: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionType) ? prev.filter((o) => o !== optionType) : [...prev, optionType]
    );
  };

  const calculateTotal = () => {
    let total = selectedPlan.prixTtc;
    OPTIONS.forEach((opt) => {
      if (selectedOptions.includes(opt.type)) {
        total += opt.prixTtc;
      }
    });
    return total;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const dateEffet = new Date();
      const prochaineEcheance = new Date();
      if (periodicite === 'MENSUELLE') {
        prochaineEcheance.setMonth(prochaineEcheance.getMonth() + 1);
      } else if (periodicite === 'ANNUELLE') {
        prochaineEcheance.setFullYear(prochaineEcheance.getFullYear() + 1);
      }

      const result = await createAbonnementAction({
        organisationId,
        clientId,
        planType: selectedPlan.type,
        periodicite,
        periodeAttente,
        prixTtc: calculateTotal(),
        montantHt: calculateTotal() / 1.2,
        tauxTva: 20,
        franchise: selectedPlan.franchise,
        plafondParIntervention: selectedPlan.plafondParIntervention,
        plafondAnnuel: selectedPlan.plafondAnnuel,
        nbInterventionsMax: selectedPlan.nbInterventionsMax,
        dateSouscription: new Date().toISOString(),
        dateEffet: dateEffet.toISOString(),
        prochaineEcheance: prochaineEcheance.toISOString(),
      });

      if (result.error) throw new Error(result.error);

      toast.success('Abonnement créé avec succès!');
      onSuccess?.();
      onOpenChange(false);
      setStep(1);
    } catch (error) {
      toast.error('Erreur lors de la création de l\'abonnement');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle souscription Depanssur</DialogTitle>
          <DialogDescription>Étape {step} sur 3</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Choisissez votre plan</h3>
            <div className="grid grid-cols-3 gap-4">
              {PLANS.map((plan) => (
                <Card
                  key={plan.type}
                  className={`cursor-pointer transition-all ${
                    selectedPlan.type === plan.type ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.name}
                      {selectedPlan.type === plan.type && <Check className="h-5 w-5 text-primary" />}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-bold">{plan.prixTtc.toFixed(2)} €</div>
                    <div className="text-sm text-muted-foreground">par mois</div>
                    <Separator className="my-2" />
                    <ul className="text-sm space-y-1">
                      <li>✓ {plan.nbInterventionsMax} interventions/an</li>
                      <li>✓ Plafond: {plan.plafondAnnuel} €/an</li>
                      <li>✓ Max {plan.plafondParIntervention} €/intervention</li>
                      <li>{plan.franchise > 0 ? `Franchise: ${plan.franchise} €` : '✓ Sans franchise'}</li>
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Options supplémentaires</h3>
            <div className="space-y-3">
              {OPTIONS.map((option) => (
                <Card key={option.type}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedOptions.includes(option.type)}
                        onCheckedChange={() => handleToggleOption(option.type)}
                      />
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">+{option.prixTtc.toFixed(2)} € TTC/mois</p>
                      </div>
                    </div>
                    <Badge variant="outline">{option.prixTtc.toFixed(2)} €</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Confirmation</h3>
            
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Plan {selectedPlan.name}</span>
                  <span className="font-medium">{selectedPlan.prixTtc.toFixed(2)} € TTC</span>
                </div>
                {selectedOptions.map((optType) => {
                  const opt = OPTIONS.find((o) => o.type === optType);
                  return (
                    <div key={optType} className="flex justify-between text-sm">
                      <span>{opt?.label}</span>
                      <span>+{opt?.prixTtc.toFixed(2)} € TTC</span>
                    </div>
                  );
                })}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{calculateTotal().toFixed(2)} € TTC/mois</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Périodicité</Label>
                <Select value={periodicite} onValueChange={setPeriodicite}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MENSUELLE">Mensuelle</SelectItem>
                    <SelectItem value="ANNUELLE">Annuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Période d'attente (jours)</Label>
                <Input
                  type="number"
                  value={periodeAttente}
                  onChange={(e) => setPeriodeAttente(parseInt(e.target.value))}
                  min={0}
                  max={90}
                />
              </div>
            </div>

            {periodeAttente > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <p className="text-amber-900">
                  ⚠️ Une période d'attente de {periodeAttente} jours s'appliquera avant la prise en charge des dossiers.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Précédent
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>Suivant</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Souscrire
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
