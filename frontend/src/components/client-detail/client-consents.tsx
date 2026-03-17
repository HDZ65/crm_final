"use client"

import * as React from "react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createConsentement, updateConsentement } from "@/actions/consentements"
import type { ConsentementRGPD } from "@proto/depanssur/depanssur"

// --- Consent type configuration ---
const CONSENT_TYPES = [
  { type: 1, key: "RGPD_EMAIL" as const, label: "RGPD Email", description: "Communications marketing par email" },
  { type: 2, key: "RGPD_SMS" as const, label: "RGPD SMS", description: "Communications marketing par SMS" },
  { type: 3, key: "CGS_DEPANSSUR" as const, label: "CGS Dépanssur", description: "Conditions générales de service" },
] as const

function formatConsentDate(dateStr: string | undefined): string {
  if (!dateStr) return ""
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

interface ClientConsentsProps {
  clientId: string
  initialConsentements: ConsentementRGPD[]
}

export function ClientConsents({ clientId, initialConsentements }: ClientConsentsProps) {
  const [consentements, setConsentements] = React.useState<ConsentementRGPD[]>(initialConsentements)
  const [loadingType, setLoadingType] = React.useState<number | null>(null)

  // Sync if parent passes updated initial data
  React.useEffect(() => {
    setConsentements(initialConsentements)
  }, [initialConsentements])

  // Find existing consent for a given type number
  const findConsent = (typeNum: number): ConsentementRGPD | undefined =>
    consentements.find((c) => (c.type as number) === typeNum)

  const handleToggle = async (
    typeNum: number,
    typeKey: "RGPD_EMAIL" | "RGPD_SMS" | "CGS_DEPANSSUR",
    newValue: boolean,
  ) => {
    setLoadingType(typeNum)

    try {
      const existing = findConsent(typeNum)

      if (newValue) {
        // --- GRANT consent ---
        if (existing && !existing.accorde) {
          // Re-grant: update existing
          const result = await updateConsentement({
            id: existing.id,
            accorde: true,
            source: "CRM",
          })
          if (result.error) throw new Error(result.error)
          // Update local state
          setConsentements((prev) =>
            prev.map((c) =>
              c.id === existing.id
                ? { ...c, accorde: true, dateAccord: new Date().toISOString(), dateRetrait: undefined }
                : c,
            ),
          )
        } else if (!existing) {
          // Create new consent
          const result = await createConsentement({
            clientBaseId: clientId,
            type: typeKey,
            accorde: true,
            dateAccord: new Date().toISOString(),
            source: "CRM",
          })
          if (result.error) throw new Error(result.error)
          if (result.data) {
            setConsentements((prev) => [...prev, result.data!])
          }
        }
        toast.success("Consentement accordé", {
          description: CONSENT_TYPES.find((t) => t.type === typeNum)?.label,
        })
      } else {
        // --- REVOKE consent ---
        if (existing) {
          const result = await updateConsentement({
            id: existing.id,
            accorde: false,
            dateRetrait: new Date().toISOString(),
            source: "CRM",
          })
          if (result.error) throw new Error(result.error)
          // Update local state
          setConsentements((prev) =>
            prev.map((c) =>
              c.id === existing.id
                ? { ...c, accorde: false, dateRetrait: new Date().toISOString() }
                : c,
            ),
          )
          toast.success("Consentement révoqué", {
            description: CONSENT_TYPES.find((t) => t.type === typeNum)?.label,
          })
        }
      }
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : "Impossible de modifier le consentement",
      })
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <div className="space-y-3">
      {CONSENT_TYPES.map(({ type, key, label, description }) => {
        const consent = findConsent(type)
        const isGranted = consent?.accorde === true
        const isLoading = loadingType === type
        const dateLabel = consent
          ? consent.accorde
            ? `Accordé le ${formatConsentDate(consent.dateAccord)}`
            : `Retiré le ${formatConsentDate(consent.dateRetrait ?? consent.dateAccord)}`
          : null

        return (
          <div key={type} className="flex items-center justify-between gap-3 rounded-md py-1.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{label}</span>
                {consent && (
                  <Badge
                    variant="secondary"
                    className={
                      isGranted
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-rose-100 text-rose-700 border-rose-200"
                    }
                  >
                    {isGranted ? "Accordé" : "Refusé"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {dateLabel ?? description}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isLoading && <Loader2 className="size-3.5 animate-spin text-slate-400" />}
              <Switch
                checked={isGranted}
                onCheckedChange={(checked) => handleToggle(type, key, checked)}
                disabled={isLoading}
                aria-label={`${isGranted ? "Révoquer" : "Accorder"} ${label}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
