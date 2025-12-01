# Configuration Base de Données PostgreSQL

Ce document décrit la configuration et l'utilisation de la base de données PostgreSQL pour le CRM.

## Prérequis

- Docker Desktop installé et en cours d'exécution
- Port 5432 disponible (ou modifier `POSTGRES_PORT` dans `.env.local`)

## Installation

### 1. Variables d'environnement

Les variables de configuration sont définies dans `.env.local` :

```env
POSTGRES_USER=crm_admin
POSTGRES_PASSWORD=crm_secure_password_2024
POSTGRES_DB=crm_database
POSTGRES_PORT=5432
POSTGRES_HOST=localhost
DATABASE_URL=postgresql://crm_admin:crm_secure_password_2024@localhost:5432/crm_database
```

**IMPORTANT:** En production, changez impérativement le mot de passe et ajoutez `.env.local` au `.gitignore`.

### 2. Démarrage de la base de données

```bash
# Démarrer PostgreSQL en arrière-plan
docker-compose up -d

# Vérifier que le conteneur fonctionne
docker-compose ps

# Voir les logs
docker-compose logs -f postgres
```

### 3. Vérification de l'initialisation

Le script `init-scripts/01-init-database.sql` crée automatiquement :

- Extension UUID
- Tables : users, clients, contracts, payments, documents, client_notes, oauth_email_accounts
- Index pour optimiser les performances
- Triggers pour mettre à jour automatiquement les timestamps
- Fonction `update_updated_at_column()`

## Commandes utiles

### Gestion du conteneur

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Arrêter et supprimer les volumes (ATTENTION: supprime les données)
docker-compose down -v

# Redémarrer
docker-compose restart

# Voir les logs en temps réel
docker-compose logs -f postgres
```

### Connexion à la base de données

#### Via Docker exec

```bash
# Se connecter au conteneur
docker exec -it crm-postgres-db psql -U crm_admin -d crm_database

# Commandes SQL utiles :
\dt              # Lister les tables
\d+ clients      # Décrire la table clients
\l               # Lister les bases de données
\q               # Quitter
```

#### Via outil externe (DBeaver, pgAdmin, etc.)

Utilisez les paramètres suivants :
- **Host:** localhost
- **Port:** 5432
- **Database:** crm_database
- **User:** crm_admin
- **Password:** crm_secure_password_2024

#### Via connexion string

```
postgresql://crm_admin:crm_secure_password_2024@localhost:5432/crm_database
```

## Structure de la base de données

### Tables principales

1. **users** - Utilisateurs/commerciaux du système
   - id, email, username, first_name, last_name, role, etc.

2. **clients** - Clients de l'entreprise
   - id, company_name, email, phone, address, status, kyc_completed, etc.

3. **contracts** - Contrats avec les clients
   - id, contract_number, client_id, commercial_id, amount, status, dates, etc.

4. **payments** - Paiements reçus
   - id, contract_id, client_id, amount, payment_date, status, etc.

5. **documents** - Documents uploadés
   - id, client_id, contract_id, file_name, file_path, document_type, etc.

6. **client_notes** - Notes et historique clients
   - id, client_id, user_id, note_type, content, etc.

7. **oauth_email_accounts** - Comptes email OAuth connectés
   - id, user_id, provider, email, tokens, etc.

### Relations

- `clients.assigned_to` → `users.id`
- `contracts.client_id` → `clients.id`
- `contracts.commercial_id` → `users.id`
- `payments.contract_id` → `contracts.id`
- `payments.client_id` → `clients.id`
- `documents.client_id` → `clients.id`
- `documents.contract_id` → `contracts.id`
- `client_notes.client_id` → `clients.id`
- `oauth_email_accounts.user_id` → `users.id`

## Backup et restauration

### Backup manuel

```bash
# Backup complet
docker exec crm-postgres-db pg_dump -U crm_admin crm_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup avec compression
docker exec crm-postgres-db pg_dump -U crm_admin crm_database | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restauration

```bash
# Depuis un backup SQL
docker exec -i crm-postgres-db psql -U crm_admin -d crm_database < backup.sql

# Depuis un backup compressé
gunzip -c backup.sql.gz | docker exec -i crm-postgres-db psql -U crm_admin -d crm_database
```

## Sécurité

### Recommandations pour la production

1. **Changer le mot de passe** :
   ```sql
   ALTER USER crm_admin WITH PASSWORD 'nouveau_mot_de_passe_fort';
   ```

2. **Restreindre l'accès réseau** :
   - Ne pas exposer le port 5432 publiquement
   - Utiliser un réseau Docker privé
   - Configurer pg_hba.conf pour limiter les connexions

3. **Chiffrement SSL/TLS** :
   - Activer SSL dans PostgreSQL
   - Utiliser des certificats valides

4. **Sauvegardes automatiques** :
   - Configurer des backups réguliers
   - Tester les procédures de restauration
   - Stocker les backups hors site

5. **Monitoring** :
   - Surveiller les performances
   - Logs d'audit des connexions
   - Alertes sur les erreurs

## Intégration avec Next.js

Pour utiliser PostgreSQL dans votre application Next.js, vous pouvez utiliser :

### Avec Prisma (recommandé)

```bash
# Installer Prisma
npm install @prisma/client
npm install -D prisma

# Initialiser Prisma
npx prisma init

# Générer le client
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev
```

### Avec node-postgres (pg)

```bash
npm install pg
npm install -D @types/pg
```

Exemple de connexion :
```typescript
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export default pool
```

## Troubleshooting

### Port déjà utilisé

Si le port 5432 est déjà utilisé :
1. Modifier `POSTGRES_PORT` dans `.env.local`
2. Redémarrer : `docker-compose down && docker-compose up -d`

### Conteneur ne démarre pas

```bash
# Vérifier les logs
docker-compose logs postgres

# Vérifier l'état
docker-compose ps

# Reconstruire si nécessaire
docker-compose down -v
docker-compose up -d --build
```

### Problème de connexion

1. Vérifier que le conteneur est en cours d'exécution
2. Vérifier les credentials dans `.env.local`
3. Vérifier que le port est bien exposé
4. Tester la connexion : `docker exec crm-postgres-db pg_isready`

### Réinitialiser complètement

```bash
# ATTENTION: Supprime toutes les données !
docker-compose down -v
docker-compose up -d
```

## Support

Pour toute question ou problème :
- Consulter la documentation PostgreSQL : https://www.postgresql.org/docs/
- Consulter la documentation Docker : https://docs.docker.com/
