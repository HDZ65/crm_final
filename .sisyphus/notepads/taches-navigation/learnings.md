# Navigation Bidirectionnelle Tâches ↔ Configuration

## Tâche Complétée
Ajout de la navigation bidirectionnelle entre `/taches` et `/taches/configuration`.

## Modifications Apportées

### 1. taches-page-client.tsx
- **Imports ajoutés:**
  - `Settings2` de lucide-react (ligne 25)
  - `Link` de next/link (ligne 27)

- **Bouton Settings2 ajouté (ligne 371-375):**
  ```tsx
  <Button variant="outline" size="icon" asChild>
    <Link href="/taches/configuration">
      <Settings2 className="h-4 w-4" />
    </Link>
  </Button>
  ```
  - Positionné AVANT le bouton "Nouvelle tâche"
  - Variant outline pour cohérence avec les autres boutons
  - Size icon pour un bouton compact

### 2. configuration/page.tsx
- **Imports ajoutés:**
  - `ChevronLeft` de lucide-react (ligne 86)
  - `Link` de next/link (ligne 88)

- **Bouton retour ajouté (ligne 276-281):**
  ```tsx
  <Button variant="ghost" size="sm" asChild>
    <Link href="/taches">
      <ChevronLeft className="mr-1 h-4 w-4" />
      Retour aux tâches
    </Link>
  </Button>
  ```
  - Positionné AU-DESSUS du titre H1
  - Variant ghost pour un style discret
  - Size sm pour un bouton compact
  - Icône ChevronLeft + texte "Retour aux tâches"

## Patterns Utilisés
- `asChild` prop de Button pour wrapper Link (Next.js best practice)
- Icônes lucide-react pour cohérence visuelle
- Variants shadcn (outline, ghost) pour cohérence UI
- Spacing avec `mr-1` et `mr-2` pour alignement icône-texte

## Vérification
- ✅ TypeScript: Aucune erreur liée aux modifications
- ✅ Imports: Tous les imports sont corrects
- ✅ Navigation: Bidirectionnelle `/taches` ↔ `/taches/configuration`
- ✅ Positionnement: Settings2 AVANT "Nouvelle tâche", retour AU-DESSUS du titre
