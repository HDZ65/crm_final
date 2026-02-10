# Decisions — Catalogue Partenaires CDC

## Architectural Decisions

### AD-001: Nouvelle entité PartenaireCommercial
- **Decision**: Créer une NOUVELLE entité `PartenaireCommercialEntity` dans service-commercial
- **Rationale**: `PartenaireMarqueBlancheEntity` (service-core) gère le white-label (thème, portail). Les partenaires commerciaux du CDC (Assureur, FAI, Énergie) sont un concept métier différent
- **Alternative rejected**: Enrichir PartenaireMarqueBlanche → conflation de deux domaines distincts

### AD-002: OggoData en port/adapter
- **Decision**: Interface IOggoDataAdapter + Mock adapter + HTTP adapter réel
- **Rationale**: Specs API OggoData non disponibles au moment du plan. Port/adapter permet de développer sans bloquer, avec circuit breaker pour prod
- **Alternative rejected**: Attendre les specs → bloque tout le plan

### AD-003: Audit trail global via EntitySubscriber
- **Decision**: Une migration globale + AuditSubscriber TypeORM
- **Rationale**: Plus efficace que modifier chaque service individuellement. Intercepte automatiquement tous les INSERT/UPDATE
- **Alternative rejected**: Modifier chaque entité manuellement → répétitif et error-prone

### AD-004: Moteur tarification = Strategy Pattern
- **Decision**: 7 modèles de prix implémentés comme stratégies interchangeables, config en JSONB
- **Rationale**: Extensible, testable, config flexible par produit
- **Alternative rejected**: Hardcoder chaque modèle dans ProduitEntity → rigide

### AD-005: Catalogue = Entité agrégée
- **Decision**: Snapshot des versions produit publiées, lifecycle Brouillon→Publié→Archivé
- **Rationale**: Permet de figer un catalogue à un instant T, traçabilité
- **Alternative rejected**: Vue dynamique uniquement → pas de snapshot historique
