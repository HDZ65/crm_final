# UX Engineering Checklist

Checklist opérationnelle pour valider l'architecture de l'information et l'UX d'une interface.

## 1. Structure & Navigation

- [ ] Hiérarchie de navigation ≤ 3 niveaux de profondeur
- [ ] Fil d'Ariane (breadcrumb) sur toutes les pages internes
- [ ] Navigation globale visible et cohérente sur toutes les pages
- [ ] Labels de navigation spécifiques (pas de "Produits" générique)
- [ ] Navigation mobile adaptée (bottom nav ≤ 5 items, pas de hamburger pour nav primaire)
- [ ] Lien vers Home depuis le logo

## 2. Charge Cognitive

- [ ] ≤ 7±2 options par niveau de navigation (Loi de Hick)
- [ ] Progressive disclosure : info essentielle d'abord, détails à la demande
- [ ] Pas de jargon interne dans les labels
- [ ] Whitespace suffisant entre les sections (Gestalt : Proximité)
- [ ] Éléments de même fonction visuellement similaires (Gestalt : Similarité)

## 3. Recherche & Findability

- [ ] Barre de recherche accessible sur toutes les pages
- [ ] Autocomplete / suggestions de recherche
- [ ] Page "aucun résultat" avec alternatives (pas de cul-de-sac)
- [ ] Résultats triés par pertinence (pas alphabétique par défaut)
- [ ] Filtres par facettes si catalogue > 20 items

## 4. Labeling & Contenu

- [ ] Labels cohérents (même terme = même concept partout)
- [ ] Langage orienté action ("Voir les détails", pas "Informations")
- [ ] Micro-descriptions sous les liens de navigation complexes
- [ ] Titres de page descriptifs et uniques

## 5. Modèles Mentaux & Conventions

- [ ] Respecte la Loi de Jakob (conventions standard du domaine)
- [ ] Boutons d'action positionnés selon les conventions (CTA à droite/en haut)
- [ ] Iconographie standard et cohérente
- [ ] Feedback immédiat sur les actions utilisateur

## 6. Responsive & Mobile

- [ ] Content choreography : ordre des éléments adapté au device
- [ ] Zone du pouce respectée sur mobile
- [ ] Touch targets ≥ 44px
- [ ] Pas de hover-only interactions sur mobile

## 7. Accessibilité

- [ ] Contraste suffisant (WCAG AA minimum)
- [ ] Navigation au clavier fonctionnelle
- [ ] Attributs ARIA sur les éléments interactifs
- [ ] Focus visible
- [ ] Textes alternatifs sur les images significatives

## 8. Métriques à Monitorer

| Métrique | Seuil | Comment mesurer |
|----------|-------|-----------------|
| Task success rate | > 80% | User testing, analytics |
| Error rate (retours arrière) | < 10% | Analytics, tree testing |
| Search exit rate | < 40% | Analytics search |
| Findability score | > 70% | Tree testing |
| Lostness score | < 2.0 | Pages visitées / pages minimales |
