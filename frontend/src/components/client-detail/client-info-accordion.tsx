"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  FolderOpen,
  User,
  Briefcase,
  Phone,
  Calendar,
  Mail,
  MapPin,
  Shield,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Globe,
  CreditCard,
  FileText,
  Eye,
  EyeOff,
  Megaphone,
  Loader2,
} from "lucide-react"
import { EditableField } from "./editable-field"
import { ClientConsents } from "./client-consents"
import { listConsentementsByClient } from "@/actions/consentements"
import type { ClientInfo, ComplianceInfo, BankInfo } from "@/lib/ui/display-types/client"
import type { ConsentementRGPD } from "@proto/depanssur/depanssur"

// --- IBAN masking ---
function maskIban(iban: string): string {
  if (!iban || iban.length < 8) return iban
  return iban.slice(0, 4) + "*".repeat(iban.length - 8) + iban.slice(-4)
}


interface ClientInfoAccordionProps {
  clientId: string
  clientInfo: ClientInfo
  compliance: ComplianceInfo
  bank: BankInfo
  onUpdateField?: (field: string, value: string) => Promise<void>
}

export function ClientInfoAccordion({
  clientId,
  clientInfo,
  compliance,
  bank,
  onUpdateField,
}: ClientInfoAccordionProps) {
  const [ibanVisible, setIbanVisible] = React.useState(false)
  const [consentements, setConsentements] = React.useState<ConsentementRGPD[]>([])
  const [consLoading, setConsLoading] = React.useState(true)

  // Load consentements on mount
  React.useEffect(() => {
    let cancelled = false
    async function load() {
      setConsLoading(true)
      try {
        const result = await listConsentementsByClient(clientId)
        if (!cancelled && result.data) {
          setConsentements(result.data.consentements ?? [])
        }
      } catch {
        // silently fail — we'll show "Aucun consentement"
      } finally {
        if (!cancelled) setConsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [clientId])

  const getVariantClass = (variant: "success" | "warning" | "error") => {
    switch (variant) {
      case "success":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "warning":
        return "bg-amber-100 text-amber-700 border-amber-200"
      case "error":
        return "bg-rose-100 text-rose-700 border-rose-200"
      default:
        return ""
    }
  }

  const getTextVariantClass = (variant: "success" | "warning" | "error") => {
    switch (variant) {
      case "success":
        return "text-emerald-700"
      case "warning":
        return "text-amber-700"
      case "error":
        return "text-rose-600"
      default:
        return ""
    }
  }

  const getStatusIcon = (variant: "success" | "warning" | "error") => {
    switch (variant) {
      case "success":
        return CheckCircle2
      case "warning":
        return AlertCircle
      case "error":
        return XCircle
      default:
        return CheckCircle2
    }
  }

  const KycIcon = getStatusIcon(compliance.kycStatusVariant)
  const SepaIcon = getStatusIcon(bank.sepaMandateStatusVariant)

  // Derive GDPR variant from loaded consentements
  const gdprVariant: "success" | "warning" | "error" = consentements.length > 0
    ? consentements.every((c) => c.accorde) ? "success" : "warning"
    : "warning"
  const GdprIcon = getStatusIcon(gdprVariant)

  return (
    <div className="lg:col-span-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 gap-0">
        <CardHeader>
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-950">
              <FolderOpen className="size-5" />
              Dossier client
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Informations personnelles et bancaires
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="coordonnees" className="w-full">
            <AccordionItem value="coordonnees">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2">
                  <User className="size-4" />
                  Coordonnées
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-slate-800 grid grid-cols-1 gap-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <EditableField
                      value={clientInfo.nom}
                      label="Nom"
                      icon={<User className="size-4" />}
                      onSave={(value) => onUpdateField?.("nom", value) ?? Promise.resolve()}
                    />
                    <EditableField
                      value={clientInfo.prenom}
                      label="Prénom"
                      icon={<User className="size-4" />}
                      onSave={(value) => onUpdateField?.("prenom", value) ?? Promise.resolve()}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <EditableField
                      value={clientInfo.profession}
                      label="Profession"
                      icon={<Briefcase className="size-4" />}
                      onSave={(value) => onUpdateField?.("profession", value) ?? Promise.resolve()}
                    />
                    <EditableField
                      value={clientInfo.phone}
                      label="Téléphone"
                      icon={<Phone className="size-4" />}
                      inputType="tel"
                      onSave={(value) => onUpdateField?.("telephone", value) ?? Promise.resolve()}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <EditableField
                      value={clientInfo.birthDate}
                      label="Date de naissance"
                      icon={<Calendar className="size-4" />}
                      onSave={(value) => onUpdateField?.("dateNaissance", value) ?? Promise.resolve()}
                    />
                    <EditableField
                      value={clientInfo.email}
                      label="Email"
                      icon={<Mail className="size-4" />}
                      inputType="email"
                      onSave={(value) => onUpdateField?.("email", value) ?? Promise.resolve()}
                    />
                  </div>
                  <EditableField
                    value={clientInfo.address}
                    label="Adresse de facturation"
                    icon={<MapPin className="size-4" />}
                    onSave={(value) => onUpdateField?.("adresse", value) ?? Promise.resolve()}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="conformite">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2">
                  <Shield className="size-4" />
                  Conformité & Préférences
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-sm space-y-3 text-slate-800">
                  {/* KYC Status */}
                  <div className="flex items-start gap-2">
                    <KycIcon className={`size-4 mt-0.5 ${getTextVariantClass(compliance.kycStatusVariant)}`} />
                    <div className="flex-1">
                      <div className="text-slate-600 text-xs">Statut KYC</div>
                      <div className={`font-medium ${getTextVariantClass(compliance.kycStatusVariant)}`}>
                        {compliance.kycStatus || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Consentements RGPD — interactive toggles */}
                  <div className="flex items-start gap-2">
                    <GdprIcon className={`size-4 mt-0.5 ${getTextVariantClass(gdprVariant)}`} />
                    <div className="flex-1">
                      <div className="text-slate-600 text-xs mb-1">Consentements RGPD</div>
                      {consLoading ? (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Loader2 className="size-3.5 animate-spin" />
                          <span className="text-xs">Chargement…</span>
                        </div>
                      ) : (
                        <ClientConsents clientId={clientId} initialConsentements={consentements} />
                      )}
                    </div>
                  </div>

                  {/* Language */}
                  <div className="flex items-start gap-2">
                    <Globe className="size-4 text-slate-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-slate-600 text-xs">Langue</div>
                      <div className="font-medium">{compliance.language || "—"}</div>
                    </div>
                  </div>

                  {/* Source & Canal d'acquisition */}
                  {(compliance.source || compliance.canalAcquisition) && (
                    <div className="flex items-start gap-2">
                      <Megaphone className="size-4 text-slate-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-slate-600 text-xs">Source / Canal d&apos;acquisition</div>
                        <div className="font-medium">
                          {[compliance.source, compliance.canalAcquisition]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="banque">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2">
                  <CreditCard className="size-4" />
                  Informations bancaires
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-slate-800 space-y-3 text-sm">
                  {/* IBAN — masked by default, toggle with eye icon */}
                  <div className="flex items-start gap-2">
                    <CreditCard className="size-4 text-slate-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-slate-600 text-xs">IBAN</div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold tracking-tight text-xs">
                          {bank.iban
                            ? (ibanVisible ? bank.iban : maskIban(bank.iban))
                            : "—"}
                        </span>
                        {bank.iban && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-slate-400 hover:text-slate-700"
                            onClick={() => setIbanVisible((v) => !v)}
                            aria-label={ibanVisible ? "Masquer l'IBAN" : "Afficher l'IBAN"}
                          >
                            {ibanVisible ? (
                              <EyeOff className="size-3.5" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BIC */}
                  <div className="flex items-start gap-2">
                    <CreditCard className="size-4 text-slate-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-slate-600 text-xs">BIC</div>
                      <div className="font-mono font-semibold tracking-tight text-xs">
                        {bank.bic || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Mandat SEPA */}
                  <div className="flex items-start gap-2">
                    <SepaIcon className={`size-4 mt-0.5 ${getTextVariantClass(bank.sepaMandateStatusVariant)}`} />
                    <div className="flex-1">
                      <div className="text-slate-600 text-xs mb-1">Mandat SEPA</div>
                      <Badge
                        variant="secondary"
                        className={getVariantClass(bank.sepaMandateStatusVariant)}
                      >
                        {bank.sepaMandateStatus || "—"}
                      </Badge>
                    </div>
                  </div>

                  <Button variant="link" size="sm" className="px-0 gap-2 h-auto">
                    <FileText className="size-3.5" />
                    Voir le document
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
