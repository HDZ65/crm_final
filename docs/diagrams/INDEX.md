# 📊 Index des Diagrammes UML - CRM Final

Tous les diagrammes de classes UML de l'architecture du CRM, générés automatiquement à partir de l'analyse complète du code source.

---

## 🎯 Accès Rapide

### Diagramme Complet
- **[00-complete-class-diagram.mmd](./00-complete-class-diagram.mmd)** — Diagramme complet (1282 lignes, 36 KB)

### Diagrammes Par Bounded Context
1. **[01-shared-kernel.mmd](./01-shared-kernel.mmd)** — Value Objects, Base Classes & Exceptions (128 lignes)
2. **[02-service-core.mmd](./02-service-core.mmd)** — Users, Organisations, Clients (196 lignes)
3. **[03-service-finance.mmd](./03-service-finance.mmd)** — Factures, Payments, Calendar (486 lignes)
4. **[04-engagement-logistics.mmd](./04-engagement-logistics.mmd)** — Engagement & Logistics (354 lignes)
5. **[05-inter-services.mmd](./05-inter-services.mmd)** — Relations inter-services (94 lignes)

### Documentation
- **[README.md](./README.md)** — Guide complet d'utilisation
- **[../architecture/class-diagrams.md](../architecture/class-diagrams.md)** — Documentation intégrée avec diagrammes

---

## 🚀 Utilisation Rapide

### Méthode 1 : Mermaid Live (Instantané)
```bash
# Ouvrir https://mermaid.live
# Copier-coller le contenu d'un fichier .mmd
# Le diagramme s'affiche automatiquement
```

### Méthode 2 : VS Code
```bash
# 1. Installer l'extension "Mermaid Preview"
code --install-extension vstirbu.vscode-mermaid-preview

# 2. Ouvrir un fichier .mmd
code docs/diagrams/01-shared-kernel.mmd

# 3. Appuyer sur Ctrl+Shift+V (ou Cmd+Shift+V sur Mac)
```

### Méthode 3 : Ligne de Commande (Génération PNG)
```bash
# Installer mmdc (Mermaid CLI)
npm install -g @mermaid-js/mermaid-cli

# Générer un PNG
mmdc -i docs/diagrams/01-shared-kernel.mmd -o output.png

# Générer un SVG
mmdc -i docs/diagrams/01-shared-kernel.mmd -o output.svg
```

---

## 📈 Statistiques Détaillées

### Par Bounded Context

| Bounded Context | Service | Fichier | Entités | Relations | Lignes |
|---|---|---|---|---|---|
| **Shared Kernel** | `packages/shared-kernel` | `01-shared-kernel.mmd` | 17 + 6 ex. | 16 | 128 |
| **Users** | `service-core` | `02-service-core.mmd` | 7 | 6 | — |
| **Organisations** | `service-core` | `02-service-core.mmd` | 5 | 5 | — |
| **Clients** | `service-core` | `02-service-core.mmd` | 8 | 3 | — |
| **Documents** | `service-core` | `02-service-core.mmd` | 2 | 0 | — |
| **Factures** | `service-finance` | `03-service-finance.mmd` | 9 | 7 | — |
| **Payments** | `service-finance` | `03-service-finance.mmd` | 27 | 12 | — |
| **Calendar** | `service-finance` | `03-service-finance.mmd` | 11 | 2 | — |
| **Engagement** | `service-engagement` | `04-engagement-logistics.mmd` | 11 | 2 | — |
| **Services** | `service-engagement` | `04-engagement-logistics.mmd` | 4 | 1 | — |
| **Logistics** | `service-logistics` | `04-engagement-logistics.mmd` | 4 | 3 | — |
| **Fulfillment** | `service-logistics` | `04-engagement-logistics.mmd` | 5 + 2 svc | 5 | — |

**TOTAL** : **~110 classes**, **~62 relations**, **2540 lignes de code Mermaid**

### Par Type de Classe

| Type | Nombre | Exemples |
|------|--------|----------|
| **Value Objects** | 17 | `Montant`, `Phone`, `Email`, `Address`, 9 UUID VOs |
| **Entités Métier** | 93 | `FactureEntity`, `PaymentIntentEntity`, `ExpeditionEntity` |
| **Exceptions** | 6 | `NotFoundException`, `BusinessRuleException` |
| **Enums** | 9 | `PaymentProvider`, `PaymentIntentStatus`, `TacheStatut` |
| **Services Domaine** | 2 | `FulfillmentBatchService`, `BatchSnapshotService` |
| **Base Classes** | 2 | `DomainEvent`, `AggregateRoot` |

---

## 🏗️ Architecture Globale

```
CRM Final (Architecture DDD)
│
├─ Shared Kernel (packages/shared-kernel)
│  ├─ Value Objects (17)
│  ├─ Base Classes (2)
│  └─ Exceptions (6)
│
├─ Service-Core (30 entités)
│  ├─ Users (7)
│  ├─ Organisations (5)
│  ├─ Clients (8)
│  └─ Documents (2)
│
├─ Service-Finance (47 entités)
│  ├─ Factures (9)
│  ├─ Payments (27)
│  └─ Calendar (11)
│
├─ Service-Engagement (15 entités)
│  ├─ Engagement (11)
│  └─ Services/Conciergerie (4)
│
└─ Service-Logistics (11 entités + 2 services)
   ├─ Logistics (4)
   └─ Fulfillment (5 + 2 services)
```

---

## 🔗 Liens Utiles

- **Mermaid Live Editor** : https://mermaid.live
- **Documentation Mermaid** : https://mermaid.js.org/syntax/classDiagram.html
- **Extension VS Code** : https://marketplace.visualstudio.com/items?itemName=vstirbu.vscode-mermaid-preview
- **Mermaid CLI** : https://github.com/mermaid-js/mermaid-cli

---

## 📝 Notes Techniques

### Format des Fichiers
- **Encodage** : UTF-8
- **Format** : Mermaid syntax (`.mmd`)
- **Version Mermaid** : Compatible avec Mermaid v10.0+

### Conventions de Notation
- `<<abstract>>` : Classe abstraite
- `<<enumeration>>` : Énumération
- `<<service>>` : Service du domaine
- `+` : public, `-` : private, `#` : protected, `$` : static, `*` : abstract method
- `-->` : Association/ManyToOne
- `<|--` : Héritage
- `..>` : Usage/Dépendance

### Génération
- **Date** : 2026-02-10
- **Source** : Analyse automatique de ~100 fichiers TypeScript
- **Méthode** : AST parsing, TypeORM decorators, domain analysis

---

## 🎨 Exemples d'Utilisation

### Intégration dans un README
```markdown
# Architecture

Voir le diagramme complet :

\`\`\`mermaid
[copier le contenu de 01-shared-kernel.mmd]
\`\`\`
```

### Export vers Image
```bash
# PNG haute résolution
mmdc -i 00-complete-class-diagram.mmd -o architecture.png -w 3000

# SVG pour documentation web
mmdc -i 00-complete-class-diagram.mmd -o architecture.svg

# PDF pour présentation
mmdc -i 00-complete-class-diagram.mmd -o architecture.pdf
```

### Génération Batch
```bash
# Générer tous les diagrammes en PNG
for f in docs/diagrams/*.mmd; do
  mmdc -i "$f" -o "${f%.mmd}.png" -w 2400
done
```

---

**Dernière mise à jour** : 2026-02-10  
**Maintenu par** : Équipe Architecture CRM
