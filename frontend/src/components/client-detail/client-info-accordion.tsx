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
} from "lucide-react"
import { EditableField } from "./editable-field"
import type { ClientInfo, ComplianceInfo, BankInfo } from "@/lib/ui/display-types/client"

interface ClientInfoAccordionProps {
  clientInfo: ClientInfo
  compliance: ComplianceInfo
  bank: BankInfo
  onUpdateField?: (field: string, value: string) => Promise<void>
}

export function ClientInfoAccordion({
  clientInfo,
  compliance,
  bank,
  onUpdateField,
}: ClientInfoAccordionProps) {
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
  const GdprIcon = getStatusIcon(compliance.gdprConsentVariant)
  const SepaIcon = getStatusIcon(bank.sepaMandateStatusVariant)

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
                  <div className="flex items-start gap-2">
                    <KycIcon className={`size-4 mt-0.5 ${getTextVariantClass(compliance.kycStatusVariant)}`} />
                    <div className="flex-1">
                      <div className="text-slate-600 text-xs">Statut KYC</div>
                      <div className={`font-medium ${getTextVariantClass(compliance.kycStatusVariant)}`}>
                        {compliance.kycStatus}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <GdprIcon className={`size-4 mt-0.5 ${getTextVariantClass(compliance.gdprConsentVariant)}`} />
                    <div className="flex-1">
                      <div className="text-slate-600 text-xs">Consentements RGPD</div>
                      <div className={`font-medium ${getTextVariantClass(compliance.gdprConsentVariant)}`}>
                        {compliance.gdprConsent}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Globe className="size-4 text-slate-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-slate-600 text-xs">Langue</div>
                      <div className="font-medium">{compliance.language}</div>
                    </div>
                  </div>
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
                  <div className="flex items-start gap-2">
                    <CreditCard className="size-4 text-slate-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-slate-600 text-xs">IBAN</div>
                      <div className="font-mono font-semibold tracking-tight text-xs">{bank.iban}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <SepaIcon className={`size-4 mt-0.5 ${getTextVariantClass(bank.sepaMandateStatusVariant)}`} />
                    <div className="flex-1">
                      <div className="text-slate-600 text-xs mb-1">Mandat SEPA</div>
                      <Badge
                        variant="secondary"
                        className={getVariantClass(bank.sepaMandateStatusVariant)}
                      >
                        {bank.sepaMandateStatus}
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
