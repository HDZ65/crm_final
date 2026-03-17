"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TypeDocument } from "@proto/documents/documents"

const TYPE_DOCUMENT_CONFIG: Record<
  number,
  { label: string; className: string }
> = {
  [TypeDocument.CNI]: {
    label: "CNI",
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  },
  [TypeDocument.RIB]: {
    label: "RIB",
    className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  },
  [TypeDocument.MANDAT_SEPA]: {
    label: "Mandat SEPA",
    className: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
  },
  [TypeDocument.JUSTIFICATIF_DOMICILE]: {
    label: "Justificatif domicile",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
  },
  [TypeDocument.KBIS]: {
    label: "KBIS",
    className: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100",
  },
  [TypeDocument.ATTESTATION_ASSURANCE]: {
    label: "Attestation assurance",
    className: "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-100",
  },
  [TypeDocument.CONTRAT_SIGNE]: {
    label: "Contrat signé",
    className: "bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-100",
  },
  [TypeDocument.AUTRE]: {
    label: "Autre",
    className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
  },
  [TypeDocument.TYPE_DOCUMENT_UNSPECIFIED]: {
    label: "Non spécifié",
    className: "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100",
  },
}

interface DocumentTypeBadgeProps {
  typeDocument: TypeDocument
  className?: string
}

export function DocumentTypeBadge({ typeDocument, className }: DocumentTypeBadgeProps) {
  const config = TYPE_DOCUMENT_CONFIG[typeDocument] ?? TYPE_DOCUMENT_CONFIG[TypeDocument.AUTRE]

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

/** Get label for a TypeDocument value */
export function getTypeDocumentLabel(typeDocument: TypeDocument): string {
  return TYPE_DOCUMENT_CONFIG[typeDocument]?.label ?? "Autre"
}

/** All selectable TypeDocument values (excluding UNSPECIFIED) */
export const SELECTABLE_TYPE_DOCUMENTS = [
  TypeDocument.CNI,
  TypeDocument.RIB,
  TypeDocument.MANDAT_SEPA,
  TypeDocument.JUSTIFICATIF_DOMICILE,
  TypeDocument.KBIS,
  TypeDocument.ATTESTATION_ASSURANCE,
  TypeDocument.CONTRAT_SIGNE,
  TypeDocument.AUTRE,
] as const
