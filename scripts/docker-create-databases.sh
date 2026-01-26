#!/bin/bash
# Script pour créer toutes les bases de données via Docker
# Usage: docker exec -i crm-postgres-main bash < scripts/docker-create-databases.sh

# Mot de passe pour l'authentification SCRAM-SHA-256
export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"

DATABASES=(
    "activites_db"
    "calendar_db"
    "clients_db"
    "commerciaux_db"
    "commission_db"
    "contrats_db"
    "dashboard_db"
    "documents_db"
    "email_db"
    "factures_db"
    "logistics_db"
    "notifications_db"
    "organisations_db"
    "payments_db"
    "products_db"
    "referentiel_db"
    "relance_db"
    "retry_db"
    "users_db"
)

echo "=== Creating CRM databases ==="

for DB in "${DATABASES[@]}"; do
    echo -n "Creating $DB... "
    psql -U postgres -h localhost -tc "SELECT 1 FROM pg_database WHERE datname = '$DB'" | grep -q 1 || psql -U postgres -h localhost -c "CREATE DATABASE \"$DB\""
    psql -U postgres -h localhost -d "$DB" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"" > /dev/null 2>&1
    echo "done"
done

echo "=== All databases created ==="
psql -U postgres -h localhost -c "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres', 'template0', 'template1') ORDER BY datname"
