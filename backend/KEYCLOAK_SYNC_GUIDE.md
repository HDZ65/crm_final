# Guide de Synchronisation Keycloak

## Vue d'ensemble

Ce système synchronise automatiquement les utilisateurs Keycloak avec votre base de données PostgreSQL lors de leur première connexion. Keycloak reste la source de vérité pour l'authentification, tandis que votre BDD stocke les données métier.

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│     KEYCLOAK        │         │   POSTGRES (CRM)     │
├─────────────────────┤         ├──────────────────────┤
│ • Authentification  │         │ • keycloakId (lien)  │
│ • Tokens JWT        │◄────────┤ • Données métier     │
│ • Mots de passe     │  sync   │ • Relations CRM      │
│ • Rôles Keycloak    │         │ • Préférences        │
└─────────────────────┘         └──────────────────────┘
```

## Fonctionnement

### 1. Flux de synchronisation

Lorsqu'un utilisateur s'authentifie via Keycloak :

1. **AuthGuard** (Keycloak) : Valide le token JWT
2. **RoleGuard** (Keycloak) : Vérifie les permissions Keycloak
3. **KeycloakSyncGuard** : Synchronise l'utilisateur avec la BDD
   - Recherche l'utilisateur par `keycloakId`
   - Si trouvé → retourne l'utilisateur existant
   - Si non trouvé → crée un nouvel utilisateur avec les infos du token
4. L'utilisateur synchronisé est disponible dans `request.user.dbUser`

### 2. Modifications apportées

#### Entités

**Domain Entity** (`src/core/domain/utilisateur.entity.ts`):
```typescript
export interface UtilisateurProps {
  id?: string;
  keycloakId?: string;  // ✅ Nouveau champ
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  actif: boolean;
}
```

**TypeORM Entity** (`src/infrastructure/db/entities/utilisateur.entity.ts`):
```typescript
@Column({ nullable: true, unique: true })
keycloakId: string;  // ✅ Index unique pour recherches rapides
```

#### DTOs

**CreateUtilisateurDto**:
```typescript
@IsString()
@IsOptional()
keycloakId?: string;  // ✅ Optionnel (auto-rempli par Keycloak)
```

**UtilisateurDto** (Response):
```typescript
keycloakId?: string;  // ✅ Visible dans les réponses API
```

#### Repository

**UtilisateurRepositoryPort** (`src/core/port/utilisateur-repository.port.ts`):
```typescript
export interface UtilisateurRepositoryPort {
  findByKeycloakId(keycloakId: string): Promise<UtilisateurEntity | null>;  // ✅ Nouvelle méthode
}
```

**TypeOrmUtilisateurRepository**:
```typescript
async findByKeycloakId(keycloakId: string): Promise<UtilisateurEntity | null> {
  const entity = await this.repository.findOne({ where: { keycloakId } });
  return entity ? UtilisateurMapper.toDomain(entity) : null;
}
```

#### Services

**AuthSyncService** (`src/infrastructure/services/auth-sync.service.ts`):
- `syncKeycloakUser(keycloakUser)`: Synchronise ou crée un utilisateur
- `findByKeycloakId(keycloakId)`: Recherche par keycloakId

**KeycloakSyncGuard** (`src/infrastructure/framework/nest/guards/keycloak-sync.guard.ts`):
- S'exécute après l'authentification Keycloak
- Ajoute `request.user.dbUser` avec l'utilisateur de la BDD

## Utilisation dans les contrôleurs

### Accéder à l'utilisateur synchronisé

```typescript
@Controller('api/resource')
export class MyController {
  @Get()
  @UseGuards(AuthGuard, RoleGuard)  // Keycloak guards
  async getResource(@Request() req) {
    // Utilisateur Keycloak (JWT token)
    const keycloakUser = req.user;
    console.log(keycloakUser.sub);  // Keycloak ID
    console.log(keycloakUser.email);
    console.log(keycloakUser.roles);

    // Utilisateur de la BDD (synchronisé automatiquement)
    const dbUser = req.user.dbUser;  // ✅ Ajouté par KeycloakSyncGuard
    console.log(dbUser.id);  // UUID de votre BDD
    console.log(dbUser.keycloakId);  // Lien avec Keycloak
    console.log(dbUser.email);
    console.log(dbUser.nom);
    console.log(dbUser.prenom);

    // Utiliser dbUser.id pour les relations CRM
    const activites = await this.activiteService.findByUtilisateur(dbUser.id);
    return activites;
  }
}
```

### Créer un décorateur personnalisé

Pour simplifier l'accès :

```typescript
// src/infrastructure/framework/nest/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.dbUser;
  },
);
```

Utilisation :

```typescript
@Get()
@UseGuards(AuthGuard, RoleGuard)
async getResource(@CurrentUser() user: UtilisateurEntity) {
  console.log(user.id);  // Direct access
  console.log(user.email);
}
```

## Configuration

### Activer la sécurité

Dans `.env` :
```env
ENABLE_SECURITY=true  # Active les guards Keycloak + sync

KC_URL=http://localhost:8080
KC_REALM=master
KC_CLIENT_ID=nest-backend-local
KC_SECRET=your-client-secret  # Optionnel pour client public
```

### Mode développement (sans sécurité)

```env
ENABLE_SECURITY=false  # Désactive tous les guards
```

## Base de données

### Migration automatique

Avec `DB_SYNCHRONIZE=true`, TypeORM créera automatiquement la colonne `keycloakId` :

```sql
ALTER TABLE utilisateurs
ADD COLUMN "keycloakId" varchar NULL,
ADD CONSTRAINT "UQ_keycloakId" UNIQUE ("keycloakId");
```

### Migration manuelle (production)

Si vous devez créer une migration :

```bash
npm run typeorm migration:generate -- -n AddKeycloakIdToUtilisateur
npm run typeorm migration:run
```

## Scénarios d'utilisation

### Scénario 1 : Première connexion

1. Utilisateur se connecte via Keycloak
2. Token JWT contient : `sub`, `email`, `given_name`, `family_name`
3. `KeycloakSyncGuard` ne trouve pas l'utilisateur dans la BDD
4. Un nouvel utilisateur est créé :
   ```typescript
   {
     keycloakId: "abc-123-def-456",
     email: "user@example.com",
     prenom: "John",
     nom: "Doe",
     telephone: "",  // À compléter plus tard
     actif: true
   }
   ```
5. L'utilisateur est disponible dans `request.user.dbUser`

### Scénario 2 : Connexions suivantes

1. Utilisateur se connecte via Keycloak
2. `KeycloakSyncGuard` trouve l'utilisateur par `keycloakId`
3. L'utilisateur existant est retourné
4. Disponible dans `request.user.dbUser`

### Scénario 3 : Mise à jour des données utilisateur

Les données Keycloak (nom, email) ne sont synchronisées **qu'à la création**.
Pour mettre à jour un utilisateur existant :

```typescript
// Option 1 : API manuelle
@Put('utilisateurs/:id')
async updateUtilisateur(
  @Param('id') id: string,
  @Body() dto: UpdateUtilisateurDto
) {
  return this.utilisateurService.update(id, dto);
}

// Option 2 : Resynchroniser depuis Keycloak (à implémenter si nécessaire)
@Post('utilisateurs/resync')
async resyncFromKeycloak(@CurrentUser() user: UtilisateurEntity) {
  // Récupérer les infos depuis Keycloak Admin API
  // Mettre à jour l'utilisateur
}
```

## Logs et débogage

Le `KeycloakSyncGuard` et `AuthSyncService` utilisent le logger NestJS :

```
[AuthSyncService] Utilisateur existant trouvé: user@example.com (keycloakId: abc-123)
[AuthSyncService] Création d'un nouvel utilisateur pour keycloakId: def-456
[AuthSyncService] Nouvel utilisateur créé: newuser@example.com (id: uuid-789)
[KeycloakSyncGuard] Utilisateur synchronisé: user@example.com (id: uuid-123)
```

Pour activer les logs de débogage :

```typescript
// main.ts
app.useLogger(['log', 'error', 'warn', 'debug']);
```

## Sécurité

### Points importants

1. ✅ **Pas de mot de passe en BDD** - Keycloak gère l'authentification
2. ✅ **keycloakId unique** - Index unique empêche les doublons
3. ✅ **Synchronisation silencieuse** - Les erreurs ne bloquent pas la requête
4. ✅ **Response DTO** - keycloakId visible mais pas sensible

### À faire en production

1. **Validation des tokens** :
   ```env
   ENABLE_SECURITY=true
   KC_SECRET=your-production-secret
   ```

2. **HTTPS obligatoire** :
   ```env
   KC_URL=https://keycloak.production.com
   ```

3. **Rate limiting** sur les endpoints d'authentification

4. **Monitoring** des synchronisations ratées

## Tests

### Test unitaire du service

```typescript
describe('AuthSyncService', () => {
  it('should create new user on first login', async () => {
    const keycloakUser = {
      sub: 'keycloak-123',
      email: 'test@example.com',
      given_name: 'John',
      family_name: 'Doe'
    };

    const result = await service.syncKeycloakUser(keycloakUser);

    expect(result.keycloakId).toBe('keycloak-123');
    expect(result.email).toBe('test@example.com');
  });
});
```

### Test E2E

```typescript
describe('Authentication (e2e)', () => {
  it('/api/protected (GET) with valid token', () => {
    return request(app.getHttpServer())
      .get('/api/protected')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.user).toBeDefined();
        expect(res.body.user.keycloakId).toBeDefined();
      });
  });
});
```

## Dépannage

### Problème : Utilisateur non synchronisé

**Vérifications** :
1. `ENABLE_SECURITY=true` ?
2. Le token Keycloak est valide ?
3. Le guard est bien enregistré dans `security.module.ts` ?

**Logs** :
```
[KeycloakSyncGuard] Utilisateur synchronisé: ...
```

### Problème : Duplicate keycloakId

**Erreur** :
```
duplicate key value violates unique constraint "UQ_keycloakId"
```

**Solution** :
```sql
-- Trouver les doublons
SELECT "keycloakId", COUNT(*)
FROM utilisateurs
WHERE "keycloakId" IS NOT NULL
GROUP BY "keycloakId"
HAVING COUNT(*) > 1;

-- Nettoyer manuellement
```

### Problème : Email manquant

Si le token Keycloak ne contient pas d'email :
```typescript
// AuthSyncService extrait d'autres champs
email: keycloakUser.email || keycloakUser.preferred_username || '',
```

## Évolutions futures

### 1. Synchronisation bidirectionnelle

Mettre à jour Keycloak depuis votre BDD :
```typescript
@Injectable()
export class KeycloakAdminService {
  async updateKeycloakUser(userId: string, data: Partial<User>) {
    // Utiliser Keycloak Admin API
  }
}
```

### 2. Webhooks Keycloak

Écouter les événements Keycloak (user.created, user.updated, user.deleted) :
```typescript
@Controller('webhooks/keycloak')
export class KeycloakWebhookController {
  @Post()
  async handleEvent(@Body() event: KeycloakEvent) {
    if (event.type === 'user.updated') {
      await this.authSyncService.updateFromKeycloak(event.userId);
    }
  }
}
```

### 3. Gestion des rôles

Synchroniser les rôles Keycloak avec la table `roles` :
```typescript
async syncKeycloakRoles(keycloakUser: KeycloakUser) {
  const roles = keycloakUser.realm_access?.roles || [];
  // Mapper vers votre table roles
}
```

## Résumé

✅ **Implémenté** :
- Champ `keycloakId` dans toutes les couches
- Repository method `findByKeycloakId`
- `AuthSyncService` pour la synchronisation
- `KeycloakSyncGuard` pour l'interception
- Intégration dans `SecurityModule`

🎯 **Utilisation** :
```typescript
@Get()
@UseGuards(AuthGuard, RoleGuard)
async myEndpoint(@Request() req) {
  const dbUser = req.user.dbUser;  // Utilisateur synchronisé
  console.log(dbUser.id, dbUser.keycloakId);
}
```

📚 **Documentation complète** :
- Architecture
- Flux de synchronisation
- Exemples d'utilisation
- Tests
- Dépannage
