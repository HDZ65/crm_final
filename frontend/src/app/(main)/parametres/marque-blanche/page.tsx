import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Palette, Shield } from "lucide-react"

export default function MarqueBlanchePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h2 className="text-2xl font-bold">Marque Blanche</h2>
        <p className="text-muted-foreground">Gérez vos partenaires, thèmes et statuts</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/parametres/marque-blanche/partenaires">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <Users className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Partenaires</CardTitle>
              <CardDescription>Gérer les partenaires marque blanche</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/parametres/marque-blanche/themes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <Palette className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Thèmes</CardTitle>
              <CardDescription>Personnaliser les thèmes visuels</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/parametres/marque-blanche/statuts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <Shield className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Statuts</CardTitle>
              <CardDescription>Configurer les statuts partenaire</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
