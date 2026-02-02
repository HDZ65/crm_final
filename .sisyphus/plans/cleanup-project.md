# Plan de Nettoyage - Projet CRM

## Objectif
Nettoyer le projet crm_final pour qu'il soit aussi propre que winaity-clean.

## Problèmes Identifiés

### 1. Fichiers node_modules trackés (3,410 fichiers)
- **Localisation**: `services/service-retry/node_modules/`
- **Statut**: Déjà staged pour suppression (git rm --cached effectué)
- **Action**: Commiter la suppression

### 2. Répertoires obsolètes trackés
- `docker/Dockerfile.template` - Staged pour suppression
- `proto/Dockerfile` - Staged pour suppression  
- `proto/docker-entrypoint.sh` - Staged pour suppression
- `proto/package-lock.json` - Staged pour suppression

### 3. Répertoires obsolètes non-trackés (root-owned)
- `backend/` - Existe localement, root-owned, ne doit pas être commité
- `generated/` - Existe localement, root-owned, ne doit pas être commité

### 4. .gitignore incomplet
Manque les entrées pour:
- `backend/` (répertoire obsolète)
- `proto/node_modules/` (si jamais recréé)

## Tâches à Exécuter

### Tâche 1: Mettre à jour .gitignore
**Fichier**: `.gitignore`
**Action**: Ajouter à la fin:
```
# ============================================
# OBSOLETE DIRECTORIES (DO NOT USE)
# ============================================
backend/
```

### Tâche 2: Commiter le nettoyage
**Commande**:
```bash
git add -A
git commit -m "chore: remove accidentally tracked node_modules and obsolete directories

- Remove 3,410 node_modules files from service-retry (accidentally committed)
- Remove obsolete docker/Dockerfile.template
- Remove obsolete proto/Dockerfile and docker-entrypoint.sh
- Remove proto/package-lock.json
- Update .gitignore to prevent future issues with backend/ directory"
```

### Tâche 3: Nettoyer les répertoires locaux root-owned (optionnel)
**Note**: Ces répertoires ne sont pas trackés par git mais existent localement.
Si l'utilisateur veut les supprimer complètement:
```bash
sudo rm -rf backend/ generated/
```

## Vérification Post-Cleanup

```bash
# Vérifier qu'aucun node_modules n'est tracké
git ls-files | grep node_modules | wc -l
# Résultat attendu: 0

# Vérifier le statut
git status
# Résultat attendu: working tree clean (ou seulement backend/ et generated/ en untracked)

# Vérifier le dernier commit
git log -1 --stat
# Devrait montrer ~3,400+ suppressions
```

## Comparaison avec winaity-clean

| Aspect | winaity-clean | crm_final (après cleanup) |
|--------|---------------|---------------------------|
| node_modules trackés | 0 | 0 |
| Fichiers build trackés | 0 | 0 |
| .gitignore complet | Oui | Oui |
| Structure clean | Oui | Oui |

## Notes
- Les fichiers sont déjà staged pour suppression ("D" dans git status)
- Il ne reste plus qu'à mettre à jour .gitignore et commiter
- Les répertoires backend/ et generated/ sont root-owned donc nécessitent sudo pour suppression locale
