'use client';

import { useState } from 'react';
import { PaymentForm, CheckoutButton } from '@/components/stripe';
import { TEST_CARDS, formatAmount, API_URL } from '@/lib/stripe';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, ExternalLink, Calendar, Info, Copy, Check, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useProduits } from '@/hooks/catalogue/use-produits';

function HelpSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
        <Info className="h-4 w-4" />
        {title}
      </h4>
      <div className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
        {children}
      </div>
    </div>
  );
}

function TestCardsInfo() {
  const [copiedCard, setCopiedCard] = useState<string | null>(null);

  const copyToClipboard = (card: string, label: string) => {
    navigator.clipboard.writeText(card.replace(/\s/g, ''));
    setCopiedCard(label);
    toast.success(`Numéro de carte copié : ${label}`);
    setTimeout(() => setCopiedCard(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Cartes de test Stripe
        </CardTitle>
        <CardDescription>
          Utilisez ces numéros de carte pour tester les différents scénarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(TEST_CARDS).map(([key, card]) => {
            const labels: Record<string, string> = {
              success: 'Paiement réussi',
              requires3ds: 'Authentification 3DS',
              declined: 'Carte refusée',
              insufficientFunds: 'Fonds insuffisants',
              expiredCard: 'Carte expirée',
            };
            return (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
                onClick={() => copyToClipboard(card, labels[key])}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{card}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={key === 'success' ? 'default' : 'secondary'}>
                    {labels[key]}
                  </Badge>
                  {copiedCard === labels[key] ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <Separator className="my-4" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Date d'expiration :</strong> N'importe quelle date future (ex: 12/34)</p>
          <p><strong>CVC :</strong> N'importe quels 3 chiffres (ex: 123)</p>
          <p><strong>Code postal :</strong> N'importe lequel (ex: 75001)</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentElementsDemo() {
  const [amount, setAmount] = useState(2999);
  const [email, setEmail] = useState('test@example.com');

  return (
    <div className="space-y-6">
      <HelpSection title="Comment ça marche ?">
        <p><strong>Stripe Elements</strong> permet d'intégrer un formulaire de paiement directement dans votre page.</p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Le frontend crée un <code className="px-1 bg-blue-100 dark:bg-blue-900 rounded">PaymentIntent</code> via le backend</li>
          <li>Stripe retourne un <code className="px-1 bg-blue-100 dark:bg-blue-900 rounded">clientSecret</code></li>
          <li>L'utilisateur entre ses infos de carte dans le formulaire sécurisé</li>
          <li>Le paiement est confirmé directement avec Stripe</li>
        </ol>
        <p className="mt-2"><strong>Cas d'usage :</strong> Paiement unique intégré dans votre tunnel d'achat (pas de redirection).</p>
      </HelpSection>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Personnalisez le montant et l'email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (centimes)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={50}
              />
              <p className="text-xs text-muted-foreground">
                = {formatAmount(amount, 'eur')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email du client</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentForm
        amount={amount}
        currency="eur"
        title="Paiement avec Stripe Elements"
        description="Formulaire de paiement intégré directement dans la page"
        customerEmail={email}
        metadata={{ source: 'test-page' }}
        onSuccess={(id) => {
          toast.success(`Paiement réussi ! ID: ${id}`);
        }}
        onError={(error) => {
          toast.error(`Erreur: ${error}`);
        }}
      />
    </div>
  );
}

function CheckoutDemo() {
  const [amount, setAmount] = useState(4999);
  const [productName, setProductName] = useState('Produit de test');
  const [email, setEmail] = useState('test@example.com');

  return (
    <div className="space-y-6">
      <HelpSection title="Comment ça marche ?">
        <p><strong>Stripe Checkout</strong> redirige vers une page de paiement hébergée par Stripe.</p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Le backend crée une <code className="px-1 bg-blue-100 dark:bg-blue-900 rounded">CheckoutSession</code></li>
          <li>L'utilisateur est redirigé vers la page Stripe</li>
          <li>Après paiement, retour sur <code className="px-1 bg-blue-100 dark:bg-blue-900 rounded">successUrl</code> ou <code className="px-1 bg-blue-100 dark:bg-blue-900 rounded">cancelUrl</code></li>
        </ol>
        <p className="mt-2"><strong>Cas d'usage :</strong> Paiement rapide sans intégration complexe. Stripe gère tout (formulaire, 3DS, etc.).</p>
        <p className="mt-1"><strong>Mode payment :</strong> Paiement unique (le montant peut être dynamique).</p>
      </HelpSection>

      <Card>
        <CardHeader>
          <CardTitle>Configuration du Checkout</CardTitle>
          <CardDescription>
            Redirection vers la page de paiement hébergée par Stripe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkout-amount">Montant (centimes)</Label>
              <Input
                id="checkout-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={50}
              />
              <p className="text-xs text-muted-foreground">
                = {formatAmount(amount, 'eur')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkout-email">Email du client</Label>
              <Input
                id="checkout-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-name">Nom du produit</Label>
            <Input
              id="product-name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Stripe Checkout
          </CardTitle>
          <CardDescription>
            Cliquez sur le bouton pour être redirigé vers la page de paiement Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CheckoutButton
            amount={amount}
            currency="eur"
            productName={productName}
            customerEmail={email}
            mode="payment"
            className="w-full"
            size="lg"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SubscriptionDemo() {
  const [email, setEmail] = useState('test@example.com');
  const [name, setName] = useState('John Doe');
  const [selectedProduit, setSelectedProduit] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Récupérer les produits CRM
  const { produits } = useProduits();
  const produitsLoading = false;

  const activeProducts = produits.filter(p => p.actif);

  // Créer un checkout Stripe avec le prix du produit CRM
  const handleSubscribe = async (produitId: string) => {
    const produit = activeProducts.find(p => p.id === produitId);
    if (!produit) return;

    setIsRedirecting(true);
    setSelectedProduit(produitId);

    try {
      const response = await fetch(`${API_URL}/stripe/checkout/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'subscription',
          customerEmail: email,
          successUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
          lineItems: [{
            name: produit.name,
            description: produit.description,
            amount: Math.round(produit.priceTTC * 100),
            currency: produit.currency.toLowerCase(),
            quantity: 1,
          }],
          metadata: {
            crmProductId: produit.id,
            customerName: name,
          }
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la création du checkout');

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast.error('Impossible de créer la session de paiement');
      setIsRedirecting(false);
      setSelectedProduit(null);
    }
  };

  return (
    <div className="space-y-6">
      <HelpSection title="Comment ça marche ?">
        <p><strong>Abonnements Stripe</strong> permet de créer des paiements récurrents automatiques.</p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Le backend crée un <code className="px-1 bg-blue-100 dark:bg-blue-900 rounded">Product</code> et <code className="px-1 bg-blue-100 dark:bg-blue-900 rounded">Price</code> récurrent dans Stripe</li>
          <li>Une <code className="px-1 bg-blue-100 dark:bg-blue-900 rounded">CheckoutSession</code> en mode subscription est créée</li>
          <li>Stripe gère automatiquement les prélèvements mensuels</li>
        </ol>
        <p className="mt-2"><strong>Cas d'usage :</strong> SaaS, abonnements mensuels/annuels.</p>
        <p className="mt-1"><strong>Note :</strong> Le prix est créé dynamiquement dans Stripe à partir du produit CRM sélectionné.</p>
      </HelpSection>

      {activeProducts.length === 0 && !produitsLoading ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Aucun produit</AlertTitle>
          <AlertDescription>
            Aucun produit actif trouvé. Créez des produits dans /catalogue.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Configuration du client</CardTitle>
          <CardDescription>
            Informations du client pour l'abonnement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub-email">Email</Label>
              <Input
                id="sub-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-name">Nom</Label>
              <Input
                id="sub-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits CRM */}
      {activeProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produits disponibles</CardTitle>
            <CardDescription>
              Sélectionnez un produit pour créer un abonnement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {activeProducts.map((produit) => (
                <div
                  key={produit.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <h4 className="font-medium">{produit.name}</h4>
                    <p className="text-sm text-muted-foreground">{produit.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold">{formatAmount(Math.round(produit.priceTTC * 100), produit.currency)}</p>
                      <p className="text-xs text-muted-foreground">/ mois</p>
                    </div>
                    <button
                      onClick={() => handleSubscribe(produit.id)}
                      disabled={isRedirecting}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isRedirecting && selectedProduit === produit.id ? "Chargement..." : "S'abonner"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface Schedule {
  id: string;
  organisationId: string;
  contratId?: string;
  clientId?: string;
  produitId?: string;
  pspName: string;
  amount: number;
  originalAmount?: number;
  currency: string;
  contractStartDate?: string;
  contractEndDate?: string;
  priceLockedAt?: string;
  dueDate: string;
  nextDueDate?: string;
  isRecurring: boolean;
  intervalUnit?: string;
  status: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

function SchedulesDemo() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [renewAmount, setRenewAmount] = useState(35);
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewing, setRenewing] = useState(false);

  // Charger les schedules
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/schedules`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      toast.error('Impossible de charger les schedules');
    } finally {
      setLoading(false);
    }
  };

  // Renouveler un schedule
  const handleRenew = async () => {
    if (!selectedSchedule) return;

    setRenewing(true);
    try {
      const body: { newAmount: number; newContractEndDate?: string } = {
        newAmount: renewAmount,
      };
      if (renewEndDate) {
        body.newContractEndDate = new Date(renewEndDate).toISOString();
      }

      const response = await fetch(`${API_URL}/schedules/${selectedSchedule}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du renouvellement');
      }

      const renewed = await response.json();
      toast.success(`Schedule renouvelé ! Nouveau montant: ${renewed.amount}€`);
      fetchSchedules(); // Recharger la liste
      setSelectedSchedule(null);
    } catch (error: any) {
      toast.error(error.message || 'Impossible de renouveler le schedule');
    } finally {
      setRenewing(false);
    }
  };

  // Déclencher le traitement des paiements
  const triggerProcessing = async () => {
    try {
      const response = await fetch(`${API_URL}/schedules/process`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Erreur');
      const result = await response.json();
      toast.success(`Traitement terminé: ${result.processed} traités, ${result.failed} échoués`);
      fetchSchedules();
    } catch {
      toast.error('Erreur lors du traitement');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      planned: 'default',
      processing: 'secondary',
      paid: 'default',
      failed: 'destructive',
      expired: 'destructive',
      cancelled: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status.toUpperCase()}</Badge>;
  };

  const expiredSchedules = schedules.filter(s => s.status === 'expired');

  return (
    <div className="space-y-6">
      <HelpSection title="Comment ça marche ?">
        <p><strong>Schedules</strong> = Paiements programmés gérés par le CRM (pas par Stripe).</p>
        <div className="mt-2 space-y-2">
          <p><strong>Différence avec Stripe Subscriptions :</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><strong>Stripe Subscriptions</strong> : Stripe gère tout (dates, prélèvements, retries)</li>
            <li><strong>CRM Schedules</strong> : Vous contrôlez quand et combien prélever, multi-PSP (Stripe, GoCardless SEPA...)</li>
          </ul>
        </div>
        <div className="mt-2 space-y-1">
          <p><strong>Cycle de vie d'un Schedule :</strong></p>
          <p className="font-mono text-xs">PLANNED → PROCESSING → PAID (succès) ou FAILED → EXPIRED (fin contrat)</p>
        </div>
        <div className="mt-2 space-y-1">
          <p><strong>Modèle contractuel :</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Le prix est fixé à la souscription (<code className="px-1 bg-blue-100 dark:bg-blue-900 rounded">originalAmount</code>)</li>
            <li>Si le prix du produit change, les clients existants gardent leur prix</li>
            <li>À l'expiration du contrat, le client doit renouveler explicitement (nouveau prix possible)</li>
          </ul>
        </div>
      </HelpSection>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Gestion des Schedules
          </CardTitle>
          <CardDescription>
            Testez les paiements programmés et le renouvellement de contrats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={fetchSchedules} disabled={loading}>
              {loading ? "Chargement..." : "Charger les schedules"}
            </Button>
            <Button variant="outline" onClick={triggerProcessing}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Déclencher le CRON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des schedules */}
      {schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Schedules ({schedules.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 border rounded-lg text-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{schedule.id.slice(0, 8)}...</span>
                      {getStatusBadge(schedule.status)}
                      <Badge variant="outline">{schedule.pspName}</Badge>
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium">{schedule.amount}€</span>
                      {schedule.originalAmount && schedule.originalAmount !== schedule.amount && (
                        <span className="ml-2 line-through text-xs">{schedule.originalAmount}€</span>
                      )}
                      {schedule.isRecurring && (
                        <span className="ml-2">/ {schedule.intervalUnit}</span>
                      )}
                    </div>
                    {schedule.contractEndDate && (
                      <div className="text-xs text-muted-foreground">
                        Fin contrat: {new Date(schedule.contractEndDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>Échéance: {new Date(schedule.dueDate).toLocaleDateString()}</div>
                    <div>Créé: {new Date(schedule.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Renouvellement */}
      {expiredSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Renouveler un contrat expiré
            </CardTitle>
            <CardDescription>
              Sélectionnez un schedule expiré pour le renouveler avec un nouveau prix
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Schedule expiré</Label>
              <Select value={selectedSchedule || ''} onValueChange={setSelectedSchedule}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un schedule" />
                </SelectTrigger>
                <SelectContent>
                  {expiredSchedules.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.id.slice(0, 8)}... - {s.amount}€ ({s.pspName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="renew-amount">Nouveau montant (€)</Label>
                <Input
                  id="renew-amount"
                  type="number"
                  value={renewAmount}
                  onChange={(e) => setRenewAmount(Number(e.target.value))}
                  min={1}
                  step={0.01}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="renew-end-date">Nouvelle fin de contrat</Label>
                <Input
                  id="renew-end-date"
                  type="date"
                  value={renewEndDate}
                  onChange={(e) => setRenewEndDate(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleRenew}
              disabled={!selectedSchedule || renewing}
              className="w-full"
            >
              {renewing ? "Renouvellement..." : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renouveler le contrat
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {schedules.length > 0 && expiredSchedules.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Aucun schedule expiré</AlertTitle>
          <AlertDescription>
            Pour tester le renouvellement, créez un schedule de test avec le formulaire ci-dessous.
          </AlertDescription>
        </Alert>
      )}

      {/* Créer un schedule de test */}
      <CreateTestSchedule onCreated={fetchSchedules} />
    </div>
  );
}

function CreateTestSchedule({ onCreated }: { onCreated: () => void }) {
  const [creating, setCreating] = useState(false);
  const [amount, setAmount] = useState(29);
  const [pspName, setPspName] = useState('stripe');
  const [isRecurring, setIsRecurring] = useState(true);
  const [contractEndDate, setContractEndDate] = useState('');
  const [makeExpired, setMakeExpired] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      // Calculer les dates
      const now = new Date();
      let endDate: string | undefined;

      if (makeExpired) {
        // Date de fin dans le passé pour créer un schedule expiré
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        endDate = pastDate.toISOString();
      } else if (contractEndDate) {
        endDate = new Date(contractEndDate).toISOString();
      }

      const body = {
        organisationId: '9bfa9d59-45a0-42d8-a802-775663358337', // ID Finanssor du seed
        pspName,
        amount,
        currency: 'EUR',
        dueDate: now.toISOString(),
        isRecurring,
        intervalUnit: isRecurring ? 'month' : undefined,
        intervalCount: isRecurring ? 1 : undefined,
        status: makeExpired ? 'expired' : 'planned',
        maxRetries: 3,
        contractStartDate: now.toISOString(),
        contractEndDate: endDate,
      };

      const response = await fetch(`${API_URL}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Erreur lors de la création');

      toast.success('Schedule de test créé !');
      onCreated();
    } catch (error) {
      toast.error('Impossible de créer le schedule');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un schedule de test</CardTitle>
        <CardDescription>
          Créez un schedule pour tester les fonctionnalités
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test-amount">Montant (€)</Label>
            <Input
              id="test-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-psp">PSP</Label>
            <Select value={pspName} onValueChange={setPspName}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="gocardless">GoCardless (SEPA)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Récurrent (mensuel)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={makeExpired}
              onChange={(e) => setMakeExpired(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-orange-600 dark:text-orange-400">Créer comme expiré (pour tester le renouvellement)</span>
          </label>
        </div>

        {!makeExpired && (
          <div className="space-y-2">
            <Label htmlFor="test-end-date">Date de fin de contrat (optionnel)</Label>
            <Input
              id="test-end-date"
              type="date"
              value={contractEndDate}
              onChange={(e) => setContractEndDate(e.target.value)}
            />
          </div>
        )}

        <Button onClick={handleCreate} disabled={creating} className="w-full">
          {creating ? "Création..." : "Créer le schedule de test"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function TestStripePage() {
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Stripe Integration</h1>
        <p className="text-muted-foreground">
          Page de test pour les différentes méthodes de paiement Stripe
        </p>
      </div>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertTitle>Mode Test</AlertTitle>
        <AlertDescription>
          Cette page utilise les clés de test Stripe. Aucun vrai paiement ne sera effectué.
          Assurez-vous que les variables d'environnement sont configurées :
          <code className="mx-1 px-1 py-0.5 bg-muted rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>
          et que le backend est démarré sur
          <code className="mx-1 px-1 py-0.5 bg-muted rounded">NEXT_PUBLIC_BACKEND_API_URL</code>
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="elements" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="elements" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Elements
              </TabsTrigger>
              <TabsTrigger value="checkout" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Checkout
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Abonnements
              </TabsTrigger>
              <TabsTrigger value="schedules" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Schedules
              </TabsTrigger>
            </TabsList>

            <TabsContent value="elements">
              <PaymentElementsDemo />
            </TabsContent>

            <TabsContent value="checkout">
              <CheckoutDemo />
            </TabsContent>

            <TabsContent value="subscription">
              <SubscriptionDemo />
            </TabsContent>

            <TabsContent value="schedules">
              <SchedulesDemo />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <TestCardsInfo />
        </div>
      </div>
    </div>
  );
}
