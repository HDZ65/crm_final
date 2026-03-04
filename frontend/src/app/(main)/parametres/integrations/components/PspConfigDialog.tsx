"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { PspProviderConfig } from "../data/psp-providers"
import { getPspSchema } from "../data/psp-schemas"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PspConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: PspProviderConfig
  existingAccount: Record<string, any> | null
  onSubmit: (data: Record<string, any>) => Promise<void>
  isSubmitting: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Stripe uses `isTestMode`, every other PSP uses `isSandbox`. */
function getEnvFieldName(providerId: string): "isTestMode" | "isSandbox" {
  return providerId === "stripe" ? "isTestMode" : "isSandbox"
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PspConfigDialog({
  open,
  onOpenChange,
  provider,
  existingAccount,
  onSubmit,
  isSubmitting,
}: PspConfigDialogProps) {
  const [showSecrets, setShowSecrets] = useState(false)

  const isEdit = existingAccount !== null
  const envField = getEnvFieldName(provider.id)

  // Build default values from provider fields + existing data
  const defaultValues = useMemo(() => {
    const base: Record<string, any> = {
      nom: existingAccount?.nom ?? `${provider.name} Account`,
      [envField]: existingAccount?.[envField] ?? true,
    }
    for (const field of provider.fields) {
      base[field.name] = existingAccount?.[field.name] ?? ""
    }
    return base
  }, [provider, existingAccount, envField])

  const schema = useMemo(() => getPspSchema(provider.id), [provider.id])

  const form = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues,
  })

  const handleFormSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Modifier ${provider.name}` : `Configurer ${provider.name}`}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Mettez à jour les paramètres de votre compte ${provider.name}.`
              : `Saisissez vos identifiants ${provider.name} pour activer l'intégration.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* ---------- Account display name ---------- */}
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du compte</FormLabel>
                  <FormControl>
                    <Input placeholder={`Mon compte ${provider.name}`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ---------- Dynamic provider fields ---------- */}
            {provider.fields.map((fieldCfg) => (
              <FormField
                key={fieldCfg.name}
                control={form.control}
                name={fieldCfg.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {fieldCfg.label}
                      {!fieldCfg.required && (
                        <span className="text-muted-foreground ml-1 font-normal">
                          (optionnel)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={
                            fieldCfg.type === "password" && !showSecrets
                              ? "password"
                              : "text"
                          }
                          placeholder={fieldCfg.placeholder}
                          className={fieldCfg.type === "password" ? "pr-10" : ""}
                          {...field}
                        />
                        {fieldCfg.type === "password" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowSecrets((s) => !s)}
                          >
                            {showSecrets ? (
                              <EyeOff className="size-4 text-muted-foreground" />
                            ) : (
                              <Eye className="size-4 text-muted-foreground" />
                            )}
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {/* ---------- Environment toggle ---------- */}
            <FormField
              control={form.control}
              name={envField}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="env-toggle" className="text-sm font-medium">
                        {field.value ? "Mode Test" : "Mode Live"}
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        {field.value
                          ? "Les transactions sont simulées."
                          : "Les transactions sont réelles."}
                      </p>
                    </div>
                    <Switch
                      id="env-toggle"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                </FormItem>
              )}
            />

            {/* ---------- Footer ---------- */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
