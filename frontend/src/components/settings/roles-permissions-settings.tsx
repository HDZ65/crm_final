"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, ExternalLink, AlertCircle, Lock } from "lucide-react"
import { useOrganisation } from "@/contexts/organisation-context"

interface RolesPermissionsSettingsProps {
  onOpenChange: (open: boolean) => void
}

export function RolesPermissionsSettings({ onOpenChange }: RolesPermissionsSettingsProps) {
  const router = useRouter()
  const { activeOrganisation, isOwner } = useOrganisation()

  const handleOpenAdvancedSettings = () => {
    router.push("/parametres/roles-permissions")
    onOpenChange(false)
  }

  // Message si aucune organisation n'est sélectionnée
  if (!activeOrganisation?.organisationId) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Rôles & Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les rôles et permissions de votre organisation.
          </p>
        </div>
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Veuillez sélectionner une organisation pour gérer les rôles et permissions.
          </p>
        </div>
      </div>
    )
  }

  // Message si l'utilisateur n'est pas administrateur
  if (!isOwner) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Rôles & Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les rôles et permissions de votre organisation.
          </p>
        </div>
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
          <Lock className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Seuls les propriétaires de l&apos;organisation peuvent configurer les rôles et permissions.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Rôles & Permissions</h3>
        <p className="text-sm text-muted-foreground">
          Gérez les rôles et permissions de votre organisation.
        </p>
      </div>

      {/* Vue d'ensemble rapide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Aperçu
          </CardTitle>
          <CardDescription>
            Vue rapide de votre système de permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Votre rôle</Badge>
                <Badge variant="secondary">
                  {isOwner ? "Propriétaire" : "Utilisateur"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isOwner
                  ? "Vous avez un accès complet à toutes les fonctionnalités de l'organisation."
                  : "Vous disposez d'un accès limité selon vos permissions."}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-3">
              Pour une gestion avancée des rôles et permissions :
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Créer et modifier des rôles personnalisés</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Assigner des permissions spécifiques aux rôles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Gérer les utilisateurs et leurs rôles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Consulter l'historique des modifications</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Bouton vers la page complète */}
      <Button onClick={handleOpenAdvancedSettings} className="w-full">
        Ouvrir la gestion avancée
        <ExternalLink className="ml-2 h-4 w-4" />
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        La page de gestion avancée vous permet de configurer en détail les rôles et permissions de votre organisation.
      </p>
    </div>
  )
}
