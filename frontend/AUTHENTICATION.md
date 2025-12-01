# Guide d'Authentification Keycloak

## Configuration Effectuée

### 1. Variables d'Environnement
Créez un fichier `.env.local` à la racine du projet frontend avec :

```env
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=demo
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=next-frontend-local
```

### 2. Composants Créés

#### KeycloakProvider (`src/providers/KeycloakProvider.tsx`)
- Wrapper qui initialise Keycloak et gère l'authentification
- Refresh automatique du token toutes les 10 secondes
- Utilise `onLoad: 'login-required'` pour forcer la connexion

#### Hook useAuth (`src/hooks/useAuth.ts`)
- Hook personnalisé pour accéder à l'authentification
- Fonctions : login, logout, register
- Accès au profil utilisateur et vérification des rôles
- Exemple d'utilisation :
```tsx
const { isAuthenticated, login, logout, profile, hasRole } = useAuth();
```

#### API Wrapper (`src/lib/api.ts`)
- Client API avec authentification automatique
- Ajoute le header `Authorization: Bearer {token}` à chaque requête
- Refresh automatique du token avant expiration
- Exemple d'utilisation :
```tsx
import { api } from '@/lib/api';

// GET
const data = await api.get('/clients');

// POST
const result = await api.post('/clients', { name: 'Client' });
```

#### ProtectedRoute (`src/components/ProtectedRoute.tsx`)
- Composant pour protéger les pages
- Vérification de l'authentification et des rôles
- Exemple d'utilisation :
```tsx
<ProtectedRoute roles={['admin', 'manager']}>
  <AdminPage />
</ProtectedRoute>
```

### 3. Configuration Keycloak Requise

#### Realm
- Créez un realm appelé `demo` (ou modifiez dans .env.local)

#### Client
- Créez un client public nommé `next-frontend-local`
- Configuration :
  - Client Protocol: `openid-connect`
  - Access Type: `public`
  - Standard Flow Enabled: `ON`
  - Direct Access Grants Enabled: `ON`
  - Valid Redirect URIs: `http://localhost:3000/*`
  - Web Origins: `http://localhost:3000`

#### Utilisateurs et Rôles
- Créez des rôles dans le realm (ex: admin, manager, user)
- Créez des utilisateurs et assignez-leur des rôles

### 4. Utilisation dans les Composants

#### Page protégée simple
```tsx
"use client";

import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { profile, logout } = useAuth();

  return (
    <div>
      <h1>Bienvenue {profile?.fullName}</h1>
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}
```

#### Page avec vérification de rôle
```tsx
"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute roles={['admin']}>
      <div>
        <h1>Administration</h1>
        {/* Contenu admin */}
      </div>
    </ProtectedRoute>
  );
}
```

#### Appel API authentifié
```tsx
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    async function loadClients() {
      try {
        const data = await api.get('/clients');
        setClients(data);
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
      }
    }
    loadClients();
  }, []);

  return (
    // Affichage des clients
  );
}
```

### 5. Flux d'Authentification

1. **Initialisation** : Au chargement de l'app, KeycloakProvider initialise Keycloak
2. **Redirection** : Si non authentifié, redirection automatique vers Keycloak
3. **Connexion** : L'utilisateur se connecte sur la page Keycloak
4. **Callback** : Après connexion, retour à l'app avec le token
5. **Token** : Le token est stocké et utilisé pour les appels API
6. **Refresh** : Le token est rafraîchi automatiquement avant expiration
7. **Déconnexion** : Appel à `logout()` déconnecte de Keycloak et l'app

### 6. Démarrage

1. Assurez-vous que Keycloak est démarré sur `http://localhost:8080`
2. Configurez le realm et le client comme décrit ci-dessus
3. Démarrez le backend NestJS : `npm run start:dev`
4. Démarrez le frontend Next.js : `npm run dev`
5. Accédez à `http://localhost:3000`
6. Vous serez automatiquement redirigé vers Keycloak pour vous connecter

### 7. Dépannage

#### L'authentification ne fonctionne pas
- Vérifiez que Keycloak est accessible à `http://localhost:8080`
- Vérifiez les variables d'environnement dans `.env.local`
- Vérifiez la configuration du client dans Keycloak
- Regardez la console du navigateur pour les erreurs

#### Token expiré
- Le refresh automatique devrait gérer cela
- Si persistant, augmentez la durée de vie du token dans Keycloak

#### CORS errors
- Vérifiez les Web Origins dans la configuration du client Keycloak
- Assurez-vous que le backend accepte les requêtes du frontend

### 8. Prochaines Étapes

- [ ] Ajouter la gestion des permissions granulaires
- [ ] Implémenter le SSO (Single Sign-On) multi-applications
- [ ] Ajouter la gestion des sessions côté serveur
- [ ] Implémenter la déconnexion globale
- [ ] Ajouter le support des rôles composites