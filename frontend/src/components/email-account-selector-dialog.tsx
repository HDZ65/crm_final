"use client"

import * as React from "react"
import { ArrowLeft, Mail, Plus } from "lucide-react"
import { SiGmail, SiProtonmail } from "react-icons/si"
import { PiMicrosoftOutlookLogo } from "react-icons/pi"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { OAuthEmailConnect, type OAuthProvider } from "./oauth-email-connect"
import { useOAuthEmail } from "@/hooks/email"

// Affiche le logo associe au fournisseur d'email
function EmailProviderLogo({ provider }: { provider: string }) {
  const providerLower = provider.toLowerCase()
  const iconClass = "size-5"

  if (providerLower.includes("gmail") || providerLower.includes("google")) {
    return <SiGmail className={iconClass} color="#EA4335" />
  }

  if (
    providerLower.includes("outlook") ||
    providerLower.includes("microsoft") ||
    providerLower.includes("office365")
  ) {
    return <PiMicrosoftOutlookLogo className={iconClass} color="#0078D4" />
  }

  if (providerLower.includes("yahoo")) {
    return <Mail className={iconClass} color="#6001D2" />
  }

  if (providerLower.includes("proton")) {
    return <SiProtonmail className={iconClass} color="#6D4AFF" />
  }

  return <Mail className={iconClass} />
}

export type EmailAccount = {
  id: string
  email: string
  provider: string
  isDefault?: boolean
}

interface EmailAccountSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectAccount: (account: EmailAccount) => void
  onAddAccount?: (account: Omit<EmailAccount, "id">) => void
  accounts?: EmailAccount[]
}

// Donnees d'exemple - a remplacer par vos vraies donnees
const defaultAccounts: EmailAccount[] = [
  {
    id: "1",
    email: "contact@entreprise.fr",
    provider: "Gmail",
    isDefault: true,
  },
  {
    id: "2",
    email: "support@entreprise.fr",
    provider: "Outlook",
  },
]

export function EmailAccountSelectorDialog({
  open,
  onOpenChange,
  onSelectAccount,
  accounts = defaultAccounts,
}: EmailAccountSelectorDialogProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(
    accounts.find((account) => account.isDefault)?.id || null
  )
  const [showOAuthConnect, setShowOAuthConnect] = React.useState(false)

  const { connectedAccounts, connectAccount } = useOAuthEmail()

  const handleSelect = (account: EmailAccount) => {
    setSelectedId(account.id)
    onSelectAccount(account)
    onOpenChange(false)
  }

  const handleOAuthConnect = async (provider: OAuthProvider) => {
    await connectAccount(provider)
    // Le compte sera disponible via connectedAccounts apres connexion
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setShowOAuthConnect(false)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "overflow-hidden border border-slate-200 p-0 shadow-xl sm:max-w-xl",
          showOAuthConnect && "sm:max-w-2xl"
        )}
      >
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-900 px-6 py-5 text-slate-50">
          <DialogHeader className="space-y-3 text-slate-50">
            <div className="flex items-start gap-3">
              {showOAuthConnect && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-white hover:bg-white/10"
                  onClick={() => setShowOAuthConnect(false)}
                >
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              <div className="space-y-1">
                <DialogTitle className="text-lg font-semibold text-white">
                  {showOAuthConnect ? "Connecter une boite mail" : "Selectionner une boite mail"}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-200">
                  {showOAuthConnect
                    ? "Connectez votre compte Gmail ou Outlook via OAuth2 pour lier l'envoi."
                    : "Choisissez l'expediteur qui sera utilise pour ce message client."}
                </DialogDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
              <span>{accounts.length} compte(s) disponible(s)</span>
              {connectedAccounts.length > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                  {connectedAccounts.length} connecte(s) via OAuth
                </span>
              )}
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-6">
          {showOAuthConnect ? (
            <OAuthEmailConnect
              onConnect={handleOAuthConnect}
              connectedAccounts={connectedAccounts.map((account) => ({
                provider: account.provider,
                email: account.email,
              }))}
            />
          ) : accounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              <Mail className="mx-auto mb-4 size-12 opacity-40" />
              <p className="font-medium text-slate-600">Aucune boite mail configuree</p>
              <p>Connectez un compte pour commencer a envoyer des emails.</p>
              <Button
                variant="outline"
                className="mt-4 rounded-2xl bg-white text-slate-900 hover:bg-slate-100"
                onClick={() => setShowOAuthConnect(true)}
              >
                <Plus className="size-4" />
                Connecter un compte
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-[320px] pr-3">
                <RadioGroup
                  value={selectedId || undefined}
                  onValueChange={(value) => {
                    const account = accounts.find((item) => item.id === value)
                    if (account) handleSelect(account)
                  }}
                  className="space-y-3"
                >
                  {accounts.map((account) => {
                    const isSelected = selectedId === account.id
                    return (
                      <Label
                        key={account.id}
                        htmlFor={account.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-4 transition-all",
                          "bg-white border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
                          isSelected && "border-slate-900 bg-slate-900 text-white shadow-lg"
                        )}
                      >
                        <div className="flex flex-1 items-center gap-4">
                          <div
                            className={cn(
                              "flex size-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm",
                              isSelected && "border-white/30 bg-white/10 text-white"
                            )}
                          >
                            <EmailProviderLogo provider={account.provider} />
                          </div>
                          <div className="flex-1 space-y-1 text-left">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <span>{account.email}</span>
                              {account.isDefault && (
                                <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide">
                                  Compte par defaut
                                </span>
                              )}
                            </div>
                            <div className={cn("text-xs text-slate-500", isSelected && "text-white/70")}>
                              {account.provider}
                            </div>
                          </div>
                        </div>
                        <RadioGroupItem value={account.id} id={account.id} />
                      </Label>
                    )
                  })}
                </RadioGroup>
              </ScrollArea>

              {connectedAccounts.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  <span className="font-medium text-slate-700">{connectedAccounts.length} compte(s)</span>{" "}
                  deja relies via OAuth2.
                </div>
              )}

              <Button
                variant="outline"
                className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 text-slate-700 hover:bg-slate-100"
                onClick={() => setShowOAuthConnect(true)}
              >
                <Plus className="size-4" />
                Connecter une nouvelle boite mail
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

