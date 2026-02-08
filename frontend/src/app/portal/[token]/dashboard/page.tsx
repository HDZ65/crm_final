import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getClient } from "@/actions/clients"
import { calculatePrice } from "@/actions/bundle"

interface ServiceStatus {
  name: string
  active: boolean
  price: number
  description: string
  href: string
}

async function getClientServices(token: string): Promise<ServiceStatus[]> {
  // Fetch client data using token as clientId (token validation will be added later)
  const { data: client, error } = await getClient(token);
  
  if (error || !client) {
    console.error("[getClientServices] Error fetching client:", error);
    return [];
  }

  // Build services array based on client's active services
  const services: ServiceStatus[] = [
    {
      name: "Conciergerie Privée",
      active: client.hasConciergerie || false,
      price: 9.90, // Base price, will be adjusted by bundle calculation
      description: "Assistance personnelle et gestion administrative",
      href: `/portal/${token}/services`
    },
    {
      name: "Justi+",
      active: client.hasJustiPlus || false,
      price: 9.90,
      description: "Assistance juridique et documents légaux",
      href: `/portal/${token}/justi-plus`
    },
    {
      name: "Wincash",
      active: client.hasWincash || false,
      price: 9.90,
      description: "Cashback et économies sur vos achats",
      href: `/portal/${token}/wincash`
    }
  ];

  // Calculate actual prices with bundle discounts
  const activeServiceCodes = [];
  if (client.hasConciergerie) activeServiceCodes.push("CONCIERGERIE");
  if (client.hasJustiPlus) activeServiceCodes.push("JUSTI_PLUS");
  if (client.hasWincash) activeServiceCodes.push("WINCASH");

  if (activeServiceCodes.length > 0) {
    const { data: priceData } = await calculatePrice({
      clientId: token,
      organisationId: client.organisationId || "",
      services: activeServiceCodes,
    });

    if (priceData) {
      // Update prices from bundle calculation
      services.forEach(service => {
        if (service.name === "Conciergerie Privée" && priceData.prixConciergerie) {
          service.price = parseFloat(priceData.prixConciergerie);
        } else if (service.name === "Justi+" && priceData.prixJustiPlus) {
          service.price = parseFloat(priceData.prixJustiPlus);
        } else if (service.name === "Wincash" && priceData.prixWincash) {
          service.price = parseFloat(priceData.prixWincash);
        }
      });
    }
  }

  return services;
}

export default async function PortalDashboard({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const services = await getClientServices(token)
  
  const activeServices = services.filter(s => s.active)
  const totalPrice = activeServices.reduce((sum, s) => sum + s.price, 0)

   return (
     <div className="container max-w-6xl py-8">
       <Link href={`/portal/${token}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
         <ArrowLeft className="h-4 w-4" />
         Retour
       </Link>
       <div className="mb-8">
         <h1 className="text-3xl font-bold">Mon Espace Client</h1>
         <p className="text-muted-foreground mt-2">
           Gérez vos services et consultez vos informations
         </p>
       </div>

      {/* Résumé tarifaire */}
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Votre abonnement</CardTitle>
          <CardDescription>
            {activeServices.length} service{activeServices.length > 1 ? 's' : ''} actif{activeServices.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{totalPrice.toFixed(2)} €</span>
            <span className="text-muted-foreground">/mois</span>
          </div>
          {activeServices.length > 1 && (
            <p className="text-sm text-green-600 mt-2">
              ✓ Remise bundle appliquée
            </p>
          )}
        </CardContent>
      </Card>

      {/* Services */}
      <div className="grid gap-4 md:grid-cols-3">
        {services.map((service) => (
          <Card key={service.name} className={service.active ? "" : "opacity-60"}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                {service.active ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Actif
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="mr-1 h-3 w-3" />
                    Inactif
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-2">
                {service.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-bold">{service.price.toFixed(2)} €</span>
                <span className="text-sm text-muted-foreground">/mois</span>
              </div>
              <Button asChild variant={service.active ? "outline" : "default"} className="w-full">
                <Link href={service.href}>
                  {service.active ? "Gérer" : "Activer"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mes factures</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/portal/${token}/invoices`}>
                Consulter mes factures
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mon profil</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/portal/${token}/profile`}>
                Modifier mes informations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
