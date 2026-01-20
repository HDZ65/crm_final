'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSocieteStore } from '@/stores/societe-store';
import { useOrganisation } from '@/contexts/organisation-context';
import { useProduits } from '@/hooks/catalogue/use-produits';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import type { Product } from '@/types/product';
import {
  FileText,
  Plus,
  List,
  CheckCircle2,
  CreditCard,
  Download,
  Trash2,
  RefreshCw,
  Info,
  AlertCircle,
  FileCheck,
  Receipt,
  Eye,
  Settings,
  Upload,
  Palette,
  Building2,
  X,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';

// Types
interface InvoiceItem {
  id?: string;
  productId?: string; // ID du produit sélectionné
  description: string;
  quantity: number;
  unit: string;
  unitPriceHT: number;
  vatRate: number;
  discount: number;
  totalHT?: number;
  totalTVA?: number;
  totalTTC?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: number;
  customerName: string;
  customerAddress: string;
  customerEmail?: string;
  issueDate: string;
  deliveryDate: string;
  dueDate: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  items: InvoiceItem[];
  pdfPath?: string;
  createdAt: string;
  updatedAt: string;
  validatedAt?: string;
  paidAt?: string;
}

const STATUS_MAP: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  0: { label: 'BROUILLON', variant: 'secondary' },
  1: { label: 'VALIDÉE', variant: 'default' },
  2: { label: 'PAYÉE', variant: 'default' },
  3: { label: 'ANNULÉE', variant: 'destructive' },
  4: { label: 'AVOIR', variant: 'outline' },
};

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR');
}

// API Helpers
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Erreur HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Component: Service Health Check
function ServiceHealthCheck() {
  const [status, setStatus] = useState<'unknown' | 'ok' | 'unavailable'>('unknown');
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const result = await apiCall<{ status: string }>('/invoice-service/health');
      setStatus(result.status === 'ok' ? 'ok' : 'unavailable');
    } catch {
      setStatus('unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          État du service
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Button onClick={checkHealth} disabled={loading} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {loading ? "Test en cours..." : "Tester la connexion"}
          </Button>
          {status !== 'unknown' && (
            <Badge variant={status === 'ok' ? 'default' : 'destructive'}>
              {status === 'ok' ? 'Connecté' : 'Indisponible'}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Service gRPC: {process.env.NEXT_PUBLIC_INVOICE_GRPC_URL || 'localhost:50052'}
        </p>
      </CardContent>
    </Card>
  );
}

// Component: Create Invoice Form
function CreateInvoiceForm({ onCreated }: { onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const { activeOrganisation } = useOrganisation();
  const activeSocieteId = useSocieteStore((state) => state.activeSocieteId);

  // Récupérer les produits de l'organisation active
  const { produits } = useProduits(
    activeOrganisation?.organisationId ? { organisationId: activeOrganisation.organisationId } : undefined
  );

  // Transformer les produits en options pour le Combobox
  const productOptions: ComboboxOption[] = produits
    .filter((p: Product) => p.actif)
    .map((p: Product) => ({
      value: p.id,
      label: p.name,
      description: `${p.price.toFixed(2)} € HT - TVA ${p.taxRate}%`,
    }));

  const [formData, setFormData] = useState({
    customerName: 'Client Test SARL',
    customerAddress: '123 Rue du Test, 75001 Paris',
    customerEmail: 'test@example.com',
    customerSiret: '12345678901234',
    issueDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date().toISOString().split('T')[0],
    paymentTermsDays: 30,
    latePaymentInterestRate: 13.5, // Taux légal BCE + 10 points
    recoveryIndemnity: 40,          // Indemnité forfaitaire obligatoire 40€
    notes: 'Facture de test générée depuis le CRM',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit: 'unité', unitPriceHT: 0, vatRate: 20, discount: 0 },
  ]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit: 'pièce', unitPriceHT: 0, vatRate: 20, discount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as InvoiceItem & { [key: string]: string | number })[field as string] = value;
    setItems(newItems);
  };

  // Quand un produit est sélectionné, pré-remplir les champs
  const handleProductSelect = (index: number, productId: string) => {
    const product = produits.find((p: Product) => p.id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        productId: product.id,
        description: product.name + (product.description ? ` - ${product.description}` : ''),
        unitPriceHT: product.promotionActive && product.prixPromo ? product.prixPromo : product.price,
        vatRate: product.taxRate,
        unit: 'unité',
      };
      setItems(newItems);
      toast.success(`Produit "${product.name}" ajouté`);
    }
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Ajoutez au moins une ligne de facture');
      return;
    }

    setLoading(true);
    try {
      const invoice = await apiCall<Invoice>('/invoice-service/invoices', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          items: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPriceHT: item.unitPriceHT,
            vatRate: item.vatRate,
            discount: item.discount,
          })),
        }),
      });
      toast.success(`Facture créée: ${invoice.invoiceNumber}`);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <HelpSection title="Création de facture">
        <p>Les factures sont créées en <strong>BROUILLON</strong> (DRAFT).</p>
        <p>Vous pouvez les modifier tant qu'elles ne sont pas validées.</p>
        <p>Une fois validée, un PDF Factur-X est généré et la facture devient immuable.</p>
      </HelpSection>

      {!activeSocieteId && (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertTitle>Sélectionnez une société</AlertTitle>
          <AlertDescription>
            Pour voir les produits disponibles dans le catalogue, sélectionnez une société dans le header.
            Vous pouvez toujours créer des lignes manuellement.
          </AlertDescription>
        </Alert>
      )}

      {activeSocieteId && productOptions.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Aucun produit dans le catalogue</AlertTitle>
          <AlertDescription>
            Cette société n'a pas encore de produits dans son catalogue.
            Vous pouvez ajouter des lignes manuellement ou créer des produits dans le module Catalogue.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom du client</Label>
              <Input
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Textarea
              value={formData.customerAddress}
              onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>SIRET</Label>
              <Input
                value={formData.customerSiret}
                onChange={(e) => setFormData({ ...formData, customerSiret: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date d'émission</Label>
              <Input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Délai de paiement (jours)</Label>
              <Input
                type="number"
                value={formData.paymentTermsDays}
                onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lignes de facture
            </span>
            <Button onClick={addItem} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter une ligne
            </Button>
          </CardTitle>
          {productOptions.length > 0 && (
            <CardDescription>
              {productOptions.length} produit(s) disponible(s) pour cette société
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-3">
                {/* Ligne 1: Sélecteur de produit */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Sélectionner un produit (optionnel)
                    </Label>
                    <Combobox
                      options={productOptions}
                      value={item.productId || ''}
                      onValueChange={(productId) => handleProductSelect(index, productId)}
                      placeholder="Rechercher un produit..."
                      searchPlaceholder="Nom du produit..."
                      emptyMessage="Aucun produit trouvé"
                      loading={false}
                      className="bg-background"
                    />
                  </div>
                  <div className="flex-shrink-0 self-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Ligne 2: Détails modifiables */}
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      placeholder="Description du produit/service"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Qté</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Unité</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      placeholder="pièce, heure..."
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Prix unitaire HT</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPriceHT}
                      onChange={(e) => updateItem(index, 'unitPriceHT', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">TVA %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.vatRate}
                      onChange={(e) => updateItem(index, 'vatRate', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Remise %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount}
                      onChange={(e) => updateItem(index, 'discount', Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Affichage du total ligne */}
                {item.unitPriceHT > 0 && (
                  <div className="text-right text-sm text-muted-foreground">
                    Total ligne: <span className="font-medium text-foreground">
                      {((item.unitPriceHT * item.quantity * (1 - item.discount / 100)) * (1 + item.vatRate / 100)).toFixed(2)} € TTC
                    </span>
                  </div>
                )}
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune ligne de facture</p>
                <Button onClick={addItem} variant="outline" size="sm" className="mt-2">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une ligne
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Notes ou mentions légales..."
          />
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">
        {loading ? "Création en cours..." : (
          <>
            <FileText className="h-4 w-4 mr-2" />
            Créer la facture (Brouillon)
          </>
        )}
      </Button>
    </div>
  );
}

// Component: Invoice List
function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; invoiceNumber: string } | null>(null);

  // Utiliser la société active du store (sélectionnée dans le header)
  const activeSocieteId = useSocieteStore((state) => state.activeSocieteId);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiCall<{ invoices: Invoice[]; total: number }>('/invoice-service/invoices');
      setInvoices(result.invoices || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleValidate = async (id: string) => {
    setActionLoading(id);
    try {
      const headers: Record<string, string> = {};
      if (activeSocieteId) {
        headers['x-societe-id'] = activeSocieteId;
      }
      await apiCall(`/invoice-service/invoices/${id}/validate`, {
        method: 'POST',
        headers,
      });
      toast.success('Facture validée ! PDF Factur-X généré.' + (activeSocieteId ? ' (avec branding société)' : ''));
      fetchInvoices();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la validation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (id: string) => {
    setActionLoading(id);
    try {
      await apiCall(`/invoice-service/invoices/${id}/mark-paid`, { method: 'POST' });
      toast.success('Facture marquée comme payée');
      fetchInvoices();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreditNote = async (id: string) => {
    setActionLoading(id);
    try {
      const creditNote = await apiCall<Invoice>(`/invoice-service/invoices/${id}/credit-note`, { method: 'POST' });
      toast.success(`Avoir créé: ${creditNote.invoiceNumber}`);
      fetchInvoices();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await apiCall(`/invoice-service/invoices/${id}`, { method: 'DELETE' });
      toast.success('Facture supprimée');
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async (id: string, invoiceNumber: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`${API_BASE_URL}/invoice-service/invoices/${id}/pdf`);
      if (!response.ok) throw new Error('PDF non disponible');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF téléchargé');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur de téléchargement');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePreviewPdf = async (id: string, invoiceNumber: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`${API_BASE_URL}/invoice-service/invoices/${id}/pdf`);
      if (!response.ok) throw new Error('PDF non disponible');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfPreview({ url, invoiceNumber });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur de prévisualisation');
    } finally {
      setActionLoading(null);
    }
  };

  const closePdfPreview = () => {
    if (pdfPreview) {
      window.URL.revokeObjectURL(pdfPreview.url);
      setPdfPreview(null);
    }
  };

  return (
    <div className="space-y-6">
      <HelpSection title="Gestion des factures">
        <p><strong>BROUILLON</strong> → Modifiable et supprimable</p>
        <p><strong>VALIDÉE</strong> → PDF Factur-X généré, immuable. Peut être marquée payée ou avoir créé.</p>
        <p><strong>PAYÉE</strong> → Paiement enregistré. Avoir possible.</p>
        <p><strong>AVOIR</strong> → Annule partiellement ou totalement une facture.</p>
      </HelpSection>

      {activeSocieteId && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Branding actif</AlertTitle>
          <AlertDescription>
            La société sélectionnée dans le header sera utilisée pour le branding des factures validées.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Factures ({invoices.length})
            </span>
            <Button onClick={fetchInvoices} disabled={loading} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune facture</p>
              <Button onClick={fetchInvoices} variant="link">Charger les factures</Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedInvoice?.id === invoice.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
                          <Badge variant={STATUS_MAP[invoice.status]?.variant || 'outline'}>
                            {STATUS_MAP[invoice.status]?.label || 'INCONNU'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Bouton preview rapide pour les factures validées */}
                        {invoice.status >= 1 && invoice.pdfPath && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(invoice);
                              handlePreviewPdf(invoice.id, invoice.invoiceNumber);
                            }}
                            title="Prévisualiser le PDF"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </Button>
                        )}
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(invoice.totalTTC)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(invoice.issueDate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {selectedInvoice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Détails: {selectedInvoice.invoiceNumber}</span>
              <Badge variant={STATUS_MAP[selectedInvoice.status]?.variant || 'outline'}>
                {STATUS_MAP[selectedInvoice.status]?.label || 'INCONNU'}
              </Badge>
            </CardTitle>
            <CardDescription>{selectedInvoice.customerName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total HT</p>
                <p className="font-medium">{formatCurrency(selectedInvoice.totalHT)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">TVA</p>
                <p className="font-medium">{formatCurrency(selectedInvoice.totalTVA)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total TTC</p>
                <p className="font-bold text-lg">{formatCurrency(selectedInvoice.totalTTC)}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Lignes ({selectedInvoice.items.length})</p>
              <div className="space-y-1 text-sm">
                {selectedInvoice.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span>{item.quantity} x {item.description}</span>
                    <span>{formatCurrency(item.totalTTC || 0)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              {/* Actions selon le statut */}
              {selectedInvoice.status === 0 && (
                <>
                  <Button
                    onClick={() => handleValidate(selectedInvoice.id)}
                    disabled={actionLoading === selectedInvoice.id}
                  >
                    {actionLoading === selectedInvoice.id ? (
                      "Validation..."
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Valider & Générer PDF
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedInvoice.id)}
                    disabled={actionLoading === selectedInvoice.id}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </>
              )}

              {selectedInvoice.status === 1 && (
                <>
                  <Button
                    onClick={() => handleMarkPaid(selectedInvoice.id)}
                    disabled={actionLoading === selectedInvoice.id}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Marquer payée
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCreditNote(selectedInvoice.id)}
                    disabled={actionLoading === selectedInvoice.id}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Créer avoir
                  </Button>
                </>
              )}

              {selectedInvoice.status === 2 && (
                <Button
                  variant="outline"
                  onClick={() => handleCreditNote(selectedInvoice.id)}
                  disabled={actionLoading === selectedInvoice.id}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Créer avoir
                </Button>
              )}

              {/* PDF disponible pour les factures validées */}
              {selectedInvoice.status >= 1 && selectedInvoice.pdfPath && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handlePreviewPdf(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                    disabled={actionLoading === selectedInvoice.id}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Prévisualiser
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                    disabled={actionLoading === selectedInvoice.id}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </>
              )}
            </div>

            {selectedInvoice.validatedAt && (
              <p className="text-xs text-muted-foreground">
                Validée le {formatDate(selectedInvoice.validatedAt)}
              </p>
            )}
            {selectedInvoice.paidAt && (
              <p className="text-xs text-muted-foreground">
                Payée le {formatDate(selectedInvoice.paidAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de prévisualisation PDF */}
      <Dialog open={!!pdfPreview} onOpenChange={(open) => !open && closePdfPreview()}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {pdfPreview?.invoiceNumber}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (pdfPreview && selectedInvoice) {
                    handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoiceNumber);
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          </DialogHeader>
          {pdfPreview && (
            <iframe
              src={pdfPreview.url}
              className="flex-1 w-full border-0"
              title={`Prévisualisation ${pdfPreview.invoiceNumber}`}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Interface pour les paramètres de facturation
interface FactureSettings {
  id?: string;
  societeId: string;
  logoBase64?: string;
  logoMimeType?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companySiret?: string;
  companyTvaNumber?: string;
  companyRcs?: string;
  companyCapital?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  headerText?: string;
  footerText?: string;
  legalMentions?: string;
  paymentTerms?: string;
  invoicePrefix?: string;
  showLogo?: boolean;
  logoPosition?: string;
}

// Component: Branding Settings
function BrandingSettings() {
  const activeSocieteId = useSocieteStore((state) => state.activeSocieteId);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<FactureSettings | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Charger les settings existants
  const fetchSettings = useCallback(async () => {
    if (!activeSocieteId) {
      setSettings(null);
      setLogoPreview(null);
      return;
    }

    setLoading(true);
    try {
      const data = await apiCall<FactureSettings>(`/facture-settings/societe/${activeSocieteId}`);
      setSettings(data);
      if (data.logoBase64) {
        setLogoPreview(`data:${data.logoMimeType || 'image/png'};base64,${data.logoBase64}`);
      }
    } catch {
      // Pas de settings existants, créer un nouveau
      setSettings({
        societeId: activeSocieteId,
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        showLogo: true,
        logoPosition: 'left',
      });
    } finally {
      setLoading(false);
    }
  }, [activeSocieteId]);

  // Charger au montage et quand la société change
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Supprimer le logo
  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setSettings(prev => prev ? {
      ...prev,
      logoBase64: undefined,
      logoMimeType: undefined,
    } : null);
  };

  // Sauvegarder les settings
  const handleSave = async () => {
    if (!settings || !activeSocieteId) {
      toast.error('Veuillez sélectionner une société');
      return;
    }

    // Validation côté client
    if (settings.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(settings.primaryColor)) {
      toast.error('La couleur principale doit être au format #RRGGBB');
      return;
    }

    if (settings.secondaryColor && !/^#[0-9A-Fa-f]{6}$/.test(settings.secondaryColor)) {
      toast.error('La couleur secondaire doit être au format #RRGGBB');
      return;
    }

    if (settings.logoMimeType && !['image/png', 'image/jpeg', 'image/jpg'].includes(settings.logoMimeType)) {
      toast.error('Le logo doit être au format PNG ou JPEG');
      return;
    }

    setSaving(true);
    try {
      // Filtrer uniquement les champs autorisés par le DTO
      const updatePayload = {
        logoBase64: settings.logoBase64,
        logoMimeType: settings.logoMimeType,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        companyName: settings.companyName,
        companyAddress: settings.companyAddress,
        companyPhone: settings.companyPhone,
        companyEmail: settings.companyEmail,
        companySiret: settings.companySiret,
        companyTvaNumber: settings.companyTvaNumber,
        companyRcs: settings.companyRcs,
        companyCapital: settings.companyCapital,
        iban: settings.iban,
        bic: settings.bic,
        bankName: settings.bankName,
        headerText: settings.headerText,
        footerText: settings.footerText,
        legalMentions: settings.legalMentions,
        paymentTerms: settings.paymentTerms,
        invoicePrefix: settings.invoicePrefix,
        showLogo: settings.showLogo,
        logoPosition: settings.logoPosition,
      };

      if (settings.id) {
        await apiCall(`/facture-settings/${settings.id}`, {
          method: 'PUT',
          body: JSON.stringify(updatePayload),
        });
      } else {
        const createPayload = { ...updatePayload, societeId: activeSocieteId };
        const created = await apiCall<FactureSettings>('/facture-settings', {
          method: 'POST',
          body: JSON.stringify(createPayload),
        });
        setSettings(created);
      }
      toast.success('Paramètres de branding sauvegardés !');
    } catch (error) {
      console.error('Erreur sauvegarde branding:', error);
      if (error instanceof Error) {
        toast.error(`Erreur: ${error.message}`);
      } else {
        toast.error('Erreur lors de la sauvegarde des paramètres');
      }
    } finally {
      setSaving(false);
    }
  };

  // Mettre à jour un champ
  const updateField = (field: keyof FactureSettings, value: string | boolean) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (!activeSocieteId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Aucune société sélectionnée</AlertTitle>
        <AlertDescription>
          Sélectionnez une société dans le header pour configurer son branding de facturation.
        </AlertDescription>
      </Alert>
    );
  }


  return (
    <div className="space-y-6">
      <HelpSection title="Configuration du branding">
        <p>Personnalisez l'apparence des factures PDF pour cette société.</p>
        <p>Le logo, les couleurs et les informations seront utilisés lors de la génération des PDF.</p>
      </HelpSection>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Logo de la société
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {logoPreview ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoPreview}
                    alt="Logo de la société"
                    className="h-24 max-w-48 object-contain border rounded-lg p-2 bg-white"
                    style={{ minWidth: '100px' }}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="h-24 w-48 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground bg-muted/30">
                  <span className="text-sm">Aucun logo</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-upload-input">Télécharger un logo</Label>
              <input
                id="logo-upload-input"
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const dataUrl = reader.result as string;
                    const base64 = dataUrl.split(',')[1];
                    setLogoPreview(dataUrl);
                    setSettings(prev => ({
                      ...(prev || { societeId: activeSocieteId || '', primaryColor: '#2563eb', secondaryColor: '#64748b', showLogo: true, logoPosition: 'left' }),
                      logoBase64: base64,
                      logoMimeType: file.type,
                    }));
                    toast.success('Logo chargé !');
                  };
                  reader.onerror = () => {
                    toast.error('Erreur lors de la lecture du fichier');
                  };
                  reader.readAsDataURL(file);
                }}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                PNG ou JPEG. Recommandé: 300x100 pixels.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Couleurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Couleurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Couleur principale</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={settings?.primaryColor || '#2563eb'}
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={settings?.primaryColor || '#2563eb'}
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                  placeholder="#2563eb"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Couleur secondaire</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={settings?.secondaryColor || '#64748b'}
                  onChange={(e) => updateField('secondaryColor', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={settings?.secondaryColor || '#64748b'}
                  onChange={(e) => updateField('secondaryColor', e.target.value)}
                  placeholder="#64748b"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations entreprise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations de l'entreprise
          </CardTitle>
          <CardDescription>
            Ces informations apparaîtront sur les factures générées.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Raison sociale</Label>
              <Input
                value={settings?.companyName || ''}
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="Ma Société SAS"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={settings?.companyEmail || ''}
                onChange={(e) => updateField('companyEmail', e.target.value)}
                placeholder="contact@masociete.fr"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Textarea
              value={settings?.companyAddress || ''}
              onChange={(e) => updateField('companyAddress', e.target.value)}
              placeholder="123 Rue de l'Exemple&#10;75001 Paris"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={settings?.companyPhone || ''}
                onChange={(e) => updateField('companyPhone', e.target.value)}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
            <div className="space-y-2">
              <Label>SIRET</Label>
              <Input
                value={settings?.companySiret || ''}
                onChange={(e) => updateField('companySiret', e.target.value)}
                placeholder="123 456 789 00010"
              />
            </div>
            <div className="space-y-2">
              <Label>N° TVA</Label>
              <Input
                value={settings?.companyTvaNumber || ''}
                onChange={(e) => updateField('companyTvaNumber', e.target.value)}
                placeholder="FR12345678901"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>RCS</Label>
              <Input
                value={settings?.companyRcs || ''}
                onChange={(e) => updateField('companyRcs', e.target.value)}
                placeholder="Paris B 123 456 789"
              />
            </div>
            <div className="space-y-2">
              <Label>Capital social</Label>
              <Input
                value={settings?.companyCapital || ''}
                onChange={(e) => updateField('companyCapital', e.target.value)}
                placeholder="10 000 €"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coordonnées bancaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Coordonnées bancaires
          </CardTitle>
          <CardDescription>
            Affichées sur les factures pour le paiement par virement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input
                value={settings?.iban || ''}
                onChange={(e) => updateField('iban', e.target.value)}
                placeholder="FR76 1234 5678 9012 3456 7890 123"
              />
            </div>
            <div className="space-y-2">
              <Label>BIC</Label>
              <Input
                value={settings?.bic || ''}
                onChange={(e) => updateField('bic', e.target.value)}
                placeholder="BNPAFRPP"
              />
            </div>
            <div className="space-y-2">
              <Label>Banque</Label>
              <Input
                value={settings?.bankName || ''}
                onChange={(e) => updateField('bankName', e.target.value)}
                placeholder="BNP Paribas"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Textes personnalisés */}
      <Card>
        <CardHeader>
          <CardTitle>Textes personnalisés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Texte d'en-tête</Label>
            <Input
              value={settings?.headerText || ''}
              onChange={(e) => updateField('headerText', e.target.value)}
              placeholder="Ex: Facture - Document officiel"
            />
          </div>
          <div className="space-y-2">
            <Label>Texte de pied de page</Label>
            <Textarea
              value={settings?.footerText || ''}
              onChange={(e) => updateField('footerText', e.target.value)}
              placeholder="Ex: Merci de votre confiance !"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Mentions légales</Label>
            <Textarea
              value={settings?.legalMentions || ''}
              onChange={(e) => updateField('legalMentions', e.target.value)}
              placeholder="Ex: TVA non applicable, art. 293 B du CGI"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Conditions de paiement</Label>
              <Input
                value={settings?.paymentTerms || ''}
                onChange={(e) => updateField('paymentTerms', e.target.value)}
                placeholder="Paiement à 30 jours"
              />
            </div>
            <div className="space-y-2">
              <Label>Préfixe des factures</Label>
              <Input
                value={settings?.invoicePrefix || ''}
                onChange={(e) => updateField('invoicePrefix', e.target.value)}
                placeholder="FAC"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <Button onClick={handleSave} disabled={saving || loading} className="w-full" size="lg">
        {saving ? "Sauvegarde..." : (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Sauvegarder les paramètres
          </>
        )}
      </Button>
    </div>
  );
}

export default function TestFacturesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FileCheck className="h-8 w-8" />
          Test Service Factures
        </h1>
        <p className="text-muted-foreground">
          Page de test pour le microservice de facturation (gRPC → REST proxy)
        </p>
      </div>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertTitle>Service gRPC</AlertTitle>
        <AlertDescription>
          Cette page teste le service <code className="px-1 bg-muted rounded">service-factures</code> via
          le proxy REST <code className="px-1 bg-muted rounded">/invoice-service/*</code>.
          Assurez-vous que le service gRPC tourne sur le port configuré.
        </AlertDescription>
      </Alert>

      <div className="mb-6">
        <ServiceHealthCheck />
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Liste des factures
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Créer une facture
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <InvoiceList key={refreshKey} />
        </TabsContent>

        <TabsContent value="create">
          <CreateInvoiceForm onCreated={() => setRefreshKey(k => k + 1)} />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
