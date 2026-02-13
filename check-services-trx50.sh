#!/bin/bash
echo "==================================="
echo "VÉRIFICATION DES SERVICES TRX50"
echo "==================================="
echo ""

echo "1. CONTENEURS ALEX-CRM EN COURS D'EXÉCUTION:"
echo "-------------------------------------------"
docker ps --filter "name=alex-crm" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "2. SERVICE-COMMERCIAL (WinLeadPlus):"
echo "------------------------------------"
docker ps --filter "name=alex-crm-service-commercial" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
if docker ps --filter "name=alex-crm-service-commercial" --format "{{.Names}}" | grep -q "alex-crm-service-commercial"; then
    echo "✅ Service commercial est actif"
    echo ""
    echo "Logs récents (20 dernières lignes):"
    docker logs alex-crm-service-commercial --tail 20
else
    echo "❌ Service commercial n'est PAS actif"
fi
echo ""

echo "3. FRONTEND:"
echo "-----------"
docker ps --filter "name=alex-crm-frontend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "4. INFRASTRUCTURE:"
echo "------------------"
docker ps --filter "name=alex-crm-consul" --format "table {{.Names}}\t{{.Status}}"
docker ps --filter "name=alex-crm-nats" --format "table {{.Names}}\t{{.Status}}"
echo ""

echo "5. TOUS LES SERVICES ALEX-CRM:"
echo "------------------------------"
docker ps --filter "name=alex-crm" --format "{{.Names}}" | wc -l
echo "conteneurs actifs"
echo ""

echo "==================================="
echo "RÉSUMÉ:"
echo "==================================="
docker ps --filter "name=alex-crm" --format "table {{.Names}}\t{{.Status}}" | grep -E "NAME|Up" || echo "❌ Aucun service actif"
