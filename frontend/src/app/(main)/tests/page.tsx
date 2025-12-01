"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Search, DollarSign, CheckCircle, AlertCircle, Loader2, MapPin } from "lucide-react"
import { useMaileva } from "@/hooks/email"
import type { MailevaAddress, MailevaLabelRequest, MailevaPricingRequest } from "@/types/maileva"

export default function ContratsTestPage() {
  const {
    generateLabel,
    labelLoading,
    labelError,
    labelData,
    trackShipment,
    trackingLoading,
    trackingError,
    trackingData,
    simulatePricing,
    pricingLoading,
    pricingError,
    pricingData,
    validateAddress,
    validationLoading,
    validationError,
    validationData,
  } = useMaileva()

  // ============================================================================
  // État pour le formulaire d'étiquette
  // ============================================================================
  const [labelForm, setLabelForm] = React.useState<MailevaLabelRequest>({
    recipient: {
      line1: "123 Rue de la Paix",
      line2: "Appartement 4B",
      postalCode: "75001",
      city: "Paris",
      country: "FR",
    },
    sender: {
      line1: "456 Avenue des Champs",
      postalCode: "69001",
      city: "Lyon",
      country: "FR",
    },
    serviceLevel: "FAST",
    format: "A4",
    weightGr: 500,
  })

  // ============================================================================
  // État pour le suivi
  // ============================================================================
  const [trackingNumber, setTrackingNumber] = React.useState("")

  // ============================================================================
  // État pour la tarification
  // ============================================================================
  const [pricingForm, setPricingForm] = React.useState<MailevaPricingRequest>({
    serviceLevel: "FAST",
    format: "A4",
    weightGr: 500,
    originCountry: "FR",
    destinationCountry: "FR",
  })

  // ============================================================================
  // État pour la validation d'adresse
  // ============================================================================
  const [addressForm, setAddressForm] = React.useState<MailevaAddress>({
    line1: "10 Rue de Rivoli",
    postalCode: "75001",
    city: "Paris",
    country: "FR",
  })

  // ============================================================================
  // Handlers
  // ============================================================================
  const handleGenerateLabel = async () => {
    try {
      await generateLabel(labelForm)
    } catch (err) {
      console.error("Erreur lors de la génération de l'étiquette:", err)
    }
  }

  const handleTrackShipment = async () => {
    if (!trackingNumber.trim()) return
    try {
      await trackShipment(trackingNumber)
    } catch (err) {
      console.error("Erreur lors du suivi:", err)
    }
  }

  const handleSimulatePricing = async () => {
    try {
      await simulatePricing(pricingForm)
    } catch (err) {
      console.error("Erreur lors de la simulation:", err)
    }
  }

  const handleValidateAddress = async () => {
    try {
      await validateAddress(addressForm)
    } catch (err) {
      console.error("Erreur lors de la validation:", err)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 min-h-0 overflow-auto">
      <div className="flex items-center gap-2">
        <Package className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">Test des hooks Maileva</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ============================================================================ */}
        {/* Génération d'étiquette */}
        {/* ============================================================================ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5" />
              Générer une étiquette
            </CardTitle>
            <CardDescription>Créer une étiquette d&apos;envoi postal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Destinataire - Ligne 1</Label>
              <Input
                value={labelForm.recipient.line1}
                onChange={(e) =>
                  setLabelForm({
                    ...labelForm,
                    recipient: { ...labelForm.recipient, line1: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Code postal</Label>
              <Input
                value={labelForm.recipient.postalCode}
                onChange={(e) =>
                  setLabelForm({
                    ...labelForm,
                    recipient: { ...labelForm.recipient, postalCode: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input
                value={labelForm.recipient.city}
                onChange={(e) =>
                  setLabelForm({
                    ...labelForm,
                    recipient: { ...labelForm.recipient, city: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Niveau de service</Label>
              <Select
                value={labelForm.serviceLevel}
                onValueChange={(value) =>
                  setLabelForm({ ...labelForm, serviceLevel: value as MailevaLabelRequest["serviceLevel"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="FAST">Rapide</SelectItem>
                  <SelectItem value="ECONOMIC">Économique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Poids (grammes)</Label>
              <Input
                type="number"
                value={labelForm.weightGr}
                onChange={(e) =>
                  setLabelForm({ ...labelForm, weightGr: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <Button onClick={handleGenerateLabel} disabled={labelLoading} className="w-full">
              {labelLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Package className="size-4 mr-2" />
                  Générer l&apos;étiquette
                </>
              )}
            </Button>

            {labelError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{labelError.message}</AlertDescription>
              </Alert>
            )}

            {labelData && (
              <Alert>
                <CheckCircle className="size-4" />
                <AlertDescription className="space-y-2">
                  <div>
                    <strong>Numéro de suivi:</strong> {labelData.trackingNumber}
                  </div>
                  <div>
                    <strong>Date de livraison estimée:</strong> {labelData.estimatedDeliveryDate}
                  </div>
                  <Button size="sm" variant="link" asChild className="p-0 h-auto">
                    <a href={labelData.labelUrl} target="_blank" rel="noopener noreferrer">
                      Télécharger l&apos;étiquette
                    </a>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* ============================================================================ */}
        {/* Suivi d envoi */}
        {/* ============================================================================ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="size-5" />
              Suivre un envoi
            </CardTitle>
            <CardDescription>Vérifier le statut d&apos;un colis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Numéro de suivi</Label>
              <Input
                placeholder="Entrez le numéro de suivi"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <Button onClick={handleTrackShipment} disabled={trackingLoading} className="w-full">
              {trackingLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Recherche...
                </>
              ) : (
                <>
                  <Search className="size-4 mr-2" />
                  Suivre
                </>
              )}
            </Button>

            {trackingError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{trackingError.message}</AlertDescription>
              </Alert>
            )}

            {trackingData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Statut:</span>
                  <Badge>{trackingData.status}</Badge>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="text-sm font-medium">Historique:</div>
                  {trackingData.events.map((event, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                      <div className="flex-1">
                        <div className="font-medium">{event.label}</div>
                        <div className="text-muted-foreground text-xs">
                          {event.date}
                          {event.location && ` • ${event.location}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============================================================================ */}
        {/* Simulation de tarif */}
        {/* ============================================================================ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-5" />
              Simuler un tarif
            </CardTitle>
            <CardDescription>Calculer le coût d&apos;un envoi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Niveau de service</Label>
              <Select
                value={pricingForm.serviceLevel}
                onValueChange={(value) => setPricingForm({ ...pricingForm, serviceLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="FAST">Rapide</SelectItem>
                  <SelectItem value="ECONOMIC">Économique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Input
                value={pricingForm.format}
                onChange={(e) => setPricingForm({ ...pricingForm, format: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Poids (grammes)</Label>
              <Input
                type="number"
                value={pricingForm.weightGr}
                onChange={(e) =>
                  setPricingForm({ ...pricingForm, weightGr: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <Button onClick={handleSimulatePricing} disabled={pricingLoading} className="w-full">
              {pricingLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Calcul...
                </>
              ) : (
                <>
                  <DollarSign className="size-4 mr-2" />
                  Calculer le tarif
                </>
              )}
            </Button>

            {pricingError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{pricingError.message}</AlertDescription>
              </Alert>
            )}

            {pricingData && (
              <Alert>
                <CheckCircle className="size-4" />
                <AlertDescription className="space-y-2">
                  <div className="text-lg font-bold">
                    {pricingData.totalPrice.toFixed(2)} {pricingData.currency}
                  </div>
                  <div className="text-sm">
                    Livraison estimée en {pricingData.estimatedDeliveryDays} jour(s)
                  </div>
                  {pricingData.breakdown.length > 0 && (
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">Détails:</div>
                      {pricingData.breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span>{item.amount.toFixed(2)} {pricingData.currency}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* ============================================================================ */}
        {/* Validation d'adresse */}
        {/* ============================================================================ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5" />
              Valider une adresse
            </CardTitle>
            <CardDescription>Vérifier et normaliser une adresse</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ligne 1</Label>
              <Input
                value={addressForm.line1}
                onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ligne 2 (optionnel)</Label>
              <Input
                value={addressForm.line2 || ""}
                onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Code postal</Label>
              <Input
                value={addressForm.postalCode}
                onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              />
            </div>
            <Button onClick={handleValidateAddress} disabled={validationLoading} className="w-full">
              {validationLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Validation...
                </>
              ) : (
                <>
                  <MapPin className="size-4 mr-2" />
                  Valider l&apos;adresse
                </>
              )}
            </Button>

            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{validationError.message}</AlertDescription>
              </Alert>
            )}

            {validationData && (
              <Alert variant={validationData.isValid ? "default" : "destructive"}>
                {validationData.isValid ? (
                  <CheckCircle className="size-4" />
                ) : (
                  <AlertCircle className="size-4" />
                )}
                <AlertDescription className="space-y-2">
                  <div>
                    <strong>Statut:</strong>{" "}
                    {validationData.isValid ? "Adresse valide" : "Adresse invalide"}
                  </div>
                  {validationData.isValid && (
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">Adresse normalisée:</div>
                      <div>{validationData.normalizedAddress.line1}</div>
                      {validationData.normalizedAddress.line2 && (
                        <div>{validationData.normalizedAddress.line2}</div>
                      )}
                      <div>
                        {validationData.normalizedAddress.postalCode}{" "}
                        {validationData.normalizedAddress.city}
                      </div>
                      <div>{validationData.normalizedAddress.country}</div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
