# Génération PDF Factures (Factur-X)

## TL;DR

> **Quick Summary**: Implémenter la génération PDF des factures en réutilisant le pattern pdfkit existant (bordereaux). Convertir FactureEntity → InvoiceEntity à la volée, générer un PDF conforme FR avec mentions légales, stocker sur le filesystem, et exposer via un bouton "Télécharger PDF" déjà présent en placeholder dans le tableau facturation.
> 
> **Deliverables**:
> - Backend: Service de génération PDF (`facture-pdf-export.service.ts`) + service stockage (`facture-pdf-storage.service.ts`)
> - Proto: RPC `GeneratePdf` ajouté à `FactureService` dans `factures.proto`
> - Backend gRPC: Endpoint `GeneratePdf` dans `facture.controller.ts`
> - Frontend: Server action + gRPC client + wiring du dropdown button
> - Proto types: Regénération des types TS
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 (proto) → Task 3 (proto TS gen) → Task 5 (frontend)

---

## Context

### Original Request
L'utilisateur veut générer des PDF pour ses factures. Le bouton "Télécharger PDF" existe déjà en placeholder dans le dropdown d'actions du tableau facturation (`columns.tsx:124-126`). Le backend dispose déjà d'un pattern complet de génération PDF via pdfkit pour les bordereaux de commissions.

### Interview Summary
**Key Discussions**:
- **Entity**: Utiliser InvoiceEntity (Factur-X) comme cible, convertir FactureEntity → InvoiceEntity à la demande
- **Contenu PDF**: En-tête société (logo, infos), client, lignes avec TVA, totaux HT/TVA/TTC, mentions légales FR
- **Statuts**: PDF générable pour TOUS les statuts (watermark "BROUILLON" pour les drafts)
- **Placement**: Dropdown actions par ligne du tableau (déjà en placeholder)
- **Pas de page détail facture** pour l'instant

### Research Findings
- **Pattern existant**: `bordereau-export.service.ts` utilise pdfkit avec buffer streaming → SHA256 → stockage filesystem
- **InvoiceEntity** a `pdfPath` et `pdfHash` prêts à être remplis
- **FactureSettingsEntity** fournit toutes les données de branding (logo, couleurs, infos société, mentions légales, coordonnées bancaires)
- **Proto actuel**: Aucun RPC PDF dans `factures.proto` — à ajouter
- **Frontend**: Bouton placeholder à `columns.tsx:124-126`, pattern bordereau export (`window.open(pdfUrl)`) réutilisable

---

## Work Objectives

### Core Objective
Permettre le téléchargement de factures au format PDF conforme à la réglementation française, avec mentions légales obligatoires, directement depuis le tableau de facturation.

### Concrete Deliverables
- `packages/proto/src/factures/factures.proto` — messages + RPC `GeneratePdf`
- `frontend/src/proto/factures/factures.ts` — types TS regénérés
- `services/service-finance/src/domain/factures/services/facture-pdf-export.service.ts` — génération PDF
- `services/service-finance/src/domain/factures/services/facture-pdf-storage.service.ts` — stockage fichier
- `services/service-finance/src/infrastructure/grpc/factures/facture.controller.ts` — endpoint gRPC
- `services/service-finance/src/factures.module.ts` — wiring des nouveaux services
- `frontend/src/actions/factures.ts` — server action `generateFacturePdf()`
- `frontend/src/lib/grpc/clients/factures.ts` — méthode gRPC client
- `frontend/src/app/(main)/facturation/columns.tsx` — wiring du bouton

### Definition of Done
- [ ] Le bouton "Télécharger PDF" dans le dropdown du tableau génère et télécharge un PDF
- [ ] Le PDF contient : en-tête société, infos client, tableau des lignes, totaux, mentions légales
- [ ] Les factures brouillon ont un watermark "BROUILLON"
- [ ] Le PDF est stocké sur le filesystem avec hash SHA256
- [ ] `npm run build` (frontend) et `bun run build` (service-finance) passent sans erreur

### Must Have
- Pattern pdfkit avec buffer streaming (comme bordereau-export.service.ts)
- Mentions légales françaises (pénalités retard, indemnité recouvrement 40€, conditions paiement)
- Logo société si disponible dans FactureSettings
- Stockage fichier avec hash intégrité SHA256
- Watermark "BROUILLON" pour les factures non validées
- Labels et textes en français

### Must NOT Have (Guardrails)
- Ne PAS implémenter Factur-X XML embarqué (V2)
- Ne PAS créer de page détail facture
- Ne PAS ajouter d'export Excel (hors scope)
- Ne PAS modifier les entities existantes (FactureEntity, InvoiceEntity)
- Ne PAS changer la structure du tableau facturation
- Ne PAS ajouter de nouvelles dépendances npm (pdfkit est déjà installé dans service-commercial, il faut l'ajouter dans service-finance)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: OUI (bun test dans service-commercial)
- **Automated tests**: OUI (tests-after) — test unitaire pour le service PDF
- **Framework**: bun test
- **Agent-Executed QA**: OUI (build verification + curl test backend)

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Proto definition (GeneratePdf RPC + messages)
└── Task 2: Backend services (facture-pdf-export + storage)

Wave 2 (After Wave 1):
├── Task 3: Proto TS generation + backend controller + module wiring
└── (blocked by Task 1 + 2)

Wave 3 (After Wave 2):
├── Task 4: Frontend server action + gRPC client
└── Task 5: Frontend columns.tsx wiring

Wave 4 (After Wave 3):
└── Task 6: Build verification + pdfkit dependency
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4 | 2 |
| 2 | None | 3 | 1 |
| 3 | 1, 2 | 4, 5 | None |
| 4 | 3 | 5 | None |
| 5 | 4 | 6 | None |
| 6 | 5 | None | None (final) |

---

## TODOs

- [ ] 1. Ajouter les messages et RPC `GeneratePdf` dans factures.proto

  **What to do**:
  - Ouvrir `packages/proto/src/factures/factures.proto`
  - Ajouter les messages `GeneratePdfRequest` et `GeneratePdfResponse` après le bloc `CalculateTotalsResponse` (après ligne 436)
  - Ajouter le RPC `GeneratePdf` dans le service `FactureService` (après ligne 475, avant la fermeture `}`)

  **Messages à ajouter** (après ligne 436):
  ```protobuf
  // ===== PDF GENERATION =====

  message GeneratePdfRequest {
    string id = 1;
    string organisation_id = 2;
  }

  message GeneratePdfResponse {
    bool success = 1;
    string pdf_url = 2;
    string pdf_hash = 3;
    string filename = 4;
    string error = 5;
  }
  ```

  **RPC à ajouter** dans `FactureService` (ligne 475):
  ```protobuf
  rpc GeneratePdf(GeneratePdfRequest) returns (GeneratePdfResponse);
  ```

  **Must NOT do**:
  - Ne PAS modifier les messages ou RPCs existants
  - Ne PAS ajouter de nouveau service proto (réutiliser `FactureService`)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
    - Tâche simple d'édition de fichier proto

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: [Task 3, Task 4]
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `packages/proto/src/factures/factures.proto:436-437` — Emplacement pour les nouveaux messages (après CalculateTotalsResponse)
  - `packages/proto/src/factures/factures.proto:465-476` — Service FactureService où ajouter le RPC
  - `packages/proto/src/commission/commission.proto:595` — Pattern `pdf_url` dans les réponses d'export (commission proto)

  **Acceptance Criteria**:
  - [ ] Messages `GeneratePdfRequest` et `GeneratePdfResponse` ajoutés dans factures.proto
  - [ ] RPC `GeneratePdf(GeneratePdfRequest) returns (GeneratePdfResponse)` ajouté dans `FactureService`
  - [ ] Proto file syntax valide (pas d'erreurs de compilation proto)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Proto file is syntactically valid
    Tool: Bash
    Steps:
      1. Run: cat packages/proto/src/factures/factures.proto | grep "GeneratePdf"
      2. Assert: 3 matches (message request, message response, rpc)
      3. Assert: file contains "rpc GeneratePdf(GeneratePdfRequest) returns (GeneratePdfResponse)"
    Expected Result: All proto additions present and syntactically correct
    Evidence: Terminal output captured
  ```

  **Commit**: NO (groups with Task 3)

---

- [ ] 2. Créer les services backend de génération PDF et stockage

  **What to do**:
  - Créer `services/service-finance/src/domain/factures/services/facture-pdf-export.service.ts`
  - Créer `services/service-finance/src/domain/factures/services/facture-pdf-storage.service.ts`
  - Ajouter pdfkit comme dépendance de service-finance

  **facture-pdf-export.service.ts** — Service principal de génération PDF:
  - Classe `FacturePdfExportService` annotée `@Injectable()`
  - Injecter `Repository<FactureSettingsEntity>` via `@InjectRepository()`
  - Méthode `async genererPDF(facture: FactureEntity, lignes: LigneFactureEntity[]): Promise<Buffer>`
  - Méthode `calculerHashSHA256(buffer: Buffer): string`
  - Utiliser le pattern exact de `bordereau-export.service.ts`:
    ```typescript
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    // ... render ...
    doc.end();
    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });
    ```

  **Layout du PDF** (structure page):
  1. **En-tête** (haut de page):
     - Logo société (si `settings.logoBase64` existe, décoder et insérer via `doc.image()`)
     - Nom société (20pt, gras), adresse, téléphone, email
     - SIRET, TVA intracommunautaire, RCS, Capital social
  2. **Titre**: "FACTURE" (ou "FACTURE - BROUILLON" si non validée) — 18pt centré
     - Numéro facture, Date d'émission, Date d'échéance
  3. **Bloc client** (encadré):
     - Nom, adresse client (depuis `facture.client` relation)
     - SIRET client si disponible
  4. **Tableau des lignes** (grille):
     - Colonnes: Description | Qté | Prix unit. HT | TVA % | Montant HT
     - Lignes de la facture avec montants formatés
     - Pagination automatique (page break si y > 700)
  5. **Totaux** (aligné à droite):
     - Total HT, Total TVA, **Total TTC** (gras, plus grand)
  6. **Mentions légales** (bas de page, 8pt):
     - Conditions de paiement (depuis `settings.paymentTerms` ou défaut "30 jours")
     - "En cas de retard de paiement, une pénalité de X% sera appliquée (taux BCE + 10 points)"
     - "Indemnité forfaitaire pour frais de recouvrement : 40,00 €"
     - Mention TVA si applicable (depuis `settings.legalMentions`)
  7. **Pied de page**:
     - Coordonnées bancaires (IBAN, BIC, Banque) si disponibles
     - `settings.footerText` si défini

  **Watermark "BROUILLON"**:
  - Si la facture n'a PAS de statut validé/finalisé, ajouter un watermark diagonal
  - `doc.save()`, rotation 45°, texte "BROUILLON" en 60pt, opacité 0.15, `doc.restore()`

  **facture-pdf-storage.service.ts** — Stockage fichier:
  - Classe `FacturePdfStorageService` annotée `@Injectable()`
  - Méthode `async sauvegarder(input: { societe: string, annee: string, reference: string, pdfBuffer: Buffer }): Promise<{ pdfUrl: string, pdfAbsolutePath: string }>`
  - Même pattern que `bordereau-file-storage.service.ts`:
    - Répertoire: `uploads/factures/{societe}/{annee}/`
    - Nom fichier: `FAC_{reference}_{timestamp}.pdf`
    - Sanitisation des noms (trim, lowercase, remplacer non-alphanum)
    - Créer le répertoire avec `mkdir -p` (recursive)
    - Écrire le buffer avec `writeFile()`
    - Retourner URL relative + chemin absolu

  **Dépendance pdfkit**:
  - Ajouter `pdfkit` dans `services/service-finance/package.json` devDependencies
  - Run `bun install` dans service-finance

  **Must NOT do**:
  - Ne PAS modifier les entities existantes
  - Ne PAS modifier bordereau-export.service.ts
  - Ne PAS ajouter de framework PDF autre que pdfkit

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
    - Code backend NestJS, pas de compétence frontend nécessaire

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: [Task 3]
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `services/service-commercial/src/domain/commercial/services/bordereau-export.service.ts:1-96` — Pattern COMPLET pdfkit: buffer streaming, layout, pagination, hash SHA256
  - `services/service-commercial/src/domain/commercial/services/bordereau-file-storage.service.ts:1-49` — Pattern COMPLET stockage fichier: sanitisation noms, mkdir, writeFile, URL generation

  **API/Type References**:
  - `services/service-finance/src/domain/factures/entities/facture.entity.ts` — FactureEntity avec relations (client, lignes, statut)
  - `services/service-finance/src/domain/factures/entities/ligne-facture.entity.ts` — LigneFactureEntity avec montants
  - `services/service-finance/src/domain/factures/entities/facture-settings.entity.ts` — FactureSettingsEntity avec branding complet
  - `services/service-finance/src/domain/factures/entities/invoice.entity.ts:154-166` — Champs pdfPath et pdfHash à remplir

  **Test References**:
  - `services/service-commercial/src/domain/commercial/services/__tests__/bordereau-export.service.spec.ts` — Pattern de test: mock entities, vérification buffer size, hash determinism

  **Acceptance Criteria**:
  - [ ] Fichier `facture-pdf-export.service.ts` créé avec classe `@Injectable()`
  - [ ] Méthode `genererPDF()` retourne un Buffer non vide (>100 bytes)
  - [ ] Méthode `calculerHashSHA256()` retourne un hash déterministe
  - [ ] PDF contient: en-tête société, infos client, tableau lignes, totaux, mentions légales
  - [ ] Watermark "BROUILLON" ajouté pour factures non validées
  - [ ] Fichier `facture-pdf-storage.service.ts` créé avec `sauvegarder()` qui écrit sur le filesystem
  - [ ] `pdfkit` ajouté dans `services/service-finance/package.json`

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Service files exist and compile
    Tool: Bash
    Steps:
      1. Run: ls services/service-finance/src/domain/factures/services/
      2. Assert: facture-pdf-export.service.ts exists
      3. Assert: facture-pdf-storage.service.ts exists
      4. Run: cd services/service-finance && bun run build
      5. Assert: exit code 0
    Expected Result: Both files exist and project compiles
    Evidence: Terminal output captured
  ```

  **Commit**: NO (groups with Task 3)

---

- [ ] 3. Wiring backend: gRPC endpoint + module registration + proto TS generation

  **What to do**:
  - Ajouter endpoint `GeneratePdf` dans `services/service-finance/src/infrastructure/grpc/factures/facture.controller.ts`
  - Mettre à jour `services/service-finance/src/factures.module.ts` pour enregistrer les nouveaux services
  - Regénérer les types proto TS: `bun run proto:generate` (ou commande équivalente dans packages/proto)
  - Copier les types générés dans `frontend/src/proto/factures/factures.ts`

  **Endpoint gRPC** (ajouter dans `facture.controller.ts`):
  ```typescript
  @GrpcMethod('FactureService', 'GeneratePdf')
  async generatePdf(data: GeneratePdfRequest) {
    // 1. Fetch facture avec relations (lignes, client, statut)
    const facture = await this.factureService.findById(data.id);
    if (!facture) {
      throw new RpcException({ code: status.NOT_FOUND, message: 'Facture non trouvée' });
    }
    if (facture.organisationId !== data.organisation_id) {
      throw new RpcException({ code: status.PERMISSION_DENIED, message: 'Facture non accessible' });
    }

    // 2. Fetch lignes
    const lignes = facture.lignes || [];

    // 3. Générer PDF
    const pdfBuffer = await this.facturePdfExportService.genererPDF(facture, lignes);
    const pdfHash = this.facturePdfExportService.calculerHashSHA256(pdfBuffer);

    // 4. Stocker le fichier
    const annee = new Date(facture.dateEmission).getFullYear().toString();
    const storage = await this.facturePdfStorageService.sauvegarder({
      societe: data.organisation_id,
      annee,
      reference: facture.numero || facture.id,
      pdfBuffer,
    });

    // 5. Retourner
    return {
      success: true,
      pdf_url: storage.pdfUrl,
      pdf_hash: pdfHash,
      filename: `facture_${facture.numero || facture.id}.pdf`,
    };
  }
  ```

  **Module wiring** (`factures.module.ts`):
  - Ajouter imports: `FacturePdfExportService`, `FacturePdfStorageService`
  - Ajouter dans `providers`: les 2 nouveaux services
  - Injecter dans `FactureController` via constructeur

  **Proto TS generation**:
  - Vérifier la commande de génération proto: chercher dans `packages/proto/package.json` le script `proto:generate` ou `buf generate`
  - Exécuter la génération depuis `packages/proto`
  - Vérifier que `frontend/src/proto/factures/factures.ts` contient les nouveaux types `GeneratePdfRequest` et `GeneratePdfResponse`

  **Must NOT do**:
  - Ne PAS modifier les endpoints existants dans le controller
  - Ne PAS changer la structure du module au-delà des ajouts

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential)
  - **Blocks**: [Task 4, Task 5]
  - **Blocked By**: [Task 1, Task 2]

  **References**:

  **Pattern References**:
  - `services/service-finance/src/infrastructure/grpc/factures/facture.controller.ts:1-93` — Controller existant, structure d'endpoint, pattern @GrpcMethod
  - `services/service-commercial/src/infrastructure/grpc/commercial/commission.controller.ts:461-514` — Pattern ExportBordereauFiles: fetch → generate → store → update → return
  - `services/service-finance/src/factures.module.ts:1-56` — Module actuel à étendre

  **API/Type References**:
  - `packages/proto/src/factures/factures.proto` — Proto source (modifié en Task 1)
  - `packages/proto/buf.gen.yaml` — Configuration de génération proto
  - `packages/proto/package.json` — Scripts de génération

  **Acceptance Criteria**:
  - [ ] Endpoint `GeneratePdf` ajouté dans `facture.controller.ts`
  - [ ] `FacturePdfExportService` et `FacturePdfStorageService` enregistrés dans `factures.module.ts`
  - [ ] Types TS regénérés: `GeneratePdfRequest` et `GeneratePdfResponse` présents dans `frontend/src/proto/factures/factures.ts`
  - [ ] `bun run build` dans service-finance passe sans erreur

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Backend builds with new endpoint
    Tool: Bash
    Steps:
      1. Run: cd services/service-finance && bun run build
      2. Assert: exit code 0
      3. Run: grep "GeneratePdf" services/service-finance/src/infrastructure/grpc/factures/facture.controller.ts
      4. Assert: at least 1 match
    Expected Result: Service compiles with new endpoint
    Evidence: Terminal output captured

  Scenario: Proto types generated correctly
    Tool: Bash
    Steps:
      1. Run: grep "GeneratePdfRequest" frontend/src/proto/factures/factures.ts
      2. Assert: interface found
      3. Run: grep "GeneratePdfResponse" frontend/src/proto/factures/factures.ts
      4. Assert: interface found with pdf_url field
    Expected Result: TS proto types contain new messages
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(factures): add PDF generation backend with pdfkit and GeneratePdf gRPC endpoint`
  - Files: `packages/proto/src/factures/factures.proto`, `frontend/src/proto/factures/factures.ts`, `services/service-finance/src/domain/factures/services/facture-pdf-export.service.ts`, `services/service-finance/src/domain/factures/services/facture-pdf-storage.service.ts`, `services/service-finance/src/infrastructure/grpc/factures/facture.controller.ts`, `services/service-finance/src/factures.module.ts`, `services/service-finance/package.json`
  - Pre-commit: `cd services/service-finance && bun run build`

---

- [ ] 4. Frontend: server action + gRPC client pour GeneratePdf

  **What to do**:
  - Ajouter l'import des nouveaux types proto dans `frontend/src/lib/grpc/clients/factures.ts`
  - Ajouter la méthode `generatePdf` dans l'objet `factures` du gRPC client
  - Ajouter la server action `generateFacturePdf()` dans `frontend/src/actions/factures.ts`

  **gRPC client** (`frontend/src/lib/grpc/clients/factures.ts`):
  - Ajouter dans les imports: `type GeneratePdfRequest`, `type GeneratePdfResponse`
  - Ajouter dans l'objet `factures`:
    ```typescript
    generatePdf: (request: GeneratePdfRequest): Promise<GeneratePdfResponse> =>
      promisify<GeneratePdfRequest, GeneratePdfResponse>(
        getFactureClient(),
        "generatePdf"
      )(request),
    ```

  **Server action** (`frontend/src/actions/factures.ts`):
  ```typescript
  /**
   * Générer le PDF d'une facture via gRPC
   */
  export async function generateFacturePdf(
    factureId: string,
    organisationId: string
  ): Promise<ActionResult<{ success: boolean; pdfUrl: string; filename: string }>> {
    try {
      const data = await factures.generatePdf({
        id: factureId,
        organisationId,
      });
      if (!data.success) {
        return { data: null, error: data.error || "Erreur lors de la génération du PDF" };
      }
      return { data: { success: true, pdfUrl: data.pdfUrl, filename: data.filename }, error: null };
    } catch (err) {
      console.error("[generateFacturePdf] gRPC error:", err);
      return {
        data: null,
        error: err instanceof Error ? err.message : "Erreur lors de la génération du PDF",
      };
    }
  }
  ```

  **Must NOT do**:
  - Ne PAS modifier les méthodes gRPC client existantes
  - Ne PAS modifier les server actions existantes

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential)
  - **Blocks**: [Task 5]
  - **Blocked By**: [Task 3]

  **References**:

  **Pattern References**:
  - `frontend/src/lib/grpc/clients/factures.ts:41-80` — Pattern exact des méthodes gRPC client (promisify pattern)
  - `frontend/src/actions/factures.ts:67-99` — Pattern exact des server actions (try/catch, ActionResult, console.error)

  **API/Type References**:
  - `frontend/src/proto/factures/factures.ts` — Types `GeneratePdfRequest` et `GeneratePdfResponse` (générés en Task 3)

  **Acceptance Criteria**:
  - [ ] Méthode `generatePdf` ajoutée dans objet `factures` du gRPC client
  - [ ] Server action `generateFacturePdf()` ajoutée dans `actions/factures.ts`
  - [ ] `cd frontend && npx tsc --noEmit` passe sans erreur dans ces fichiers

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Frontend compiles with new action
    Tool: Bash
    Steps:
      1. Run: cd frontend && npx tsc --noEmit 2>&1 | grep -i "factures" || echo "No errors in factures files"
      2. Assert: No TypeScript errors in factures-related files
    Expected Result: Frontend compiles cleanly
    Evidence: Terminal output captured
  ```

  **Commit**: NO (groups with Task 5)

---

- [ ] 5. Frontend: wiring du bouton "Télécharger PDF" dans columns.tsx

  **What to do**:
  - Modifier `frontend/src/app/(main)/facturation/columns.tsx` pour:
    - Importer `generateFacturePdf` depuis `@/actions/factures`
    - Importer `toast` depuis `sonner`
    - Importer `useOrganisation` depuis `@/contexts/organisation-context`
  - Ajouter un click handler sur le `DropdownMenuItem` "Télécharger PDF" (ligne 124-126)
  - Problème: `columns.tsx` exporte un tableau `columns` (pas un composant), donc `useOrganisation()` ne peut pas être appelé directement
  - Solution: Transformer les columns en fonction qui accepte un callback, OU passer l'organisationId en closures depuis le parent

  **Approche recommandée**:
  - Dans `columns.tsx`, transformer en `getColumns(organisationId: string)` qui retourne les columns
  - OU créer un composant `FactureRowActions` qui encapsule le dropdown et utilise `useOrganisation()` directement
  - La 2ème approche est plus propre (composant React avec hooks)

  **Créer un composant `FactureRowActions`** dans `columns.tsx`:
  ```tsx
  function FactureRowActions({ facture }: { facture: Facture }) {
    const { activeOrganisation } = useOrganisation()
    const [isGenerating, setIsGenerating] = React.useState(false)

    const handleDownloadPdf = async () => {
      if (!activeOrganisation?.organisationId) {
        toast.error("Organisation non trouvée")
        return
      }
      setIsGenerating(true)
      try {
        const result = await generateFacturePdf(facture.id, activeOrganisation.organisationId)
        if (result.data?.success && result.data.pdfUrl) {
          window.open(result.data.pdfUrl, "_blank")
          toast.success("PDF généré avec succès")
        } else {
          toast.error(result.error || "Erreur lors de la génération")
        }
      } finally {
        setIsGenerating(false)
      }
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Ouvrir le menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(facture.numero)}>
            Copier le numéro
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Eye className="mr-2 h-4 w-4" />
            Voir les détails
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadPdf} disabled={isGenerating}>
            <Download className="mr-2 h-4 w-4" />
            {isGenerating ? "Génération..." : "Télécharger PDF"}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Send className="mr-2 h-4 w-4" />
            Envoyer par email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <Ban className="mr-2 h-4 w-4" />
            Annuler
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  ```

  - Remplacer le bloc `cell` de la colonne `actions` (lignes 103-140) pour utiliser `<FactureRowActions facture={facture} />`

  **Must NOT do**:
  - Ne PAS modifier les autres colonnes du tableau
  - Ne PAS changer l'ordre des items du dropdown
  - Ne PAS supprimer les items placeholder existants (Voir détails, Envoyer par email, Annuler)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after Task 4)
  - **Blocks**: [Task 6]
  - **Blocked By**: [Task 4]

  **References**:

  **Pattern References**:
  - `frontend/src/app/(main)/facturation/columns.tsx:101-142` — Bloc actions actuel à remplacer par composant FactureRowActions
  - `frontend/src/components/commissions/bordereaux-list.tsx` — Pattern download PDF bordereau (`window.open(pdfUrl, "_blank")`)
  - `frontend/src/app/(main)/facturation/facturation-page-client.tsx:60` — Pattern `useOrganisation()` déjà utilisé dans la page parent

  **API/Type References**:
  - `frontend/src/actions/factures.ts` — `generateFacturePdf()` ajoutée en Task 4

  **Acceptance Criteria**:
  - [ ] Composant `FactureRowActions` créé dans columns.tsx
  - [ ] Click "Télécharger PDF" appelle `generateFacturePdf()` avec factureId et organisationId
  - [ ] Loading state: texte "Génération..." + disabled pendant la requête
  - [ ] Succès: `window.open(pdfUrl, "_blank")` + toast success
  - [ ] Erreur: toast error avec message
  - [ ] `cd frontend && npm run build` passe sans erreur

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Frontend builds with wired PDF button
    Tool: Bash
    Steps:
      1. Run: cd frontend && npm run build
      2. Assert: exit code 0
      3. Run: grep "handleDownloadPdf" frontend/src/app/\(main\)/facturation/columns.tsx
      4. Assert: at least 1 match
      5. Run: grep "generateFacturePdf" frontend/src/app/\(main\)/facturation/columns.tsx
      6. Assert: at least 1 match
    Expected Result: Build passes with PDF handler wired
    Evidence: Build output captured
  ```

  **Commit**: YES
  - Message: `feat(facturation): wire PDF download button in invoice table actions`
  - Files: `frontend/src/actions/factures.ts`, `frontend/src/lib/grpc/clients/factures.ts`, `frontend/src/app/(main)/facturation/columns.tsx`
  - Pre-commit: `cd frontend && npm run build`

---

- [ ] 6. Vérification finale: dépendance pdfkit + builds complets

  **What to do**:
  - Vérifier que `pdfkit` est installé dans `services/service-finance`:
    - Exécuter `cd services/service-finance && bun add pdfkit && bun add -d @types/pdfkit`
  - Build complet backend: `cd services/service-finance && bun run build`
  - Build complet frontend: `cd frontend && npm run build`
  - Vérifier que le répertoire `uploads/factures/` peut être créé (test mkdir)

  **Must NOT do**:
  - Ne PAS modifier du code à cette étape
  - Ne PAS lancer les services (juste vérifier les builds)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (final)
  - **Blocks**: None
  - **Blocked By**: [Task 5]

  **References**:
  - `services/service-finance/package.json` — Ajouter pdfkit + @types/pdfkit
  - `services/service-commercial/package.json` — Référence: pdfkit déjà installé ici

  **Acceptance Criteria**:
  - [ ] `pdfkit` et `@types/pdfkit` dans `services/service-finance/package.json`
  - [ ] `cd services/service-finance && bun run build` → exit code 0
  - [ ] `cd frontend && npm run build` → exit code 0
  - [ ] Répertoire `uploads/factures/` créable

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full stack builds pass
    Tool: Bash
    Steps:
      1. Run: cd services/service-finance && bun run build
      2. Assert: exit code 0
      3. Run: cd frontend && npm run build
      4. Assert: exit code 0
      5. Run: mkdir -p uploads/factures/test && rmdir uploads/factures/test
      6. Assert: exit code 0
    Expected Result: Both backend and frontend compile, uploads dir writable
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `chore(service-finance): add pdfkit dependency for invoice PDF generation`
  - Files: `services/service-finance/package.json`, `services/service-finance/bun.lock`
  - Pre-commit: `cd services/service-finance && bun run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 3 | `feat(factures): add PDF generation backend with pdfkit and GeneratePdf gRPC endpoint` | proto, services, controller, module | `bun run build` (service-finance) |
| 5 | `feat(facturation): wire PDF download button in invoice table actions` | actions, grpc client, columns | `npm run build` (frontend) |
| 6 | `chore(service-finance): add pdfkit dependency for invoice PDF generation` | package.json, bun.lock | `bun run build` (service-finance) |

---

## Success Criteria

### Verification Commands
```bash
cd services/service-finance && bun run build  # Expected: exit 0
cd frontend && npm run build                    # Expected: exit 0
grep "GeneratePdf" packages/proto/src/factures/factures.proto  # Expected: 3 matches
grep "generatePdf" frontend/src/lib/grpc/clients/factures.ts   # Expected: 1+ match
grep "handleDownloadPdf" frontend/src/app/\(main\)/facturation/columns.tsx  # Expected: 1+ match
```

### Final Checklist
- [ ] Proto `GeneratePdf` RPC ajouté dans `factures.proto`
- [ ] Backend service PDF génère un Buffer valide avec pdfkit
- [ ] Backend stocke le PDF sur filesystem avec hash SHA256
- [ ] gRPC endpoint `GeneratePdf` fonctionne dans le controller
- [ ] Frontend server action `generateFacturePdf()` existe
- [ ] Frontend gRPC client a la méthode `generatePdf`
- [ ] Bouton "Télécharger PDF" dans le dropdown appelle le backend
- [ ] Loading state pendant la génération
- [ ] Toast success/error après génération
- [ ] Builds backend ET frontend passent sans erreur
