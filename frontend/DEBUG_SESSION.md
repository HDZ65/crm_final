# Guide de Debug des Sessions

## Vue d'ensemble

Le frontend Next.js dispose maintenant d'un panneau de debug intégré pour surveiller les sessions conversationnelles en temps réel.

## Comment accéder au panneau de debug

1. **Ouvrir l'assistant IA** dans votre application
2. **Cliquer sur l'icône ℹ️** (Info) en haut à droite
3. Le panneau de debug s'affiche avec toutes les informations de session

## Informations affichées

### 📊 Panneau de Debug (UI)

| Champ | Description | Exemple |
|-------|-------------|---------|
| **Session ID** | Identifiant unique de la conversation | `550e8400...0000` |
| **Messages utilisateur** | Nombre de messages envoyés par l'utilisateur | `3` |
| **Messages totaux** | Nombre total de messages (user + assistant) | `7` |
| **Durée session** | Temps écoulé depuis le début de la session | `2m 34s` |
| **Status** | État actuel (En cours / Prêt) | `Prêt` |

### 📋 Bouton "Copier le session ID"

Permet de copier l'UUID complet pour :
- Vérifier les logs backend
- Débugger une session spécifique
- Rechercher dans les logs LangChain

## Console du navigateur

Ouvrez les DevTools (F12) pour voir les logs détaillés :

### Logs automatiques

```javascript
🔵 [Session] Sending message to session: 550e8400-e29b-41d4-a716-446655440000
📤 [Request] http://localhost:8000/ai/generate?q=Bonjour&session_id=550e8400-...
✅ [Session] Message completed for session: 550e8400-e29b-41d4-a716-446655440000
```

### Nouvelle session

```javascript
🆕 [Session] Creating new session: 7c9e6679-7425-40de-944b-e07fc1f90ae7
```

## Vérification du flux de données

### 1. Frontend → Backend

Ouvrez **Network tab** dans DevTools :

```
Name: generate
Status: 200 (streaming)
Type: eventsource
URL: http://localhost:8000/ai/generate?q=Bonjour&session_id=550e8400-...
```

**Vérifiez** :
- ✅ Le paramètre `session_id` est présent dans l'URL
- ✅ Le même `session_id` est utilisé pour tous les messages de la conversation
- ✅ Un nouveau `session_id` est généré quand vous cliquez sur "Nouvelle conversation"

### 2. Backend → LangChain gRPC

Vérifiez les logs du backend NestJS :

```bash
cd backend-master
npm run start:dev

# Vous devriez voir :
[INFO] Received SSE request with session_id: 550e8400-...
[DEBUG] Calling gRPC with params: { system_prompt: "...", session_id: "550e8400-..." }
```

### 3. LangChain SessionService

Vérifiez les logs du service gRPC :

```bash
cd langChain
python start_grpc.py

# Vous devriez voir :
INFO | SessionService | Created new session: 550e8400-e29b-41d4-a716-446655440000
INFO | SessionService | Added to history for session 550e8400-.... Total turns: 1
INFO | SessionService | Added to history for session 550e8400-.... Total turns: 2
```

## Tests de validation

### Test 1 : Mémoire conversationnelle

1. Envoyez : "Quelle est la météo ?"
2. Attendez la réponse
3. Envoyez : "Et demain ?"
4. **Vérification** : L'IA doit comprendre que "demain" fait référence à la météo

**Console attendue** :
```
🔵 [Session] Sending message to session: abc123...
✅ [Session] Message completed for session: abc123...
🔵 [Session] Sending message to session: abc123... (même ID !)
✅ [Session] Message completed for session: abc123...
```

### Test 2 : Nouvelle conversation

1. Cliquez sur "🔄 Nouvelle conversation"
2. **Vérification** : Le panneau de debug doit afficher un nouveau Session ID
3. Envoyez un message
4. **Vérification** : L'IA ne doit pas avoir de contexte des messages précédents

**Console attendue** :
```
🆕 [Session] Creating new session: xyz789...
🔵 [Session] Sending message to session: xyz789... (nouveau ID !)
```

### Test 3 : Persistance de session

1. Envoyez plusieurs messages
2. **Ne fermez pas** la fenêtre de l'assistant
3. Attendez 1-2 minutes
4. Envoyez un nouveau message
5. **Vérification** : Le Session ID doit rester le même

**Console attendue** :
```
🔵 [Session] Sending message to session: abc123... (même ID après 2 min)
```

## Problèmes courants

### ❌ Problème : Session ID ne change jamais

**Symptômes** :
- Même Session ID même après avoir cliqué sur "Nouvelle conversation"

**Causes possibles** :
- Le store Zustand n'est pas correctement mis à jour
- Le composant ne réagit pas au changement d'état

**Solution** :
```typescript
// Vérifier que le store utilise bien createNewSession
const createNewSession = useAiAssistantStore((state) => state.createNewSession)
```

### ❌ Problème : Session ID non envoyé au backend

**Symptômes** :
- Network tab ne montre pas le paramètre `session_id`
- Backend ne reçoit pas le session_id

**Vérification** :
```javascript
// Dans ai-assistant-store.ts, ligne 73
const url = `http://localhost:8000/ai/generate?q=${encodeURIComponent(trimmed)}&session_id=${sessionId}`
```

**Test manuel** :
```bash
curl "http://localhost:8000/ai/generate?q=test&session_id=test123"
```

### ❌ Problème : Pas de mémoire conversationnelle

**Symptômes** :
- L'IA ne se souvient pas du contexte
- Chaque message est traité indépendamment

**Checklist de debug** :
1. ✅ Vérifier que `session_id` est dans l'URL (Network tab)
2. ✅ Vérifier les logs backend NestJS
3. ✅ Vérifier les logs LangChain gRPC
4. ✅ Vérifier que SessionService reçoit bien le session_id

**Logs à chercher** :
```python
# Dans langChain/app.log ou console
INFO | SessionService | Created new session: <ID>
INFO | SessionService | Added to history for session <ID>. Total turns: N
```

Si vous ne voyez pas ces logs, le `session_id` n'arrive pas jusqu'au service LangChain.

## Commandes utiles

### Voir les logs en temps réel

```bash
# Backend NestJS
cd backend-master
npm run start:dev

# Service LangChain
cd langChain
python start_grpc.py

# Logs LangChain (si configuré)
tail -f langChain/app.log
```

### Tester manuellement l'endpoint

```bash
# Test simple
curl "http://localhost:8000/ai/generate?q=Bonjour&session_id=test123"

# Test avec system_prompt
curl "http://localhost:8000/ai/generate?q=Bonjour&session_id=test123&system_prompt=Tu%20es%20un%20robot"
```

### Inspecter le store Zustand dans la console

```javascript
// Ouvrir la console du navigateur
console.log(useAiAssistantStore.getState())
// Affiche : { messages: [...], isLoading: false, sessionId: "...", ... }
```

## Architecture de debug complète

```
┌─────────────────────────────────────────────┐
│  Frontend (Next.js)                         │
│  ┌────────────────────────────────────┐    │
│  │ 1. ai-assistant-dialog.tsx         │    │
│  │    - Panneau debug UI              │    │
│  │    - Bouton "Nouvelle conversation"│    │
│  └────────────────────────────────────┘    │
│  ┌────────────────────────────────────┐    │
│  │ 2. ai-assistant-store.ts           │    │
│  │    - sessionId: generateUUID()     │    │
│  │    - console.log(...) pour debug   │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
              ↓ HTTP/SSE
              ↓ ?session_id=...
┌─────────────────────────────────────────────┐
│  Backend (NestJS)                           │
│  ┌────────────────────────────────────┐    │
│  │ 3. ai.controller.ts                │    │
│  │    @Query('session_id')            │    │
│  └────────────────────────────────────┘    │
│  ┌────────────────────────────────────┐    │
│  │ 4. llm.client.ts                   │    │
│  │    req.params.session_id           │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
              ↓ gRPC
              ↓ params: { session_id: "..." }
┌─────────────────────────────────────────────┐
│  LangChain (Python gRPC)                    │
│  ┌────────────────────────────────────┐    │
│  │ 5. server.py                       │    │
│  │    params.get("session_id")        │    │
│  └────────────────────────────────────┘    │
│  ┌────────────────────────────────────┐    │
│  │ 6. session_service.py              │    │
│  │    - get_history(session_id)       │    │
│  │    - add_to_history(session_id...) │    │
│  │    ⚠️  Logs à surveiller ici !     │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Prochaines améliorations (optionnel)

- [ ] Ajouter un graphique de timeline des messages
- [ ] Afficher l'historique complet de la session
- [ ] Export de session en JSON
- [ ] Restauration de session depuis un ID
- [ ] Connexion à Redis pour persistance

## Support

Si vous rencontrez des problèmes :
1. Vérifiez le panneau de debug dans l'UI
2. Consultez la console du navigateur (F12)
3. Vérifiez les logs backend NestJS
4. Vérifiez les logs LangChain gRPC
5. Utilisez les tests de validation ci-dessus
