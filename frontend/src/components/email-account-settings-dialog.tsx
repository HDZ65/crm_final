"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OAuthEmailConnect, type OAuthProvider } from "./oauth-email-connect"
import { useOAuthEmail } from "@/hooks/email"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface EmailAccountSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmailAccountSettingsDialog({ open, onOpenChange }: EmailAccountSettingsDialogProps) {
  const { connectedAccounts, connectAccount, disconnectAccount } = useOAuthEmail()

  const handleConnect = async (provider: OAuthProvider) => {
    await connectAccount(provider)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gestion des comptes email</DialogTitle>
          <DialogDescription>
            Connectez vos comptes Gmail ou Outlook pour envoyer des emails depuis l&apos;application.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="connect" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connect">Connecter un compte</TabsTrigger>
            <TabsTrigger value="manage">
              Comptes connectés
              {connectedAccounts.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {connectedAccounts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="space-y-4">
            <OAuthEmailConnect
              onConnect={handleConnect}
              connectedAccounts={connectedAccounts.map((acc) => ({
                provider: acc.provider,
                email: acc.email,
              }))}
            />
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            {connectedAccounts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <p>Aucun compte connecté</p>
                    <p className="text-sm mt-1">
                      Connectez un compte depuis l&apos;onglet &quot;Connecter un compte&quot;
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {connectedAccounts.map((account) => (
                  <Card key={`${account.provider}-${account.email}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{account.email}</CardTitle>
                          <CardDescription className="capitalize">
                            {account.provider}
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnectAccount(account.provider, account.email)}
                        >
                          Déconnecter
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
