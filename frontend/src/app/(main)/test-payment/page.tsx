"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { RefreshCw, CreditCard, Wallet, Users, Info, Globe } from "lucide-react"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"

// Components - Payment
import {
  ScheduleTable,
  ScheduleForm,
  PaymentIntentTable,
  PaymentIntentForm,
  PaymentEventTable,
} from "@/components/payment"

// Components - GoCardless
import {
  GocardlessMandateStatus,
  GocardlessSetupMandate,
  GocardlessPaymentForm,
  GocardlessSubscriptionForm,
  GocardlessPaymentsTable,
  GocardlessSubscriptionsTable,
} from "@/components/gocardless"

// Components - Stripe
import { PaymentForm, CheckoutButton, SubscriptionForm, type Plan } from "@/components/stripe"
import { TEST_CARDS } from "@/lib/stripe"

// Hooks - Payment
import {
  useSchedules,
  useCreateSchedule,
  useDeleteSchedule,
  usePaymentIntents,
  useCreatePaymentIntent,
  useDeletePaymentIntent,
  usePaymentEvents,
  useTriggerPaymentProcessing,
} from "@/hooks/payment"

// Hooks - GoCardless
import { useGoCardless } from "@/hooks/gocardless"

// Hooks - Clients
import { useClients } from "@/hooks/clients"
import { useOrganisation } from "@/contexts/organisation-context"
import { useSocieteStore } from "@/stores/societe-store"

// Stripe Plans
// Composant d'explication réutilisable
function ExplainerCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">{title}</h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">{children}</p>
        </div>
      </div>
    </div>
  )
}

const STRIPE_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceId: 'price_starter',
    price: 29,
    currency: 'eur',
    interval: 'month',
    features: ['5 utilisateurs', '10 Go stockage', 'Support email'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceId: 'price_pro',
    price: 79,
    currency: 'eur',
    interval: 'month',
    features: ['25 utilisateurs', '100 Go stockage', 'Support prioritaire', 'API access'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceId: 'price_enterprise',
    price: 199,
    currency: 'eur',
    interval: 'month',
    features: ['Utilisateurs illimités', 'Stockage illimité', 'Support dédié', 'SLA garanti'],
  },
]

export default function TestPaymentPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("stripe")
  const [testClientId, setTestClientId] = useState("")

  // Organisation & Clients
  const { activeOrganisation } = useOrganisation()
  const activeSocieteId = useSocieteStore((state) => state.activeSocieteId)
  const { clients } = useClients(
    activeOrganisation?.organisationId ? { organisationId: activeOrganisation.organisationId } : undefined
  )
  const clientsLoading = false // Hook doesn't track loading state

  // Stripe state
  const [stripeAmount, setStripeAmount] = useState(2500)
  const [showStripeForm, setShowStripeForm] = useState(false)

  // PayPal state
  const [paypalAmount, setPaypalAmount] = useState(2999)
  const [paypalLoading, setPaypalLoading] = useState(false)
  const [paypalConfigLoading, setPaypalConfigLoading] = useState(false)
  const [paypalClientId, setPaypalClientId] = useState("AdecImte9HltAZDPnvQqCiYdGpBbssekN8QkkzFQOTaig6klmo8hL7yrxjhkZPwKRl5nilmaWRFu5CHB")
  const [paypalClientSecret, setPaypalClientSecret] = useState("")
  const [paypalCaptureResult, setPaypalCaptureResult] = useState<{
    success: boolean
    orderId?: string
    status?: string
    payer?: { email?: string; name?: string }
  } | null>(null)

  // Handle PayPal callback after redirect
  useEffect(() => {
    const paypalStatus = searchParams.get('paypal')
    const token = searchParams.get('token') // PayPal order ID
    const payerId = searchParams.get('PayerID')

    if (paypalStatus === 'success' && token && activeSocieteId) {
      // Capture the order
      const captureOrder = async () => {
        setPaypalLoading(true)
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'}/paypal/orders/${token}/capture`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ societeId: activeSocieteId }),
            }
          )
          const data = await response.json()
          console.log('PayPal capture response:', data)

          if (response.ok && data.status === 'COMPLETED') {
            setPaypalCaptureResult({
              success: true,
              orderId: data.id,
              status: data.status,
              payer: {
                email: data.payer?.emailAddress,
                name: data.payer?.name ? `${data.payer.name.givenName} ${data.payer.name.surname}` : undefined,
              },
            })
            toast.success('Paiement PayPal capturé avec succès!')
            setActiveTab('paypal')
          } else {
            setPaypalCaptureResult({ success: false, orderId: token, status: data.status })
            toast.error(`Échec de la capture: ${data.message || data.status}`)
          }
        } catch (error) {
          console.error('PayPal capture error:', error)
          toast.error('Erreur lors de la capture du paiement')
          setPaypalCaptureResult({ success: false, orderId: token })
        } finally {
          setPaypalLoading(false)
          // Clean URL
          window.history.replaceState({}, '', '/test-payment')
        }
      }
      captureOrder()
    } else if (paypalStatus === 'cancel') {
      toast.info('Paiement PayPal annulé')
      setActiveTab('paypal')
      window.history.replaceState({}, '', '/test-payment')
    }
  }, [searchParams, activeSocieteId])

  // Schedules
  const { schedules, refetch: refetchSchedules } = useSchedules()
  const { createSchedule } = useCreateSchedule()
  const { deleteSchedule } = useDeleteSchedule()
  const { triggerProcessing } = useTriggerPaymentProcessing()
  // Loading states not provided by hooks - use local state if needed
  const schedulesLoading = false
  const createScheduleLoading = false
  const processingLoading = false

  // Payment Intents
  const {
    paymentIntents,
    refetch: refetchPaymentIntents,
  } = usePaymentIntents()
  const { createPaymentIntent } =
    useCreatePaymentIntent()
  const { deletePaymentIntent } = useDeletePaymentIntent()
  const paymentIntentsLoading = false
  const createPaymentIntentLoading = false

  // Payment Events
  const {
    paymentEvents,
    refetch: refetchPaymentEvents,
  } = usePaymentEvents()
  const paymentEventsLoading = false

  // GoCardless
  const {
    mandate,
    payments: gcPayments,
    subscriptions: gcSubscriptions,
    hasMandateActive,
    setupMandate,
    fetchMandate,
    cancelMandate,
    createPayment: createGcPayment,
    fetchPayments: fetchGcPayments,
    cancelPayment: cancelGcPayment,
    retryPayment: retryGcPayment,
    createSubscription: createGcSubscription,
    fetchSubscriptions: fetchGcSubscriptions,
    cancelSubscription: cancelGcSubscription,
    pauseSubscription: pauseGcSubscription,
    resumeSubscription: resumeGcSubscription,
    createBillingRequestFlow,
  } = useGoCardless({
    clientId: testClientId,
    autoFetchMandate: !!testClientId,
  })
  const gcLoading = false

  // Handlers - Schedule
  const handleCreateSchedule = async (data: unknown) => {
    try {
      await createSchedule(data as Parameters<typeof createSchedule>[0])
      toast.success("Schedule créé avec succès!")
      refetchSchedules()
    } catch (error) {
      const message = error instanceof ApiError
        ? error.getUserMessage()
        : "Erreur lors de la création du schedule"
      toast.error(message)
      throw error
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteSchedule(id)
      toast.success("Schedule supprimé avec succès!")
      refetchSchedules()
    } catch (error) {
      const message = error instanceof ApiError
        ? error.getUserMessage()
        : "Erreur lors de la suppression du schedule"
      toast.error(message)
    }
  }

  // Handlers - Payment Intent
  const handleCreatePaymentIntent = async (data: unknown) => {
    try {
      await createPaymentIntent(data as Parameters<typeof createPaymentIntent>[0])
      toast.success("Payment Intent créé avec succès!")
      refetchPaymentIntents()
    } catch (error) {
      const message = error instanceof ApiError
        ? error.getUserMessage()
        : "Erreur lors de la création du payment intent"
      toast.error(message)
    }
  }

  const handleDeletePaymentIntent = async (id: string) => {
    try {
      await deletePaymentIntent(id)
      toast.success("Payment Intent supprimé avec succès!")
      refetchPaymentIntents()
    } catch (error) {
      const message = error instanceof ApiError
        ? error.getUserMessage()
        : "Erreur lors de la suppression du payment intent"
      toast.error(message)
    }
  }

  // Handlers - GoCardless
  const handleSetupMandate = async () => {
    const url = await setupMandate()
    if (url) {
      toast.success("Redirection vers GoCardless...")
      window.location.href = url
    } else {
      toast.error("Erreur lors de la configuration du mandat")
    }
    return url
  }

  const handleCancelMandate = async () => {
    try {
      await cancelMandate()
      toast.success("Mandat annulé avec succès!")
    } catch {
      toast.error("Erreur lors de l'annulation du mandat")
    }
  }

  const handleCreateGcPayment = async (data: Parameters<typeof createGcPayment>[0]) => {
    const result = await createGcPayment(data)
    if (result) {
      toast.success(`Paiement créé! Prélèvement prévu le ${result.chargeDate}`)
    } else {
      toast.error("Erreur lors de la création du paiement")
    }
    return result
  }

  const handleCancelGcPayment = async (paymentId: string) => {
    try {
      await cancelGcPayment(paymentId)
      toast.success("Paiement annulé!")
    } catch {
      toast.error("Erreur lors de l'annulation du paiement")
    }
  }

  const handleRetryGcPayment = async (paymentId: string) => {
    try {
      await retryGcPayment(paymentId)
      toast.success("Paiement relancé!")
    } catch {
      toast.error("Erreur lors de la relance du paiement")
    }
  }

  const handleCreateGcSubscription = async (data: Parameters<typeof createGcSubscription>[0]) => {
    const result = await createGcSubscription(data)
    if (result) {
      toast.success("Abonnement créé avec succès!")
    } else {
      toast.error("Erreur lors de la création de l'abonnement")
    }
    return result
  }

  const handleCancelGcSubscription = async (subscriptionId: string) => {
    try {
      await cancelGcSubscription(subscriptionId)
      toast.success("Abonnement annulé!")
    } catch {
      toast.error("Erreur lors de l'annulation de l'abonnement")
    }
  }

  const handlePauseGcSubscription = async (subscriptionId: string) => {
    try {
      await pauseGcSubscription(subscriptionId)
      toast.success("Abonnement mis en pause!")
    } catch {
      toast.error("Erreur lors de la mise en pause")
    }
  }

  const handleResumeGcSubscription = async (subscriptionId: string) => {
    try {
      await resumeGcSubscription(subscriptionId)
      toast.success("Abonnement repris!")
    } catch {
      toast.error("Erreur lors de la reprise")
    }
  }

  // Handler - Stripe
  const handleStripePaymentSuccess = (paymentIntentId: string) => {
    toast.success(`Paiement Stripe réussi! ID: ${paymentIntentId}`)
    setShowStripeForm(false)
  }

  const handleStripePaymentError = (error: string) => {
    toast.error(`Erreur Stripe: ${error}`)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Payment System</h1>
          <p className="text-muted-foreground">
            Page de test pour Stripe, GoCardless, Schedules, Payment Intents et Events
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="stripe" className="gap-2">
            <Wallet className="h-4 w-4" />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="paypal" className="gap-2">
            <Globe className="h-4 w-4" />
            PayPal
          </TabsTrigger>
          <TabsTrigger value="gocardless" className="gap-2">
            <CreditCard className="h-4 w-4" />
            GoCardless
          </TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="payment-intents">Payment Intents</TabsTrigger>
          <TabsTrigger value="payment-events">Payment Events</TabsTrigger>
        </TabsList>

        {/* STRIPE TAB */}
        <TabsContent value="stripe" className="space-y-6">
          <ExplainerCard title="Qu'est-ce que Stripe ?">
            Stripe est un prestataire de paiement par carte bancaire. Il permet d&apos;accepter les paiements CB (Visa, Mastercard, etc.)
            en ligne. Les fonds sont collectés par Stripe puis virés sur votre compte bancaire (généralement sous 2-7 jours).
          </ExplainerCard>

          {/* Test Cards Info */}
          <Card>
            <CardHeader>
              <CardTitle>Cartes de test Stripe</CardTitle>
              <CardDescription>Utilisez ces numéros pour tester les différents scénarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(TEST_CARDS).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{value}</code>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Date expiration: n&apos;importe quelle date future | CVC: n&apos;importe quels 3 chiffres
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Elements Payment */}
            <div>
              <ExplainerCard title="Stripe Elements - Formulaire intégré">
                Le formulaire de paiement s&apos;affiche directement dans votre site. Le client ne quitte jamais votre page.
                Idéal pour une expérience fluide et personnalisable (vous contrôlez le design).
              </ExplainerCard>
              <Card>
                <CardHeader>
                  <CardTitle>Paiement Elements</CardTitle>
                <CardDescription>Formulaire intégré avec Stripe Elements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showStripeForm ? (
                  <>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="stripeAmount">Montant (centimes)</Label>
                        <Input
                          id="stripeAmount"
                          type="number"
                          value={stripeAmount}
                          onChange={(e) => setStripeAmount(Number(e.target.value))}
                          placeholder="2500"
                        />
                      </div>
                      <Button onClick={() => setShowStripeForm(true)}>
                        Afficher formulaire
                      </Button>
                    </div>
                    <div className="text-center py-4 text-muted-foreground">
                      Cliquez pour afficher le formulaire de paiement
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <Button variant="outline" size="sm" onClick={() => setShowStripeForm(false)}>
                      Modifier le montant
                    </Button>
                    <PaymentForm
                      amount={stripeAmount}
                      currency="eur"
                      title="Test de paiement"
                      description={`Montant: ${(stripeAmount / 100).toFixed(2)} EUR`}
                      onSuccess={handleStripePaymentSuccess}
                      onError={handleStripePaymentError}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            </div>

            {/* Checkout Redirect */}
            <div>
              <ExplainerCard title="Stripe Checkout - Page hébergée">
                Le client est redirigé vers une page de paiement hébergée par Stripe. Plus simple à mettre en place,
                conforme PCI-DSS par défaut. Stripe gère tout : design, traductions, 3D Secure, etc.
              </ExplainerCard>
              <Card>
                <CardHeader>
                  <CardTitle>Stripe Checkout</CardTitle>
                <CardDescription>Redirection vers la page Stripe hébergée</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium">Produit de test</p>
                    <p className="text-sm text-muted-foreground">Paiement unique - 49.99 EUR</p>
                  </div>
                  <CheckoutButton
                    amount={4999}
                    currency="eur"
                    productName="Produit de test"
                    productDescription="Test de paiement via Stripe Checkout"
                    mode="payment"
                    successUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/payment/success?session_id={CHECKOUT_SESSION_ID}`}
                    cancelUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/payment/cancel`}
                    className="w-full"
                  >
                    Payer avec Checkout
                  </CheckoutButton>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>

          {/* Subscriptions */}
          <ExplainerCard title="Abonnements Stripe">
            Les abonnements permettent de facturer automatiquement vos clients de manière récurrente (mensuel, annuel, etc.).
            Stripe gère les prélèvements automatiques, les relances en cas d&apos;échec, et les notifications au client.
          </ExplainerCard>
          <Card>
            <CardHeader>
              <CardTitle>Abonnements</CardTitle>
              <CardDescription>Sélectionnez un plan pour créer un abonnement</CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionForm
                plans={STRIPE_PLANS}
                userEmail="test@example.com"
                userName="Utilisateur Test"
                onSuccess={(subscriptionId) => toast.success(`Abonnement créé: ${subscriptionId}`)}
                onError={(error) => toast.error(error)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYPAL TAB */}
        <TabsContent value="paypal" className="space-y-6">
          <ExplainerCard title="Qu'est-ce que PayPal ?">
            PayPal est un portefeuille électronique mondial permettant aux clients de payer sans saisir leurs coordonnées bancaires.
            Le client se connecte à son compte PayPal ou paie par carte via PayPal. Les fonds sont transférés sous 1-3 jours.
          </ExplainerCard>


          {/* PayPal Capture Result */}
          {paypalCaptureResult && (
            <Card className={paypalCaptureResult.success ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-red-500 bg-red-50 dark:bg-red-950/20"}>
              <CardHeader>
                <CardTitle className={paypalCaptureResult.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                  {paypalCaptureResult.success ? "✅ Paiement PayPal Réussi!" : "❌ Échec du Paiement"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Order ID:</span>
                    <span className="ml-2 font-mono">{paypalCaptureResult.orderId}</span>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className="ml-2">{paypalCaptureResult.status}</span>
                  </div>
                  {paypalCaptureResult.payer?.email && (
                    <div>
                      <span className="font-medium">Email:</span>
                      <span className="ml-2">{paypalCaptureResult.payer.email}</span>
                    </div>
                  )}
                  {paypalCaptureResult.payer?.name && (
                    <div>
                      <span className="font-medium">Payeur:</span>
                      <span className="ml-2">{paypalCaptureResult.payer.name}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaypalCaptureResult(null)}
                  className="mt-4"
                >
                  Fermer
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Configuration du compte PayPal */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration du compte PayPal</CardTitle>
              <CardDescription>
                Configurez les credentials PayPal pour cette organisation (Sandbox ou Live)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paypalClientId">Client ID</Label>
                  <Input
                    id="paypalClientId"
                    value={paypalClientId}
                    onChange={(e) => setPaypalClientId(e.target.value)}
                    placeholder="Axxxxxxxxx..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypalClientSecret">Client Secret</Label>
                  <Input
                    id="paypalClientSecret"
                    type="password"
                    value={paypalClientSecret}
                    onChange={(e) => setPaypalClientSecret(e.target.value)}
                    placeholder="Exxxxxxxxx..."
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!activeSocieteId) {
                    toast.error("Sélectionnez une société dans le header")
                    return
                  }
                  if (!paypalClientId || !paypalClientSecret) {
                    toast.error("Remplissez le Client ID et le Client Secret")
                    return
                  }
                  setPaypalConfigLoading(true)
                  try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'}/paypal-accounts`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        societeId: activeSocieteId,
                        nom: "PayPal Sandbox Test",
                        clientId: paypalClientId,
                        clientSecret: paypalClientSecret,
                        environment: "sandbox",
                        actif: true,
                      }),
                    })
                    const data = await response.json()
                    if (response.ok) {
                      toast.success("Compte PayPal configuré avec succès !")
                      setPaypalClientSecret("") // Clear secret after save
                    } else {
                      toast.error(data.message || "Erreur lors de la configuration")
                    }
                  } catch (error) {
                    console.error('PayPal config error:', error)
                    toast.error("Erreur lors de la configuration PayPal")
                  } finally {
                    setPaypalConfigLoading(false)
                  }
                }}
                disabled={paypalConfigLoading || !activeSocieteId}
              >
                {paypalConfigLoading ? "Configuration..." : "Configurer le compte PayPal"}
              </Button>
              {!activeSocieteId && (
                <p className="text-xs text-destructive">Sélectionnez une société dans le header</p>
              )}
              <p className="text-xs text-muted-foreground">
                Trouvez vos credentials sur{" "}
                <a href="https://developer.paypal.com/dashboard/applications/sandbox" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  developer.paypal.com
                </a>
                {" "}→ My Apps & Credentials → Sandbox
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PayPal Redirect Button */}
            <div>
              <ExplainerCard title="PayPal Redirect - Redirection simple">
                Le client est redirigé vers PayPal pour autoriser le paiement. Après approbation,
                il revient sur votre site pour finaliser (capture) le paiement. Simple et sécurisé.
              </ExplainerCard>
              <Card>
                <CardHeader>
                  <CardTitle>Paiement par redirection</CardTitle>
                  <CardDescription>Le client est redirigé vers PayPal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="paypalAmount">Montant (centimes)</Label>
                      <Input
                        id="paypalAmount"
                        type="number"
                        value={paypalAmount}
                        onChange={(e) => setPaypalAmount(Number(e.target.value))}
                        placeholder="2999"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Montant: <strong>{(paypalAmount / 100).toFixed(2)} EUR</strong>
                  </div>
                  <Button
                    className="w-full bg-[#0070ba] hover:bg-[#003087]"
                    onClick={async () => {
                      if (!activeSocieteId) {
                        toast.error("Sélectionnez une société")
                        return
                      }
                      setPaypalLoading(true)
                      try {
                        const baseUrl = window.location.origin || 'http://localhost:3000'
                        const returnUrl = `${baseUrl}/test-payment?paypal=success`
                        const cancelUrl = `${baseUrl}/test-payment?paypal=cancel`

                        const requestBody = {
                          societeId: activeSocieteId,
                          intent: 'CAPTURE',
                          purchaseUnits: [{
                            amount: paypalAmount,
                            currency: 'EUR',
                            description: 'Test PayPal depuis CRM',
                          }],
                          returnUrl,
                          cancelUrl,
                        }
                        console.log('PayPal request body:', requestBody)

                        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'}/paypal/orders`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(requestBody),
                        })
                        const data = await response.json()
                        console.log('PayPal response:', data)
                        if (!response.ok) {
                          const errorMsg = Array.isArray(data.message)
                            ? data.message.join(', ')
                            : (data.message || data.error || "Erreur inconnue")
                          toast.error(errorMsg)
                          return
                        }
                        if (data.approveUrl) {
                          toast.success("Redirection vers PayPal...")
                          window.location.href = data.approveUrl
                        } else {
                          toast.error("Pas d'URL d'approbation retournée")
                        }
                      } catch (error) {
                        console.error('PayPal error:', error)
                        toast.error(`Erreur PayPal: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
                      } finally {
                        setPaypalLoading(false)
                      }
                    }}
                    disabled={paypalLoading || !activeSocieteId}
                  >
                    {paypalLoading ? (
                      "Chargement..."
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Payer {(paypalAmount / 100).toFixed(2)}€ avec PayPal
                      </>
                    )}
                  </Button>
                  {!activeSocieteId && (
                    <p className="text-xs text-destructive">Sélectionnez une société dans le header</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* PayPal SDK Buttons */}
            <div>
              <ExplainerCard title="PayPal SDK - Boutons intégrés">
                Les boutons PayPal natifs s&apos;affichent dans votre page. Le paiement s&apos;effectue dans une popup,
                sans quitter votre site. Expérience plus fluide pour le client.
              </ExplainerCard>
              <Card>
                <CardHeader>
                  <CardTitle>Boutons PayPal (SDK)</CardTitle>
                  <CardDescription>Boutons natifs PayPal intégrés</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Les boutons PayPal nécessitent le SDK JavaScript.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ajoutez <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> dans votre .env
                      pour activer les boutons intégrés.
                    </p>
                  </div>
                  <div
                    id="paypal-button-container"
                    className="min-h-[120px] flex items-center justify-center border-2 border-dashed rounded-lg"
                  >
                    <p className="text-sm text-muted-foreground">
                      Zone des boutons PayPal
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Test credentials */}
          <Card>
            <CardHeader>
              <CardTitle>Comptes de test PayPal Sandbox</CardTitle>
              <CardDescription>Utilisez ces comptes pour tester en environnement Sandbox</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Créez des comptes Sandbox sur{" "}
                  <a
                    href="https://developer.paypal.com/tools/sandbox/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    developer.paypal.com/tools/sandbox
                  </a>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Carte Visa (test)</p>
                    <code className="text-sm font-mono">4032039317984658</code>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Carte Mastercard (test)</p>
                    <code className="text-sm font-mono">5425233430109903</code>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Carte Amex (test)</p>
                    <code className="text-sm font-mono">374245455400001</code>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Date expiration: n&apos;importe quelle date future | CVC: n&apos;importe quels 3 chiffres
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GOCARDLESS TAB */}
        <TabsContent value="gocardless" className="space-y-6">
          <ExplainerCard title="Qu'est-ce que GoCardless ?">
            GoCardless est un prestataire de prélèvement SEPA (virement bancaire automatique). Contrairement à Stripe (CB),
            il prélève directement sur le compte bancaire du client via un mandat SEPA. Moins cher que la CB (~1% vs 1.4%+0.25€),
            idéal pour les abonnements et paiements récurrents B2B.
          </ExplainerCard>

          {/* Client Selection */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Configuration du test</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sélectionnez un client pour tester les fonctionnalités GoCardless
                </p>
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="clientId">Client</Label>
                  <Select
                    value={testClientId}
                    onValueChange={(value) => {
                      setTestClientId(value)
                      // Auto-fetch when client is selected
                      if (value) {
                        setTimeout(() => {
                          fetchMandate()
                          fetchGcPayments()
                          fetchGcSubscriptions()
                        }, 100)
                      }
                    }}
                    disabled={clientsLoading || clients.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      {clientsLoading ? (
                        "Chargement des clients..."
                      ) : (
                        <SelectValue placeholder="Sélectionner un client" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{client.name}</span>
                            {client.email && (
                              <span className="text-muted-foreground text-xs">
                                ({client.email})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clients.length === 0 && !clientsLoading && (
                    <p className="text-xs text-muted-foreground">
                      Aucun client disponible pour cette organisation
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => {
                    if (testClientId) {
                      fetchMandate()
                      fetchGcPayments()
                      fetchGcSubscriptions()
                      toast.success("Données rechargées!")
                    } else {
                      toast.error("Veuillez sélectionner un client")
                    }
                  }}
                  disabled={!testClientId || gcLoading}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {gcLoading ? "Chargement..." : "Recharger"}
                </Button>
              </div>
            </div>
          </Card>

          {testClientId ? (
            <>
            <ExplainerCard title="Mandat SEPA - Autorisation de prélèvement">
              Le mandat SEPA est l&apos;autorisation signée par le client pour vous permettre de prélever son compte bancaire.
              C&apos;est obligatoire avant tout prélèvement. Le client signe une seule fois, puis vous pouvez prélever autant que nécessaire.
            </ExplainerCard>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Colonne gauche - Mandat et Setup */}
              <div className="space-y-6">
                <GocardlessMandateStatus
                  mandate={mandate}
                  loading={gcLoading}
                  onSetupMandate={handleSetupMandate}
                  onCancelMandate={handleCancelMandate}
                />

                {!hasMandateActive && (
                  <GocardlessSetupMandate
                    clientId={testClientId}
                    onSetupMandate={handleSetupMandate}
                    onCreateBillingRequestFlow={createBillingRequestFlow}
                    onSuccess={() => {
                      toast.success("Mandat configuré avec succès!")
                      fetchMandate()
                    }}
                    onError={(error) => toast.error(error.message)}
                    loading={gcLoading}
                    environment="sandbox"
                  />
                )}
              </div>

              {/* Colonne droite - Paiements et Abonnements */}
              <div className="space-y-6">
                <ExplainerCard title="Paiement ponctuel">
                  Créez un prélèvement unique. Le montant sera débité du compte du client sous 3-5 jours ouvrés
                  (délai bancaire SEPA). Vous recevez les fonds environ 2 jours après le prélèvement.
                </ExplainerCard>
                <GocardlessPaymentForm
                  onSubmit={handleCreateGcPayment}
                  loading={gcLoading}
                  disabled={!hasMandateActive}
                />

                <ExplainerCard title="Abonnement récurrent">
                  Créez un prélèvement automatique récurrent (hebdo, mensuel, annuel). GoCardless prélève automatiquement
                  le client à chaque échéance sans intervention de votre part.
                </ExplainerCard>
                <GocardlessSubscriptionForm
                  onSubmit={handleCreateGcSubscription}
                  loading={gcLoading}
                  disabled={!hasMandateActive}
                />
              </div>
            </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sélectionnez un client</h3>
              <p className="text-muted-foreground">
                Pour tester les fonctionnalités GoCardless, sélectionnez d&apos;abord un client
                dans la liste ci-dessus.
              </p>
            </Card>
          )}

          {testClientId && (
            <div className="space-y-6">
              <ExplainerCard title="Historique des paiements">
                Liste de tous les prélèvements effectués ou en cours pour ce client. Statuts : pending (en attente de prélèvement),
                confirmed (prélevé), paid_out (fonds reçus), failed (échec), cancelled (annulé).
              </ExplainerCard>
              <GocardlessPaymentsTable
                payments={gcPayments}
                loading={gcLoading}
                onRefresh={fetchGcPayments}
                onCancel={handleCancelGcPayment}
                onRetry={handleRetryGcPayment}
              />

              <ExplainerCard title="Abonnements actifs">
                Liste des abonnements récurrents du client. Vous pouvez les mettre en pause (arrêt temporaire),
                les reprendre, ou les annuler définitivement.
              </ExplainerCard>
              <GocardlessSubscriptionsTable
                subscriptions={gcSubscriptions}
                loading={gcLoading}
                onRefresh={fetchGcSubscriptions}
                onCancel={handleCancelGcSubscription}
                onPause={handlePauseGcSubscription}
                onResume={handleResumeGcSubscription}
              />
            </div>
          )}
        </TabsContent>

        {/* SCHEDULES TAB */}
        <TabsContent value="schedules" className="space-y-4">
          <ExplainerCard title="Qu'est-ce qu'un Schedule ?">
            Un Schedule est un échéancier de paiement automatique multi-PSP. Il permet de planifier des prélèvements récurrents
            ou ponctuels via Stripe (CB) ou GoCardless (SEPA). Le système CRON traite automatiquement les échéances dues
            et gère les relances en cas d&apos;échec.
          </ExplainerCard>

          {/* Manual Processing Card */}
          <Card className="p-6 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                  Traitement manuel des paiements
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Déclencher manuellement le traitement des échéances dues (normalement exécuté toutes les heures par CRON)
                </p>
              </div>
              <Button
                onClick={async () => {
                  try {
                    const result = await triggerProcessing()
                    toast.success(`Traitement terminé: ${result.processed} traité(s), ${result.failed} échoué(s)`)
                    refetchSchedules()
                    refetchPaymentIntents()
                    refetchPaymentEvents()
                  } catch {
                    toast.error("Erreur lors du traitement des paiements")
                  }
                }}
                disabled={processingLoading}
                variant="default"
                className="bg-amber-600 hover:bg-amber-700"
              >
                {processingLoading ? (
                  "Traitement..."
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Traiter maintenant
                  </>
                )}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div>
              <ScheduleForm
                onSubmit={handleCreateSchedule}
                loading={createScheduleLoading}
              />
            </div>

            {/* Stats Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Schedules:</span>
                  <span className="font-semibold">{schedules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Planned:</span>
                  <span className="font-semibold">
                    {schedules.filter((s) => s.status === "planned").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing:</span>
                  <span className="font-semibold text-yellow-600">
                    {schedules.filter((s) => s.status === "processing").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid:</span>
                  <span className="font-semibold text-green-600">
                    {schedules.filter((s) => s.status === "paid").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed:</span>
                  <span className="font-semibold text-red-600">
                    {schedules.filter((s) => s.status === "failed").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unpaid (max retries):</span>
                  <span className="font-semibold text-red-800">
                    {schedules.filter((s) => s.status === "unpaid").length}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Liste des Schedules</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={refetchSchedules}
                disabled={schedulesLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {schedulesLoading ? "Chargement..." : "Rafraîchir"}
              </Button>
            </div>
            <ScheduleTable
              schedules={schedules}
              onDelete={handleDeleteSchedule}
            />
          </div>
        </TabsContent>

        {/* PAYMENT INTENTS TAB */}
        <TabsContent value="payment-intents" className="space-y-4">
          <ExplainerCard title="Qu'est-ce qu'un Payment Intent ?">
            Un Payment Intent est l&apos;objet central de Stripe pour gérer un paiement. Il représente l&apos;intention de collecter
            un paiement et suit tout le cycle de vie : création → authentification 3DS → confirmation → succès/échec.
            C&apos;est ce qui est créé quand un client initie un paiement par carte.
          </ExplainerCard>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div>
              <PaymentIntentForm
                onSubmit={handleCreatePaymentIntent}
                loading={createPaymentIntentLoading}
              />
            </div>

            {/* Stats Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Payment Intents:</span>
                  <span className="font-semibold">{paymentIntents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending:</span>
                  <span className="font-semibold">
                    {paymentIntents.filter((p) => p.status === "pending").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Succeeded:</span>
                  <span className="font-semibold text-green-600">
                    {paymentIntents.filter((p) => p.status === "succeeded").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed:</span>
                  <span className="font-semibold text-red-600">
                    {paymentIntents.filter((p) => p.status === "failed").length}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Liste des Payment Intents</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={refetchPaymentIntents}
                disabled={paymentIntentsLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {paymentIntentsLoading ? "Chargement..." : "Rafraîchir"}
              </Button>
            </div>
            <PaymentIntentTable
              paymentIntents={paymentIntents}
              onDelete={handleDeletePaymentIntent}
            />
          </div>
        </TabsContent>

        {/* PAYMENT EVENTS TAB */}
        <TabsContent value="payment-events" className="space-y-4">
          <ExplainerCard title="Qu'est-ce qu'un Payment Event ?">
            Les Payment Events sont les webhooks/notifications reçus des prestataires de paiement (Stripe, GoCardless).
            Chaque événement (paiement réussi, échec, remboursement, etc.) est enregistré ici. C&apos;est le journal de tous
            les événements de paiement, utile pour le débogage et l&apos;audit.
          </ExplainerCard>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Events:</span>
                <span className="font-semibold">{paymentEvents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processed:</span>
                <span className="font-semibold text-green-600">
                  {paymentEvents.filter((e) => e.processed).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unprocessed:</span>
                <span className="font-semibold text-red-600">
                  {paymentEvents.filter((e) => !e.processed).length}
                </span>
              </div>
            </div>
          </Card>

          {/* Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Liste des Payment Events</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={refetchPaymentEvents}
                disabled={paymentEventsLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {paymentEventsLoading ? "Chargement..." : "Rafraîchir"}
              </Button>
            </div>
            <PaymentEventTable paymentEvents={paymentEvents} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
