# Configuration Base de Données

Ce dossier contient la configuration centralisée de la connexion à la base de données PostgreSQL.

## Fichiers

### 📄 `database.config.ts`
Configuration TypeORM pour PostgreSQL. Contient tous les paramètres de connexion.

**Variables d'environnement supportées:**
```env
DB_HOST=localhost          # Hôte PostgreSQL
DB_PORT=5432              # Port PostgreSQL
DB_USERNAME=postgres      # Nom d'utilisateur
DB_PASSWORD=postgres      # Mot de passe
DB_NAME=postgres          # Nom de la base de données
DB_SYNCHRONIZE=true       # Auto-synchronisation du schéma (dev uniquement!)
DB_LOGGING=false          # Active les logs SQL
DB_SSL=false              # Active SSL
```

### 📄 `database.service.ts`
Service injectable pour gérer et tester la connexion à la base de données.

**Méthodes disponibles:**
- `isConnected()` - Vérifie si la connexion est active
- `testConnection()` - Teste la connexion avec une requête
- `getConnectionInfo()` - Récupère les infos de connexion
- `executeQuery(query)` - Exécute une requête SQL brute
- `getDataSource()` - Récupère le DataSource TypeORM

## Utilisation

### Dans un module NestJS

Le service est déjà configuré dans `app.module.ts` et disponible globalement.

```typescript
import { DatabaseService } from './infrastructure/db/database.service';

@Injectable()
export class MonService {
  constructor(private readonly databaseService: DatabaseService) {}

  async maMethode() {
    // Tester la connexion
    const test = await this.databaseService.testConnection();
    console.log(test.message);

    // Récupérer les infos
    const info = this.databaseService.getConnectionInfo();
    console.log(info);
  }
}
```

### Endpoints de test

Après avoir démarré l'application, vous pouvez tester la connexion :

```bash
# Tester la connexion à la base de données
curl http://localhost:3000/database/test

# Afficher les informations de connexion
curl http://localhost:3000/database/info
```

### Importer la configuration ailleurs

```typescript
import { databaseConfig, getDatabaseConfig, getDatabaseConnectionInfo } from './infrastructure/db/database.config';

// Afficher les infos de connexion
console.log(getDatabaseConnectionInfo());

// Utiliser la config
const config = getDatabaseConfig();
```

## Démarrage rapide

1. **Créer un fichier `.env`** à la racine du projet:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=postgres
DB_SYNCHRONIZE=true
```

2. **Démarrer PostgreSQL** avec Docker:
```bash
docker-compose up -d
```

3. **Démarrer l'application**:
```bash
npm run start:dev
```

4. **Tester la connexion**:
```bash
curl http://localhost:3000/database/test
```

## Notes importantes

⚠️ **Synchronize en production:**
- Toujours mettre `DB_SYNCHRONIZE=false` en production
- Utiliser des migrations TypeORM pour les changements de schéma

🔒 **Sécurité:**
- Ne jamais committer le fichier `.env`
- Utiliser des secrets management en production (AWS Secrets Manager, Azure Key Vault, etc.)

📝 **Logging:**
- Activer `DB_LOGGING=true` uniquement pour le debug
- En production, utiliser un système de logging approprié
