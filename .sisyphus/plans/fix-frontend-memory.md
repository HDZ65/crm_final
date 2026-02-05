# Plan: Résoudre le problème de mémoire du frontend

## Contexte
- **Problème**: Frontend charge à l'infini
- **Erreur**: ENOMEM (Out of memory) dans le conteneur Next.js
- **Cause**: Turbopack consomme trop de mémoire, pas de limite configurée
- **Impact**: Utilisateur ne peut pas accéder au frontend

## Objectif
Configurer correctement les limites mémoire du conteneur frontend pour qu'il démarre sans erreur.

## Tâches

- [ ] Ajouter des limites mémoire au conteneur frontend (parallelizable: false)
- [ ] Redémarrer le conteneur frontend avec la nouvelle configuration (parallelizable: false)
- [ ] Vérifier que le frontend démarre correctement (parallelizable: false)
- [ ] Tester l'accès à http://localhost:3000 (parallelizable: false)
- [ ] Documenter la solution dans le notepad (parallelizable: false)

## Notes
- Next.js 16 avec Turbopack est gourmand en mémoire
- Recommandation: 2-4 GB pour le conteneur frontend
- Alternative: Désactiver Turbopack si nécessaire
