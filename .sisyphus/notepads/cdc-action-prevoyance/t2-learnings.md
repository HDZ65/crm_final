# Task 2 Learnings - Service Entities in service-engagement

## Conventions Found

### Entity Pattern
- Enums defined as TypeScript enums with string values (e.g., `TacheStatut.A_FAIRE = 'a_faire'`)
- `@Entity('table_name')` with snake_case table names
- `@PrimaryGeneratedColumn('uuid')` for all IDs
- `@Column({ name: 'snake_case' })` for column name mapping, camelCase in TS
- `@CreateDateColumn({ name: 'created_at' })` / `@UpdateDateColumn({ name: 'updated_at' })` for timestamps
- `type: 'jsonb'` for metadata columns
- `type: 'enum', enum: EnumType, default: EnumType.VALUE` for enum columns
- Entities are NOT suffixed with `Entity` when in services subdomain (engagement entities use `Entity` suffix, but services entities follow domain naming: `DemandeConciergerie`, not `DemandeConciergerie​Entity`)

### Repository Interface Pattern
- Named `I<EntityName>Repository` (e.g., `ITacheRepository`)
- Import entity + enums from relative entity path
- Standard methods: `findById`, `findAll` (with filters + pagination), `save`, `delete`
- Pagination returns `{ data, total, page, limit, totalPages }`

### Migration Pattern
- Timestamp prefix naming: `{timestamp}-{Name}.ts`
- Class name: `{Name}{Timestamp}`
- ENUMs created via raw SQL: `CREATE TYPE "public"."table_column_enum" AS ENUM(...)`
- Tables use `uuid_generate_v4()` for default IDs
- TIMESTAMP WITH TIME ZONE for dates
- Full down() reversal with reverse order drop

### Module Wiring
- `TypeOrmModule.forFeature([...entities])` in imports array
- Entities imported from barrel export `./domain/<context>/entities`
- New subdomain `domain/services/` separate from `domain/engagement/`

### DB Connection
- PostgreSQL not available locally (Docker required)
- Migration run fails with ECONNREFUSED but migration file is syntactically verified via build
