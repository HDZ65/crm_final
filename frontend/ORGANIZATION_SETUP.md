# Organisation Multi-Tenant - Guide d'implémentation

Ce document explique comment configurer le système d'organisations multi-tenant pour votre CRM.

## Architecture

### Modèle de données

Le système repose sur un modèle à 3 niveaux :

```
User (Keycloak)
    ↓
OrganizationMember (rôle + permissions)
    ↓
Organization (tenant)
    ↓
Data (clients, contrats, etc.)
```

### Schéma de base de données recommandé

```sql
-- Table des organisations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'free', -- free, pro, enterprise
  logo_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table des membres d'organisation
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL, -- ID Keycloak
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES organization_members(id),
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, organization_id)
);

-- Table des invitations en attente
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID NOT NULL REFERENCES organization_members(id),
  token VARCHAR(100) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, email)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);

-- Ajouter organization_id à toutes les tables métier
ALTER TABLE clients ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE contrats ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE partenaires ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
-- etc.

-- Index pour filtrer par organisation
CREATE INDEX idx_clients_org ON clients(organization_id);
CREATE INDEX idx_contrats_org ON contrats(organization_id);
CREATE INDEX idx_partenaires_org ON partenaires(organization_id);
```

## Rôles et permissions

| Rôle | Permissions |
|------|-------------|
| **owner** | Tous les droits, peut supprimer l'organisation, transférer la propriété |
| **admin** | Peut inviter/gérer les utilisateurs, gérer les paramètres de l'org |
| **member** | Peut créer et modifier les données (clients, contrats, etc.) |
| **viewer** | Lecture seule sur toutes les données |

## APIs Backend à implémenter

### 1. Gestion des organisations

#### GET `/api/organizations`
Récupère toutes les organisations dont l'utilisateur est membre.

**Headers:**
```
Authorization: Bearer {keycloak_token}
```

**Response:**
```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "Finanssor",
      "slug": "finanssor",
      "plan": "enterprise",
      "logo_url": "https://...",
      "role": "owner",
      "member_count": 5,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/api/organizations`
Crée une nouvelle organisation.

**Body:**
```json
{
  "name": "Mon Entreprise",
  "slug": "mon-entreprise"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Mon Entreprise",
  "slug": "mon-entreprise",
  "plan": "free",
  "role": "owner"
}
```

### 2. Gestion des membres

#### GET `/api/organizations/{organizationId}/members`
Liste tous les membres de l'organisation.

**Response:**
```json
{
  "members": [
    {
      "id": "uuid",
      "user_id": "keycloak-user-id",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": "https://...",
      "role": "owner",
      "joined_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### PATCH `/api/organizations/{organizationId}/members/{memberId}`
Change le rôle d'un membre.

**Body:**
```json
{
  "role": "admin"
}
```

**Permissions:** owner ou admin (admin ne peut pas modifier un owner)

#### DELETE `/api/organizations/{organizationId}/members/{memberId}`
Retire un membre de l'organisation.

**Permissions:** owner ou admin (admin ne peut pas retirer un owner)

### 3. Gestion des invitations

#### GET `/api/organizations/{organizationId}/invitations`
Liste les invitations en attente.

**Response:**
```json
{
  "invitations": [
    {
      "id": "uuid",
      "email": "new-user@example.com",
      "role": "member",
      "invited_by": "John Doe",
      "invited_at": "2024-01-01T00:00:00Z",
      "expires_at": "2024-01-08T00:00:00Z"
    }
  ]
}
```

#### POST `/api/organizations/{organizationId}/invitations`
Invite un nouveau membre.

**Body:**
```json
{
  "email": "new-user@example.com",
  "role": "member"
}
```

**Logique backend:**
1. Vérifier que l'email n'est pas déjà membre
2. Créer un token unique
3. Enregistrer l'invitation en DB
4. Envoyer un email avec le lien d'invitation
5. Retourner l'invitation créée

**Response:**
```json
{
  "id": "uuid",
  "email": "new-user@example.com",
  "role": "member",
  "token": "random-secure-token",
  "expires_at": "2024-01-08T00:00:00Z"
}
```

#### DELETE `/api/organizations/{organizationId}/invitations/{invitationId}`
Annule une invitation.

**Permissions:** owner ou admin

#### POST `/api/organizations/join/{token}`
Accepte une invitation (endpoint public, accessible via email).

**Body:**
```json
{
  "user_id": "keycloak-user-id" // Obtenu après login
}
```

**Logique:**
1. Vérifier que le token est valide et non expiré
2. Créer un OrganizationMember
3. Supprimer l'invitation
4. Retourner l'organisation

## Middleware de sécurité

### Vérification de l'organisation

Chaque requête doit inclure un header `X-Organization-Id` ou un cookie `org_id`.

```typescript
// Example middleware (Node.js/Express)
async function requireOrganization(req, res, next) {
  const userId = req.user.id; // De Keycloak
  const orgId = req.headers['x-organization-id'] || req.cookies.org_id;

  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID required' });
  }

  // Vérifier que l'user est membre
  const member = await db.organization_members.findFirst({
    where: {
      user_id: userId,
      organization_id: orgId
    },
    include: { organization: true }
  });

  if (!member) {
    return res.status(403).json({ error: 'Not a member of this organization' });
  }

  // Attacher à la requête
  req.organization = member.organization;
  req.userRole = member.role;

  next();
}
```

### Row-Level Security (RLS)

Pour PostgreSQL, vous pouvez utiliser RLS pour forcer l'isolation :

```sql
-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy : un user ne voit que les données de ses orgs
CREATE POLICY clients_isolation ON clients
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = current_setting('app.current_user_id')::text
    )
  );

-- Dans votre code backend, définir le user_id en début de transaction
SET LOCAL app.current_user_id = 'keycloak-user-id';
```

## Logique d'inscription

### Quand un nouvel utilisateur s'inscrit via Keycloak :

1. **Créer automatiquement une organisation personnelle**
   ```sql
   INSERT INTO organizations (name, slug, plan)
   VALUES ('Mon Espace', 'user-{user_id}', 'free');
   ```

2. **Créer le membership avec role owner**
   ```sql
   INSERT INTO organization_members (user_id, organization_id, role)
   VALUES ('{keycloak_user_id}', '{new_org_id}', 'owner');
   ```

3. **L'utilisateur démarre dans son espace personnel**

### Si l'utilisateur a été invité :

1. À la première connexion, détecter les invitations en attente par email
2. Proposer d'accepter automatiquement les invitations
3. Rediriger vers l'organisation invitante

## Frontend - Gestion du contexte

### Hook personnalisé pour l'organisation active

Créez un contexte React pour gérer l'organisation courante :

```typescript
// hooks/useOrganization.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  switchOrganization: (orgId: string) => void;
  userRole: OrganizationRole | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userRole, setUserRole] = useState<OrganizationRole | null>(null);

  useEffect(() => {
    // Charger les organisations de l'utilisateur
    fetch('/api/organizations')
      .then(res => res.json())
      .then(data => {
        setOrganizations(data.organizations);
        // Charger la dernière org active depuis localStorage
        const lastOrgId = localStorage.getItem('lastOrganizationId');
        const org = data.organizations.find(o => o.id === lastOrgId) || data.organizations[0];
        setCurrentOrganization(org);
        setUserRole(org.role);
      });
  }, []);

  const switchOrganization = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
      setUserRole(org.role);
      localStorage.setItem('lastOrganizationId', orgId);
      // Optionnel : recharger la page pour mettre à jour toutes les données
      window.location.reload();
    }
  };

  return (
    <OrganizationContext.Provider value={{ currentOrganization, organizations, switchOrganization, userRole }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
```

### Utilisation dans le TeamSwitcher

Modifiez `team-switcher.tsx` pour utiliser le contexte :

```typescript
import { useOrganization } from '@/hooks/useOrganization';

export function TeamSwitcher() {
  const { currentOrganization, organizations, switchOrganization } = useOrganization();

  return (
    // Utilisez organizations et switchOrganization
  );
}
```

## Configuration des endpoints API

Dans votre code, toujours inclure l'organisation dans les requêtes :

```typescript
// Exemple : Récupérer les clients
const { currentOrganization } = useOrganization();

const clients = await fetch(`/api/clients`, {
  headers: {
    'X-Organization-Id': currentOrganization.id
  }
});
```

## Migration des données existantes

Si vous avez déjà des données dans votre base :

```sql
-- 1. Créer une organisation "default"
INSERT INTO organizations (id, name, slug, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default', 'enterprise');

-- 2. Associer tous les users existants à cette org
INSERT INTO organization_members (user_id, organization_id, role)
SELECT DISTINCT user_id, '00000000-0000-0000-0000-000000000001', 'owner'
FROM keycloak_users; -- Adapter selon votre table users

-- 3. Migrer toutes les données existantes
UPDATE clients SET organization_id = '00000000-0000-0000-0000-000000000001';
UPDATE contrats SET organization_id = '00000000-0000-0000-0000-000000000001';
-- etc.
```

## Plans tarifaires (optionnel)

Limitez les fonctionnalités selon le plan :

```typescript
const PLAN_LIMITS = {
  free: {
    maxMembers: 1,
    maxClients: 50,
    maxContracts: 20,
  },
  pro: {
    maxMembers: 10,
    maxClients: 500,
    maxContracts: 200,
  },
  enterprise: {
    maxMembers: -1, // illimité
    maxClients: -1,
    maxContracts: -1,
  },
};

// Vérifier avant d'ajouter un client
if (organization.plan !== 'enterprise') {
  const clientCount = await db.clients.count({ where: { organization_id: orgId } });
  if (clientCount >= PLAN_LIMITS[organization.plan].maxClients) {
    throw new Error('Limite de clients atteinte. Passez au plan supérieur.');
  }
}
```

## Checklist d'implémentation

- [ ] Créer les tables `organizations`, `organization_members`, `organization_invitations`
- [ ] Ajouter `organization_id` à toutes les tables métier
- [ ] Implémenter les endpoints API listés ci-dessus
- [ ] Créer le middleware de vérification d'organisation
- [ ] Implémenter la logique d'invitation par email
- [ ] Créer le hook `useOrganization()` pour le frontend
- [ ] Mettre à jour tous les fetches pour inclure `X-Organization-Id`
- [ ] Tester l'isolation des données entre organisations
- [ ] Implémenter les limites par plan (optionnel)
- [ ] Migrer les données existantes

## Composants Frontend disponibles

Les composants suivants sont déjà implémentés :

- **OrganizationMembersDialog** : Dialog pour gérer les membres et invitations
- **TeamSwitcher** : Dropdown pour changer d'organisation (avec option "Gérer les membres")

Voir `src/components/app-sidebar.tsx` pour un exemple d'intégration.

## Prochaines étapes

1. Implémenter les APIs backend listées ci-dessus
2. Créer le contexte `OrganizationProvider`
3. Mettre à jour toutes vos requêtes pour filtrer par `organization_id`
4. Tester l'isolation des données
5. Implémenter le système d'invitation par email

## Support

Pour toute question, consultez la documentation ou ouvrez une issue.
