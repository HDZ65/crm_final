"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  Hash,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { getTypeCommercialLabel } from "@/lib/ui/labels/commercial"
import type { Apporteur } from "@proto/commerciaux/commerciaux"

interface CommercialInfoAccordionProps {
  commercial: Apporteur
  societeName?: string
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="size-4 text-slate-500 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <div className="text-slate-600 text-xs">{label}</div>
        <div className="font-medium truncate">{value || "—"}</div>
      </div>
    </div>
  )
}

export function CommercialInfoAccordion({ commercial, societeName }: CommercialInfoAccordionProps) {
  return (
    <div className="lg:col-span-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 gap-0">
        <CardHeader>
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-orange-950">
              <User className="size-5" />
              Dossier commercial
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Informations personnelles et coordonnées
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="coordonnees" className="w-full">
            <AccordionItem value="coordonnees">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2">
                  <Phone className="size-4" />
                  Coordonnées
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-slate-800 space-y-3 text-sm">
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={commercial.email || "Non renseigné"}
                  />
                  <InfoRow
                    icon={Phone}
                    label="Téléphone"
                    value={commercial.telephone || "Non renseigné"}
                  />
                  <InfoRow
                    icon={Building2}
                    label="Société"
                    value={societeName || (commercial.societeId ? "Société spécifique" : "Toutes les sociétés")}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="metadata">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  Métadonnées
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-slate-800 space-y-3 text-sm">
                  <InfoRow
                    icon={User}
                    label="Type"
                    value={getTypeCommercialLabel(commercial.typeApporteur as any)}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Date de création"
                    value={commercial.createdAt ? format(new Date(commercial.createdAt), "PPP à HH:mm", { locale: fr }) : "—"}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Dernière modification"
                    value={commercial.updatedAt ? format(new Date(commercial.updatedAt), "PPP à HH:mm", { locale: fr }) : "—"}
                  />
                  <InfoRow
                    icon={Hash}
                    label="ID"
                    value={commercial.id}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
