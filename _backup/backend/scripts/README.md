# Scripts de gestion des utilisateurs

Ces scripts permettent de créer manuellement des utilisateurs et de les associer à des comptes (organisations).

## Prérequis

1. PostgreSQL doit être en cours d'exécution (port 5433)
2. Node.js doit être installé
3. Le package `pg` doit être installé : `npm install pg`

## Scripts disponibles

### 1. `setup-user-with-compte.js` (Recommandé - Tout-en-un)

Crée un utilisateur ET un compte, puis les associe automatiquement.

**Usage :**

```bash
# 1. Récupérez le keycloakId depuis Keycloak Admin Console
#    http://localhost:8080/admin/master/console/#/master/users
#    Cliquez sur votre utilisateur, l'URL contient l'ID

# 2. Éditez le script et modifiez les valeurs
code scripts/setup-user-with-compte.js

# 3. Exécutez
node scripts/setup-user-with-compte.js
```

**Configuration dans le script :**

```javascript
const userData = {
  keycloakId: 'abc-123-def-456',        // ← Votre keycloakId
  nom: 'Doe',
  prenom: 'John',
  email: 'john.doe@example.com',
  telephone: '+33612345678',
  actif: true,
};

const compteName = 'Mon Organisation';
```

### 2. `create-user-manually.js`

Crée uniquement un utilisateur dans la base de données.

**Usage :**

```bash
# 1. Éditez le script
code scripts/create-user-manually.js

# 2. Exécutez
node scripts/create-user-manually.js
```

### 3. `create-compte-and-associate.js`

Crée un compte et associe un utilisateur existant.

**Usage :**

```bash
# 1. Créez d'abord l'utilisateur avec create-user-manually.js

# 2. Éditez le script
code scripts/create-compte-and-associate.js

# 3. Modifiez l'email et le nom du compte
const userEmail = 'john.doe@example.com';
const compteName = 'Mon Organisation';

# 4. Exécutez
node scripts/create-compte-and-associate.js
```

## Comment récupérer le keycloakId ?

### Méthode 1 : Via Keycloak Admin Console (le plus simple)

1. Ouvrez : http://localhost:8080/admin/master/console/#/master/users
2. Cliquez sur votre utilisateur
3. L'URL contient l'ID : `.../users/ABC-123-DEF-456/settings`
4. Copiez `ABC-123-DEF-456` (c'est le keycloakId)

### Méthode 2 : Via SQL (si même base de données)

Si Keycloak et votre app utilisent la même base PostgreSQL :

```bash
docker exec crm-postgres psql -U postgres -d postgres -c "SELECT id, email, username FROM user_entity WHERE email = 'user@example.com';"
```

### Méthode 3 : Via Keycloak Admin API

```bash
# 1. Obtenir un token admin
curl -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password"

# 2. Récupérer les utilisateurs
curl http://localhost:8080/admin/realms/master/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Vérification

### Vérifier qu'un utilisateur existe

```bash
docker exec crm-postgres psql -U postgres -d postgres -c "SELECT id, \"keycloakId\", email, nom, prenom FROM utilisateurs;"
```

### Vérifier les associations utilisateur ↔ compte

```bash
docker exec crm-postgres psql -U postgres -d postgres -c "
  SELECT
    u.email,
    u.nom || ' ' || u.prenom as nom_complet,
    c.nom as compte_nom
  FROM utilisateurs u
  INNER JOIN membres_comptes mc ON mc.\"utilisateurId\" = u.id
  INNER JOIN comptes c ON c.id = mc.\"compteId\";
"
```

## Structure des données

### Architecture multi-tenant

```
Compte (organisation)
  ↓
MembreCompte (association)
  ↓
Utilisateur (lié à Keycloak)
  ↓
keycloakId (UUID Keycloak)
```

### Tables impliquées

- **`utilisateurs`** : Utilisateurs du CRM (avec keycloakId)
- **`comptes`** : Organisations/Tenants
- **`membres_comptes`** : Association utilisateur ↔ compte
- **`groupes`** : Groupes au sein d'un compte
- **`membres_groupes`** : Association utilisateur ↔ groupe

## Flux complet

### 1. Création manuelle (avant connexion)

```bash
node scripts/setup-user-with-compte.js
```

Crée :
- ✅ Utilisateur dans PostgreSQL avec keycloakId
- ✅ Compte (organisation)
- ✅ Association utilisateur ↔ compte

### 2. Première connexion (automatique)

Lorsque l'utilisateur se connecte via Keycloak :
- Le backend vérifie si l'utilisateur existe par keycloakId
- **Si oui** : Utilise l'utilisateur existant (celui créé manuellement)
- **Si non** : Crée un nouvel utilisateur (synchronisation automatique)

### 3. Utilisation dans l'application

L'utilisateur est maintenant :
- ✅ Authentifié via Keycloak
- ✅ Enregistré dans PostgreSQL
- ✅ Associé à un compte
- ✅ Prêt à utiliser l'application

## Exemple complet

```bash
# 1. Récupérer le keycloakId depuis Keycloak Admin Console
# → abc-123-def-456

# 2. Créer l'utilisateur avec son compte
node scripts/setup-user-with-compte.js

# 3. Vérifier la création
docker exec crm-postgres psql -U postgres -d postgres -c "
  SELECT * FROM utilisateurs WHERE \"keycloakId\" = 'abc-123-def-456';
"

# 4. L'utilisateur peut maintenant se connecter via NextAuth
# Le backend le reconnaîtra automatiquement grâce au keycloakId
```

## Dépannage

### Erreur : "utilisateur déjà existant"

L'utilisateur existe déjà. Vérifiez avec :

```bash
docker exec crm-postgres psql -U postgres -d postgres -c "
  SELECT * FROM utilisateurs WHERE email = 'john.doe@example.com';
"
```

### Erreur : "relation utilisateurs does not exist"

La table n'existe pas. Vérifiez que :
1. L'application a démarré au moins une fois (`npm run start:dev`)
2. `DB_SYNCHRONIZE=true` dans `.env`
3. La connexion PostgreSQL fonctionne

### Erreur de connexion PostgreSQL

Vérifiez les paramètres de connexion dans les scripts :
- **host**: `localhost`
- **port**: `5433` (pas 5432)
- **user**: `postgres`
- **password**: `postgres`
- **database**: `postgres`

## Notes importantes

1. **keycloakId** : Doit correspondre exactement à l'ID Keycloak (UUID)
2. **email** : Doit être le même que dans Keycloak pour éviter les doublons
3. **Synchronisation** : Si l'utilisateur existe déjà avec le bon keycloakId, la synchronisation automatique le trouvera
4. **Multi-tenant** : Un utilisateur peut être membre de plusieurs comptes via `membres_comptes`
