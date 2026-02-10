# UX/UI Design Patterns Reference

## Navigation Patterns

### Global Navigation
```
┌──────────────────────────────────────────┐
│ Logo    Nav1  Nav2  Nav3    Search  User  │
├──────────────────────────────────────────┤
│                                          │
│           Page Content                   │
│                                          │
└──────────────────────────────────────────┘
```
- Toujours visible, max 7 items
- Logo = lien Home (coin supérieur gauche)
- Utilitaires (search, compte, panier) à droite

### Mobile Navigation
```
Bottom Nav (≤ 5 items) :
┌─────────────────────────┐
│     Page Content        │
│                         │
├────┬────┬────┬────┬────┤
│ 🏠 │ 🔍 │ ➕ │ 💬 │ 👤 │
└────┴────┴────┴────┴────┘
```
- Zone du pouce : actions principales en bas
- Hamburger menu uniquement pour navigation secondaire
- Touch targets ≥ 44px

### Breadcrumb
```
Home > Catégorie > Sous-catégorie > Page actuelle
```
- Toujours présent sur pages profondes (> 1 niveau)
- Dernier élément = page actuelle (non cliquable)
- Séparateur : `>` ou `/`

## Content Patterns

### Progressive Disclosure
Montrer l'essentiel, révéler le reste à la demande.

```
[Résumé court visible]
[▼ Voir plus de détails]
  → Contenu détaillé caché par défaut
```

**Quand l'utiliser** :
- Formulaires longs → étapes / sections pliables
- Fiches produit → specs techniques en accordéon
- Tableaux de bord → KPIs principaux, drill-down

### Card Pattern
```
┌──────────────────┐
│  Image / Icône   │
│                  │
│  Titre           │
│  Description...  │
│                  │
│  [Action CTA]    │
└──────────────────┘
```
- Scannable : une carte = une unité d'information
- Max 3 lignes de description
- Un seul CTA par carte

### Empty State
```
┌──────────────────────┐
│                      │
│    Illustration      │
│                      │
│  Titre explicatif    │
│  Description aide    │
│                      │
│  [Action primaire]   │
└──────────────────────┘
```
- Jamais une page vide — toujours guider l'utilisateur
- Proposer l'action suivante logique

### Search Results
```
"vélo" — 42 résultats

[Filtres par facettes]    Résultat 1
□ Marque                  ──────────
  ☑ Trek (12)             Titre pertinent
  ☐ Giant (8)             Description avec termes mis en **gras**
□ Prix                    Prix | Rating | Dispo
  ☐ < 500€ (15)
  ☐ 500-1000€ (20)       Résultat 2
                          ──────────
                          ...
```
- Nombre de résultats affiché
- Filtres avec compteurs
- Termes de recherche surlignés
- Page "aucun résultat" = alternatives, pas cul-de-sac

## Form Patterns

### Inline Validation
```
Email: [user@example.com    ] ✓
Mot de passe: [••••••       ] ✗ Min 8 caractères
```
- Validation au blur (pas à chaque touche)
- Messages d'erreur spécifiques et actionnables
- Indicateur visuel clair (couleur + icône)

### Multi-Step Form
```
Step 1        Step 2        Step 3
[●]──────────[○]──────────[○]
 Info perso    Adresse      Paiement

Progress: 1/3
```
- Max 5 étapes
- Progression visible
- Retour arrière possible
- Sauvegarder le draft entre étapes

## Feedback Patterns

### Loading States
```
Skeleton (préféré) :     Spinner (acceptable) :
┌──────────────┐         ┌──────────────┐
│ ████████     │         │              │
│ ████████████ │         │    ⟳         │
│ ██████       │         │  Chargement  │
└──────────────┘         └──────────────┘
```
- Skeleton screens pour contenu connu
- Spinners pour durée inconnue
- Toujours un indicateur si > 1 seconde

### Toast / Notifications
```
┌─────────────────────────────┐
│ ✓ Changements sauvegardés   │  ← Auto-dismiss 3-5s
└─────────────────────────────┘

┌─────────────────────────────┐
│ ✗ Erreur de connexion   [×] │  ← Dismiss manuel
│   Réessayer                 │
└─────────────────────────────┘
```
- Succès → auto-dismiss (3-5s)
- Erreur → dismiss manuel + action corrective
- Position : top-right ou bottom-center

## Layout Patterns

### Responsive Grid
```
Desktop (3 cols)     Tablet (2 cols)     Mobile (1 col)
┌───┬───┬───┐       ┌───┬───┐           ┌───┐
│ 1 │ 2 │ 3 │       │ 1 │ 2 │           │ 1 │
├───┼───┼───┤       ├───┼───┤           ├───┤
│ 4 │ 5 │ 6 │       │ 3 │ 4 │           │ 2 │
└───┴───┴───┘       └───┴───┘           ├───┤
                                         │ 3 │
                                         └───┘
```

### Dashboard Layout
```
┌──────────────────────────────────┐
│ Header + Navigation              │
├────────┬─────────────────────────┤
│        │ KPI 1 │ KPI 2 │ KPI 3  │
│ Side   ├───────┴───────┴────────┤
│ Nav    │                        │
│        │   Chart principal      │
│        │                        │
│        ├────────────┬───────────┤
│        │ Table      │ Activity  │
│        │            │ Feed      │
└────────┴────────────┴───────────┘
```
- KPIs en haut (scan rapide)
- Graphique principal = centre
- Détails et activité en bas
