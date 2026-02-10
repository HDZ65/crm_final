# Cours Complet : Architecture de l'Information (AI)

**Niveau** : Avancé / Ingénierie
**Objectif** : Structurer l'information pour minimiser la charge cognitive et maximiser l'utilisabilité.

## Introduction : La Science de l'Organisation

L'Architecture de l'Information (AI) est la discipline qui consiste à organiser, structurer et étiqueter le contenu de manière efficace et durable. En termes d'ingénierie, c'est la conception de la base de données mentale de l'utilisateur.

> L'axiome fondamental : "Si l'utilisateur ne trouve pas le produit, l'utilisateur ne peut pas acheter le produit."

---

## Module 1 : Psychologie Cognitive & Modèles Mentaux

Avant de toucher à la structure, il faut comprendre le processeur (le cerveau humain).

### 1.1 La Charge Cognitive

Le cerveau dispose d'une "mémoire de travail" limitée (RAM). Chaque élément inutile sur une interface consomme des ressources.

- **Charge intrinsèque** : L'effort nécessaire pour comprendre le but de la page.
- **Charge extrinsèque** : L'effort inutile causé par une mauvaise conception (navigation confuse, jargon).

**Loi de Hick** : Le temps de décision augmente logarithmiquement avec le nombre d'options :

```
T = b × log₂(n + 1)
```

### 1.2 Les Modèles Mentaux

Les utilisateurs arrivent avec une idée préconçue de comment votre système devrait fonctionner, basée sur leur expérience passée (**Loi de Jakob**).

- **Risque** : Innover sur la structure de navigation crée de la friction.
- **Solution** : Respecter les standards (Logo à gauche, panier à droite, recherche en haut). L'innovation doit se faire sur le contenu, pas sur le contenant.

### 1.3 Les Lois de la Gestalt (Perception Visuelle)

Le cerveau ne voit pas des éléments isolés, il perçoit des ensembles organisés. Ignorer ces lois crée une dissonance cognitive.

| Loi | Principe | Application |
|-----|----------|-------------|
| **Proximité** | Éléments proches = groupe perçu | L'espacement entre sections > espacement entre éléments internes |
| **Similarité** | Éléments visuellement similaires = même fonction | Tous les boutons d'action ont le même style |
| **Continuité** | L'œil suit les lignes et courbes | Aligner les éléments sur une grille |
| **Fermeture** | Le cerveau complète les formes incomplètes | On peut suggérer un conteneur sans bordure complète |
| **Figure/Fond** | L'œil sépare premier plan et arrière-plan | Contraste suffisant entre contenu et background |

---

## Module 2 : Systèmes de Classification

### 2.1 Taxonomie (Classification Hiérarchique)

Organisation en arbre parent-enfant. C'est le modèle dominant du web.

**Règles d'ingénierie** :
- **Exclusivité mutuelle** : Un élément ne doit appartenir qu'à une seule catégorie (sinon → frustration)
- **Couverture exhaustive** : Toutes les catégories ensemble doivent couvrir 100% du contenu
- **Profondeur optimale** : Maximum 3-4 niveaux. Au-delà, utiliser la recherche ou le filtrage

### 2.2 Folksonomy (Classification Sociale)

Tags libres créés par les utilisateurs (ex: hashtags). Flexible mais chaotique.

- **Avantage** : Couvre le vocabulaire réel des utilisateurs
- **Risque** : Synonymes, fautes, ambiguïtés
- **Solution hybride** : Tags contrôlés (suggestions auto) + tags libres

### 2.3 Faceted Classification

Le système le plus puissant pour le e-commerce. Chaque produit a N facettes indépendantes (couleur, taille, prix, marque).

**Règles** :
- Une facette = un axe de décision utilisateur
- Afficher le nombre de résultats par valeur de facette
- Permettre la multi-sélection au sein d'une facette

---

## Module 3 : Navigation & Wayfinding

### 3.1 Types de Navigation

| Type | Rôle | Exemple |
|------|------|---------|
| **Globale** | Toujours visible, orientation principale | Header/navbar |
| **Locale** | Navigation dans une section | Sidebar de catégorie |
| **Contextuelle** | Liens vers contenus liés | "Produits similaires", "Voir aussi" |
| **Fil d'Ariane** | Position dans la hiérarchie | Home > Catégorie > Sous-catégorie |
| **Utilitaire** | Actions fréquentes hors navigation | Recherche, panier, compte |

### 3.2 Le Concept de "Scent of Information"

L'utilisateur suit une "piste olfactive". Chaque lien/bouton doit sentir la bonne direction.

**Signaux forts** :
- Labels clairs et descriptifs (pas "Solutions", mais "Nos Logiciels CRM")
- Micro-descriptions sous les liens
- Icônes cohérentes

**Signaux faibles** (à éviter) :
- Labels génériques : "Produits", "Services", "Ressources"
- Jargon interne
- Icônes ambiguës

### 3.3 La Règle des 3 Clics (Mythe Démonté)

La vraie métrique n'est pas le nombre de clics, mais la **confiance à chaque clic**. Un parcours de 5 clics confiants bat un parcours de 2 clics hésitants.

---

## Module 4 : Labeling & Langage

### 4.1 Principes de Labeling

| Règle | Mauvais | Bon |
|-------|---------|-----|
| Parler utilisateur | "Processus d'onboarding" | "Commencer" |
| Spécifique | "Produits" | "Chaussures de running" |
| Cohérent | Mélange "Mon compte" / "Profile" / "Settings" | Un seul terme partout |
| Actionnable | "Informations" | "Voir les détails" |

### 4.2 Card Sorting

Méthode pour valider la structure avec de vrais utilisateurs.

- **Card sorting ouvert** : L'utilisateur crée les catégories → découvre les modèles mentaux
- **Card sorting fermé** : L'utilisateur place des items dans des catégories prédéfinies → valide la structure
- **Outils** : Optimal Workshop, Maze, ou simplement des post-its

---

## Module 5 : Recherche & Findability

### 5.1 Search UI Patterns

| Pattern | Utilité |
|---------|---------|
| **Autocomplete** | Guide l'utilisateur, corrige les typos |
| **Faceted search** | Affine par attributs |
| **Search-as-you-type** | Résultats instantanés |
| **Did you mean?** | Gestion d'erreurs de frappe |
| **Recent searches** | Accélère les recherches répétitives |
| **No results page** | Proposer des alternatives, pas un cul-de-sac |

### 5.2 Relevance Ranking

Le tri des résultats est aussi important que la recherche elle-même.

**Facteurs de ranking** :
1. Pertinence textuelle (TF-IDF, BM25)
2. Popularité (ventes, clics)
3. Fraîcheur (produits récents)
4. Personnalisation (historique utilisateur)
5. Business rules (marge, stock, promotions)

---

## Module 6 : Responsive Information Architecture

### 6.1 Mobile-First IA

Le mobile force la priorisation. Ce qui ne tient pas sur mobile n'est probablement pas essentiel.

**Patterns clés** :
- **Progressive disclosure** : Montrer l'essentiel, révéler le reste à la demande
- **Priority+** : Montrer les items prioritaires, cacher le reste dans "Plus"
- **Bottom navigation** : Max 5 items, zone du pouce
- **Hamburger menu** : Acceptable pour navigation secondaire, jamais pour navigation primaire

### 6.2 Content Choreography

L'ordre des éléments change selon le device. Sur desktop : sidebar à gauche. Sur mobile : le contenu principal monte, la sidebar descend.

---

## Module 7 : Méthodologie de Conception IA

### 7.1 Process Complet

1. **Audit de contenu** : Inventorier tout le contenu existant
2. **Analyse des utilisateurs** : Personas, parcours, pain points
3. **Card sorting** : Valider la structure avec les utilisateurs
4. **Sitemap / Flowchart** : Dessiner l'architecture
5. **Wireframes** : Tester la navigation
6. **Tree testing** : Valider que les utilisateurs trouvent les contenus
7. **Itérer** : Ajuster selon les résultats

### 7.2 Tree Testing

Tester la structure sans aucun design visuel. L'utilisateur navigue dans un arbre textuel pour trouver un item.

**Métriques** :
- **Success rate** : % d'utilisateurs trouvant la bonne réponse
- **Directness** : % trouvant sans revenir en arrière
- **Time** : Temps moyen pour trouver

---

## Module 8 : Métriques & KPIs

| Métrique | Mesure | Seuil acceptable |
|----------|--------|------------------|
| **Task success rate** | % de tâches réussies | > 80% |
| **Time on task** | Temps pour accomplir une tâche | Selon complexité |
| **Error rate** | % de mauvais clics / retours arrière | < 10% |
| **Search exit rate** | % de recherches sans clic | < 40% |
| **Findability score** | Combiné tree test + analytics | > 70% |
| **Lostness score** | Ratio pages visitées / pages minimales | < 2.0 |

---

## Principes Fondamentaux (Résumé)

1. **L'utilisateur ne lit pas, il scanne** → Hiérarchie visuelle claire
2. **Le cerveau a une RAM limitée** → Réduire la charge cognitive (Loi de Hick)
3. **Les utilisateurs ont des modèles mentaux** → Respecter les conventions (Loi de Jakob)
4. **La navigation = wayfinding** → Fil d'Ariane, labels clairs, scent of information
5. **La recherche = filet de sécurité** → Toujours accessible, toujours performante
6. **Mobile force la priorisation** → Progressive disclosure, priority+
7. **Tester avec de vrais utilisateurs** → Card sorting, tree testing, analytics
8. **Mesurer pour améliorer** → KPIs objectifs, pas d'opinions
