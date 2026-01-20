# Créer un Compte avec association automatique Keycloak

## Vue d'ensemble

Lorsque vous créez un **Compte** (organisation) via l'endpoint `/comptes/with-owner`, le système :

1. ✅ Récupère l'utilisateur Keycloak depuis le token JWT
2. ✅ Crée ou synchronise cet utilisateur dans PostgreSQL avec son `keycloakId`
3. ✅ Crée le compte
4. ✅ Associe automatiquement l'utilisateur au compte comme propriétaire

## Prérequis

### 1. Initialiser le rôle "owner" par défaut

Exécutez une seule fois :

```bash
node scripts/init-default-role.js
```

**Résultat :**
```
✅ Rôle "owner" créé :
{ id: 'abc-123-def-456', nom: 'owner' }

💡 ID du rôle à utiliser: abc-123-def-456

📝 Ajoutez cette valeur dans votre .env :
DEFAULT_OWNER_ROLE_ID=abc-123-def-456
```

### 2. Ajouter l'ID du rôle dans `.env`

Éditez `.env` et ajoutez :

```env
DEFAULT_OWNER_ROLE_ID=abc-123-def-456
```

**Remplacez** `abc-123-def-456` par l'ID retourné par le script.

### 3. Redémarrer l'application

```bash
npm run start:dev
```

## Utilisation

### Depuis votre frontend NextAuth

```typescript
// Dans votre composant React/Next.js
import { useSession } from 'next-auth/react';

async function createCompte() {
  const { data: session } = useSession();

  if (!session?.accessToken) {
    throw new Error('Non authentifié');
  }

  const response = await fetch('http://localhost:8000/comptes/with-owner', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.accessToken}`, // Token Keycloak
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nom: 'Mon Organisation' // Seul champ obligatoire
    })
  });

  const result = await response.json();
  console.log('Compte créé:', result);

  return result;
}
```

### Via curl (pour tester)

```bash
# 1. Obtenir un token Keycloak
TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d "client_id=nest-backend-local" \
  -d "username=VOTRE_USERNAME" \
  -d "password=VOTRE_PASSWORD" \
  -d "grant_type=password" \
  | jq -r '.access_token')

# 2. Créer le compte
curl -X POST http://localhost:8000/comptes/with-owner \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Mon Organisation"
  }'
```

## Paramètres de la requête

### Champs du body

| Champ | Type | Obligatoire | Description | Valeur par défaut |
|-------|------|-------------|-------------|-------------------|
| `nom` | string | ✅ Oui | Nom du compte | - |
| `etat` | string | ⚪ Non | État du compte | `"actif"` |
| `dateCreation` | string | ⚪ Non | Date de création ISO | Date actuelle |
| `createdByUserId` | string | ⚪ Non | ID créateur | Utilisateur Keycloak |
| `ownerRoleId` | string | ⚪ Non | Rôle du propriétaire | `DEFAULT_OWNER_ROLE_ID` |

### Exemples

**Minimal (recommandé) :**
```json
{
  "nom": "Mon Organisation"
}
```

**Complet :**
```json
{
  "nom": "Mon Organisation",
  "etat": "actif",
  "ownerRoleId": "custom-role-id"
}
```

## Réponse de l'API

```json
{
  "compte": {
    "id": "compte-uuid-xxx",
    "nom": "Mon Organisation",
    "etat": "actif",
    "dateCreation": "2025-11-24T17:00:00.000Z",
    "createdByUserId": "user-uuid-yyy"
  },
  "utilisateur": {
    "id": "user-uuid-yyy",
    "keycloakId": "keycloak-uuid-zzz",
    "email": "user@example.com",
    "nom": "Doe",
    "prenom": "John"
  }
}
```

## Logs backend

Vous verrez ces logs lors de la création :

```
[CompteController] Création de compte avec propriétaire automatique
[CompteController] Keycloak user: user@example.com (keycloak-uuid-zzz)
[AuthSyncService] Utilisateur existant trouvé: user@example.com (keycloakId: keycloak-uuid-zzz)
[CompteController] Utilisateur synchronisé: user@example.com (id: user-uuid-yyy)
[CompteController] Compte créé: Mon Organisation (id: compte-uuid-xxx)
[CompteController] Utilisateur associé au compte (membre id: membre-uuid-www)
```

**Si c'est la première connexion de cet utilisateur :**
```
[AuthSyncService] Création d'un nouvel utilisateur pour keycloakId: keycloak-uuid-zzz
[AuthSyncService] Nouvel utilisateur créé: user@example.com (id: user-uuid-yyy)
```

## Vérification en base de données

### Vérifier le compte créé

```bash
docker exec crm-postgres psql -U postgres -d postgres -c "
  SELECT id, nom, etat, \"createdByUserId\"
  FROM comptes
  ORDER BY \"createdAt\" DESC
  LIMIT 5;
"
```

### Vérifier l'association utilisateur ↔ compte

```bash
docker exec crm-postgres psql -U postgres -d postgres -c "
  SELECT
    u.email,
    u.nom || ' ' || u.prenom as utilisateur,
    c.nom as compte,
    r.nom as role,
    mc.etat
  FROM membres_comptes mc
  INNER JOIN utilisateurs u ON u.id = mc.\"utilisateurId\"
  INNER JOIN comptes c ON c.id = mc.\"compteId\"
  INNER JOIN roles r ON r.id = mc.\"roleId\"
  ORDER BY mc.\"createdAt\" DESC
  LIMIT 10;
"
```

## Scénarios

### Scénario 1 : Première connexion + création de compte

**Actions :**
1. Utilisateur se connecte pour la première fois via Keycloak
2. Appelle `/comptes/with-owner`

**Résultat :**
```
✅ Utilisateur créé dans PostgreSQL avec keycloakId
✅ Compte créé
✅ Association utilisateur ↔ compte créée
```

### Scénario 2 : Utilisateur existant crée un nouveau compte

**Actions :**
1. Utilisateur déjà existant se connecte
2. Appelle `/comptes/with-owner`

**Résultat :**
```
✅ Utilisateur existant récupéré
✅ Nouveau compte créé
✅ Association utilisateur ↔ compte créée
```

### Scénario 3 : Utilisateur crée plusieurs comptes

Un utilisateur peut être propriétaire de plusieurs comptes :

```typescript
// Compte 1
await createCompte({ nom: 'Organisation A' });

// Compte 2
await createCompte({ nom: 'Organisation B' });
```

L'utilisateur sera membre des deux comptes dans la table `membres_comptes`.

## Architecture des données

```
┌─────────────────────────────────────────────────────────────┐
│                    KEYCLOAK                                 │
│  User ID: keycloak-uuid-zzz                                 │
│  Email: user@example.com                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Token JWT (Authorization: Bearer)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              POSTGRESQL (votre BDD)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  utilisateurs                                               │
│  ├── id: user-uuid-yyy                                      │
│  ├── keycloakId: keycloak-uuid-zzz ← Lien avec Keycloak    │
│  ├── email: user@example.com                                │
│  └── ...                                                    │
│                                                             │
│  membres_comptes (association)                              │
│  ├── utilisateurId: user-uuid-yyy                           │
│  ├── compteId: compte-uuid-xxx                              │
│  ├── roleId: role-uuid-owner                                │
│  └── etat: "actif"                                          │
│                                                             │
│  comptes (organisations)                                    │
│  ├── id: compte-uuid-xxx                                    │
│  ├── nom: "Mon Organisation"                                │
│  └── ...                                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Sécurité

### Authentification requise

Cet endpoint **nécessite** un token Keycloak valide :
- Les guards `AuthGuard` et `RoleGuard` sont activés
- Sans token → `401 Unauthorized`
- Token invalide → `401 Unauthorized`

### Pas de `@Roles()` sur cet endpoint

Tout utilisateur authentifié peut créer un compte. Si vous voulez restreindre, ajoutez :

```typescript
@Roles({ roles: ['realm:admin', 'realm:manager'] })
@Post('with-owner')
```

### Isolation des données

Chaque compte est isolé. L'utilisateur créateur sera automatiquement membre avec le rôle "owner".

## Dépannage

### Erreur : "DEFAULT_OWNER_ROLE_ID non défini"

```json
{
  "statusCode": 500,
  "message": "DEFAULT_OWNER_ROLE_ID non défini dans .env. Exécutez: node scripts/init-default-role.js"
}
```

**Solution :**
1. Exécutez `node scripts/init-default-role.js`
2. Ajoutez l'ID retourné dans `.env`
3. Redémarrez l'application

### Erreur : "Utilisateur Keycloak non trouvé dans le token"

```json
{
  "statusCode": 500,
  "message": "Utilisateur Keycloak non trouvé dans le token"
}
```

**Solution :**
Vérifiez que :
- Le token est valide
- Le token contient un champ `sub` (user ID Keycloak)
- `ENABLE_SECURITY=true` dans `.env`

### Erreur : 401 Unauthorized

**Solution :**
- Vérifiez que le token est bien envoyé : `Authorization: Bearer <token>`
- Vérifiez que Keycloak est accessible : http://localhost:8080
- Vérifiez que le client Keycloak `nest-backend-local` existe

### L'utilisateur n'est pas créé

Vérifiez les logs backend. Si vous ne voyez pas :
```
[AuthSyncService] Création d'un nouvel utilisateur...
```

C'est que :
- Le `KeycloakSyncGuard` ne s'exécute pas → vérifiez `ENABLE_SECURITY=true`
- L'utilisateur existe déjà → vérifiez dans la BDD

## Endpoints disponibles

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/comptes/with-owner` | Crée compte + associe utilisateur Keycloak | ✅ Oui |
| POST | `/comptes` | Crée compte (sans association auto) | ✅ Oui (admin) |
| GET | `/comptes` | Liste tous les comptes | ✅ Oui (manager/admin) |
| GET | `/comptes/:id` | Récupère un compte | ✅ Oui (manager/admin) |
| PUT | `/comptes/:id` | Met à jour un compte | ✅ Oui (admin) |
| DELETE | `/comptes/:id` | Supprime un compte | ✅ Oui (admin) |

## Prochaines étapes

Une fois le compte créé avec son propriétaire :

1. **Créer des groupes** dans le compte
2. **Inviter d'autres utilisateurs** via `POST /membres-comptes`
3. **Associer des clients** au compte
4. **Gérer les permissions** via les rôles

Consultez les autres endpoints dans la documentation Swagger : http://localhost:8000/docs
