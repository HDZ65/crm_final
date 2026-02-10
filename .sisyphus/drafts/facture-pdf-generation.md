# Draft: Génération PDF Factures (Factur-X)

## Requirements (confirmed)
- Entity à utiliser: **InvoiceEntity** (Factur-X conforme réglementation FR)
- Contenu PDF: En-tête société, Infos client, Détail lignes, Totaux, Mentions légales FR, Logo société
- Emplacement bouton: Action par ligne du tableau ET page détail facture
- Bouton "Télécharger PDF" **déjà existe** en placeholder dans `columns.tsx` (ligne 125-126)

## Technical Decisions
- Pattern PDF: Réutiliser le pattern **pdfkit** existant de `bordereau-export.service.ts`
- Buffer streaming: `PDFDocument` → chunks → `Buffer.concat()`
- Stockage: FileSystem local `uploads/factures/{societe}/{annee}/`
- Hash intégrité: SHA256 comme pour les bordereaux
- Frontend pattern: Suivre le pattern bordereau (`window.open(pdfUrl, "_blank")`)

## Research Findings

### Backend (service-finance)
- **InvoiceEntity** a déjà `pdfPath` et `pdfHash` prêts
- **FactureSettingsEntity** fournit toutes les infos branding:
  - logoBase64, logoMimeType, logoPosition
  - primaryColor, secondaryColor
  - companyName, companyAddress, companySiret, companyTvaNumber, companyRcs, companyCapital
  - iban, bic, bankName
  - headerText, footerText, legalMentions, paymentTerms
  - invoicePrefix
- **InvoiceItemEntity** a: description, quantity, unit, unitPriceHT, vatRate, discount, totalHT, totalTVA, totalTTC
- **InvoiceStatus**: DRAFT, VALIDATED, PAID, CANCELLED, CREDIT_NOTE

### Proto (factures.proto)
- **Aucun RPC PDF** n'existe actuellement
- Besoin d'ajouter: `ExportPDF` RPC + messages request/response

### Frontend
- Bouton "Télécharger PDF" **déjà dans le dropdown** de `columns.tsx` (placeholder)
- Server action `exportFacturePDF()` à créer dans `actions/factures.ts`
- gRPC client method à ajouter dans `lib/grpc/clients/factures.ts`
- Pattern à suivre: bordereau export (`window.open(pdfUrl, "_blank")`)

## Answered Questions
- **Lien Invoice ↔ Facture**: Créer un InvoiceEntity à partir de FactureEntity quand on demande le PDF
- **Statuts autorisés pour PDF**: TOUS les statuts (mention "BROUILLON" pour les drafts)
- **Page détail facture**: N'existe PAS encore → bouton PDF uniquement dans dropdown actions du tableau pour l'instant

## Scope Boundaries
- INCLUDE: Service backend PDF (pdfkit), conversion FactureEntity → InvoiceEntity, proto RPC, server action, intégration columns.tsx, stockage fichiers, tests
- EXCLUDE: Factur-X XML embarqué (complexe, V2), page détail facture (hors scope), Excel export facture
