import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, ArrowLeft } from "lucide-react"
import { getClient } from "@/actions/clients"
import { calculatePrice } from "@/actions/bundle"

interface Service {
  id: string
  name: string
  active: boolean
  priceStandalone: number
  priceWithBundle: number
  canToggle: boolean
  description: string
}

async function getServices(token: string): Promise<Service[]> {
  // Fetch client data
  const { data: client, error } = await getClient(token);
  
  if (error || !client) {
    console.error("[getServices] Error fetching client:", error);
    return [];
  }

  // Calculate prices with bundle discounts
  const activeServiceCodes = [];
  if (client.hasConciergerie) activeServiceCodes.push("CONCIERGERIE");
  if (client.hasJustiPlus) activeServiceCodes.push("JUSTI_PLUS");
  if (client.hasWincash) activeServiceCodes.push("WINCASH");

  let prixConciergerie = 9.90;
  let prixJustiPlus = 9.90;
  let prixWincash = 9.90;

  if (activeServiceCodes.length > 0) {
    const { data: priceData } = await calculatePrice({
      clientId: token,
      organisationId: client.organisationId || "",
      services: activeServiceCodes,
    });

    if (priceData) {
      if (priceData.prixConciergerie) prixConciergerie = parseFloat(priceData.prixConciergerie);
      if (priceData.prixJustiPlus) prixJustiPlus = parseFloat(priceData.prixJustiPlus);
      if (priceData.prixWincash) prixWincash = parseFloat(priceData.prixWincash);
    }
  }

  return [
    {
      id: "conciergerie",
      name: "Conciergerie Privée",
      active: client.hasConciergerie || false,
      priceStandalone: 9.90,
      priceWithBundle: prixConciergerie,
      canToggle: false, // Cannot disable main service
      description: "Service principal - Assistance personnelle 24/7"
    },
    {
      id: "justi-plus",
      name: "Justi+",
      active: client.hasJustiPlus || false,
      priceStandalone: 9.90,
      priceWithBundle: prixJustiPlus,
      canToggle: true,
      description: "Assistance juridique et documents légaux"
    },
    {
      id: "wincash",
      name: "Wincash",
      active: client.hasWincash || false,
      priceStandalone: 9.90,
      priceWithBundle: prixWincash,
      canToggle: true,
      description: "Cashback et économies sur vos achats"
    }
  ];
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const services = await getServices(token)
  
  const hasConciergerie = services.find(s => s.id === "conciergerie")?.active
  const activeCount = services.filter(s => s.active).length

   return (
     <div className="container max-w-4xl py-8">
       <Link href={`/portal/${token}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
         <ArrowLeft className="h-4 w-4" />
         Retour
       </Link>
       <div className="mb-8">
         <h1 className="text-3xl font-bold">Mes Services</h1>
         <p className="text-muted-foreground mt-2">
           Activez ou désactivez vos services
         </p>
       </div>

      {hasConciergerie && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Avec Conciergerie Privée, bénéficiez de <strong>-40% sur Justi+ et Wincash</strong> (5,90€/mois au lieu de 9,90€)
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle>{service.name}</CardTitle>
                    {service.active && (
                      <Badge variant="default" className="bg-green-600">Actif</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    {service.description}
                  </CardDescription>
                </div>
                {service.canToggle && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`toggle-${service.id}`}
                      checked={service.active}
                      disabled
                    />
                    <Label htmlFor={`toggle-${service.id}`} className="sr-only">
                      Activer {service.name}
                    </Label>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-4">
                {hasConciergerie && service.id !== "conciergerie" ? (
                  <>
                    <div>
                      <span className="text-2xl font-bold text-green-600">
                        {service.priceWithBundle.toFixed(2)} €
                      </span>
                      <span className="text-sm text-muted-foreground">/mois</span>
                    </div>
                    <div className="text-sm">
                      <span className="line-through text-muted-foreground">
                        {service.priceStandalone.toFixed(2)} €
                      </span>
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                        -40%
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div>
                    <span className="text-2xl font-bold">
                      {service.priceStandalone.toFixed(2)} €
                    </span>
                    <span className="text-sm text-muted-foreground">/mois</span>
                  </div>
                )}
              </div>
              {!service.canToggle && (
                <p className="text-xs text-muted-foreground mt-2">
                  Service principal - Contactez-nous pour modifier
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Total mensuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {services
                .filter(s => s.active)
                .reduce((sum, s) => sum + (hasConciergerie ? s.priceWithBundle : s.priceStandalone), 0)
                .toFixed(2)} €
            </span>
            <span className="text-muted-foreground">/mois</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {activeCount} service{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
