# Diagrammes de Classes UML - CRM Final

Ce dossier contient les diagrammes de classes UML complets de l'architecture du CRM, organisés par bounded context (Domain-Driven Design).

## 📁 Fichiers Disponibles

| Fichier | Contenu | Classes |
|---------|---------|---------|
| **[00-complete-class-diagram.mmd](./00-complete-class-diagram.mmd)** | **Diagramme complet** (toutes les sections combinées) | ~110 classes |
| **[01-shared-kernel.mmd](./01-shared-kernel.mmd)** | Shared Kernel : Value Objects, Base Classes & Exceptions | 17 + 6 exceptions |
| **[02-service-core.mmd](./02-service-core.mmd)** | Service-Core : Users, Organisations, Clients, Documents | 30 entités |
| **[03-service-finance.mmd](./03-service-finance.mmd)** | Service-Finance : Factures, Payments, Calendar | 47 entités |
| **[04-engagement-logistics.mmd](./04-engagement-logistics.mmd)** | Service-Engagement & Service-Logistics | 24 entités + 2 services |
| **[05-inter-services.mmd](./05-inter-services.mmd)** | Vue macro : Relations inter-services | 12 classes clés |

## 🎨 Comment Visualiser

### Option 1 : Mermaid Live (Rapide)
1. Ouvrez [mermaid.live](https://mermaid.live)
2. Copiez le contenu d'un fichier `.mmd`
3. Collez dans l'éditeur → Le diagramme s'affiche instantanément

### Option 2 : VS Code (Recommandé pour le développement)
1. Installez l'extension **Mermaid Preview** ou **Markdown Preview Mermaid Support**
2. Ouvrez un fichier `.mmd`
3. Cliquez sur l'icône de prévisualisation (ou `Ctrl+Shift+V`)

### Option 3 : GitHub (Automatique)
GitHub rend automatiquement les diagrammes Mermaid dans les fichiers `.md`. Créez un fichier markdown qui inclut :

```markdown
# Mon Diagramme

\`\`\`mermaid
[contenu du fichier .mmd]
\`\`\`
```

## 📊 Statistiques

| Bounded Context | Service | Entités | Relations |
|---|---|---|---|
| **Shared Kernel** | `packages/shared-kernel` | 17 classes + 6 exceptions | 16 héritages |
| **Users** | `service-core` | 7 entités | 6 associations |
| **Organisations** | `service-core` | 5 entités | 5 associations |
| **Clients** | `service-core` | 8 entités | 3 associations |
| **Documents** | `service-core` | 2 entités | 0 |
| **Factures** | `service-finance` | 9 entités | 7 associations |
| **Payments** | `service-finance` | 27 entités | 12 associations |
| **Calendar** | `service-finance` | 11 entités | 2 associations |
| **Engagement** | `service-engagement` | 11 entités | 2 associations |
| **Services (Conciergerie)** | `service-engagement` | 4 entités | 1 association |
| **Logistics** | `service-logistics` | 4 entités | 3 associations |
| **Fulfillment** | `service-logistics` | 5 entités + 2 services | 5 associations |
| **TOTAL** | **5 microservices** | **~110 classes** | **~62 relations** |

## 🏗️ Architecture

Le projet suit une architecture **Domain-Driven Design (DDD)** avec :

- **Shared Kernel** : Value Objects, base classes, exceptions partagés entre tous les services
- **4 Bounded Contexts** :
  - `service-core` : Gestion des utilisateurs, organisations, clients
  - `service-finance` : Facturation, paiements (6 PSP), calendrier de prélèvement
  - `service-engagement` : Notifications, tâches, activités, conciergerie
  - `service-logistics` : Expéditions, tracking, fulfillment par lots

## 🔗 Relations Inter-Services

Les services communiquent via :
- **gRPC** pour les appels synchrones
- **NATS** pour les événements asynchrones
- **Références par ID** : `organisationId`, `clientId`, `societeId`, etc.

Voir le fichier **[05-inter-services.mmd](./05-inter-services.mmd)** pour la vue macro des dépendances.

## 📝 Conventions de Notation

- `<<abstract>>` : Classe abstraite
- `<<enumeration>>` : Énumération
- `<<service>>` : Service du domaine
- `+` : public
- `-` : private
- `#` : protected
- `$` : static
- `*` : abstract method
- `-->` : Association / ManyToOne
- `<|--` : Héritage
- `..>` : Usage / Dépendance

## 🛠️ Génération

Ces diagrammes ont été générés automatiquement à partir de l'analyse complète du code source :
- ~100 fichiers TypeScript analysés
- Entités TypeORM avec décorateurs `@Entity`, `@ManyToOne`, `@OneToMany`
- Value Objects du Shared Kernel
- Services du domaine

**Date de génération** : 2026-02-10  
**Source** : `.sisyphus/drafts/class-diagram-uml.md`
