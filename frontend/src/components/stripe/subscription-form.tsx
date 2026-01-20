'use client';

import { useState } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { stripePromiseInstance, stripeAppearance, formatAmount, getStripeErrorMessage } from '@/lib/stripe';
import { useStripePayment } from '@/hooks/use-stripe-payment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Plan {
  id: string;
  name: string;
  priceId: string;
  price: number;
  currency?: string;
  interval: 'month' | 'year';
  features?: string[];
  popular?: boolean;
}

interface SubscriptionCheckoutFormProps {
  onSuccess: (subscriptionId: string) => void;
  onError: (error: string) => void;
}

function SubscriptionCheckoutForm({ onSuccess, onError }: SubscriptionCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription/success`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      const errorMessage = submitError.message || getStripeErrorMessage(submitError.code);
      setError(errorMessage);
      onError(errorMessage);
    } else if (paymentIntent) {
      onSuccess(paymentIntent.id);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Traitement en cours...' : "S'abonner"}
      </Button>
    </form>
  );
}

interface PlanCardProps {
  plan: Plan;
  selected: boolean;
  onSelect: (plan: Plan) => void;
  loading: boolean;
}

function PlanCard({ plan, selected, onSelect, loading }: PlanCardProps) {
  const intervalLabel = plan.interval === 'month' ? '/mois' : '/an';

  return (
    <Card
      className={cn(
        'relative cursor-pointer transition-all hover:border-primary',
        selected && 'border-primary ring-2 ring-primary',
        plan.popular && 'border-primary'
      )}
      onClick={() => !loading && onSelect(plan)}
    >
      {plan.popular && (
        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
          Populaire
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold text-foreground">
            {formatAmount(plan.price, plan.currency)}
          </span>
          <span className="text-muted-foreground">{intervalLabel}</span>
        </CardDescription>
      </CardHeader>
      {plan.features && plan.features.length > 0 && (
        <CardContent>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      )}
      <CardFooter>
        <Button
          variant={selected ? 'default' : 'outline'}
          className="w-full"
          disabled={loading}
        >
          {selected ? 'Sélectionné' : 'Choisir'}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface SubscriptionFormProps {
  plans: Plan[];
  userEmail: string;
  userName?: string;
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: string) => void;
  title?: string;
  description?: string;
}

export function SubscriptionForm({
  plans,
  userEmail,
  userName,
  onSuccess,
  onError,
  title = 'Choisissez votre plan',
  description = 'Sélectionnez le plan qui correspond à vos besoins',
}: SubscriptionFormProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [step, setStep] = useState<'plans' | 'payment'>('plans');
  const [loading, setLoading] = useState(false);

  const {
    createCustomer,
    createSubscription,
    error: apiError,
  } = useStripePayment();

  const handleSelectPlan = async (plan: Plan) => {
    setSelectedPlan(plan);
    setLoading(true);

    try {
      // Create or get customer
      let custId = customerId;
      if (!custId) {
        const customer = await createCustomer({
          email: userEmail,
          name: userName,
        });
        if (!customer) return;
        custId = customer.id;
        setCustomerId(custId);
      }

      // Create subscription
      const subscription = await createSubscription({
        customerId: custId,
        priceId: plan.priceId,
      });

      if (subscription?.clientSecret) {
        setClientSecret(subscription.clientSecret);
        setStep('payment');
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Erreur lors de la création de l\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (subscriptionId: string) => {
    setSubscriptionSuccess(true);
    onSuccess?.(subscriptionId);
  };

  const handleError = (error: string) => {
    onError?.(error);
  };

  const handleBack = () => {
    setStep('plans');
    setClientSecret(null);
    setSelectedPlan(null);
  };

  if (subscriptionSuccess) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-bold text-green-700">Abonnement activé !</h2>
          <p className="text-muted-foreground">
            Merci pour votre abonnement au plan {selectedPlan?.name}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step === 'payment' && clientSecret && selectedPlan) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Abonnement {selectedPlan.name}</CardTitle>
              <CardDescription>
                {formatAmount(selectedPlan.price, selectedPlan.currency)}
                {selectedPlan.interval === 'month' ? '/mois' : '/an'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Elements
            stripe={stripePromiseInstance}
            options={{
              clientSecret,
              appearance: stripeAppearance,
              locale: 'fr',
            }}
          >
            <SubscriptionCheckoutForm
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </Elements>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {apiError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <div className={cn(
        'grid gap-4',
        plans.length === 1 && 'grid-cols-1 max-w-md mx-auto',
        plans.length === 2 && 'grid-cols-1 md:grid-cols-2',
        plans.length >= 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      )}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedPlan?.id === plan.id}
            onSelect={handleSelectPlan}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}
