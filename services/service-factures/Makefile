.PHONY: help install build start dev test lint clean docker-build docker-up docker-down proto-gen

# Couleurs pour l'affichage
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Affiche cette aide
	@echo "$(BLUE)Service Factures - Commandes disponibles$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Installe les dépendances
	@echo "$(BLUE)Installation des dépendances...$(NC)"
	bun install

build: ## Compile le projet TypeScript
	@echo "$(BLUE)Compilation du projet...$(NC)"
	bun run build
	@echo "$(GREEN)✓ Build terminé$(NC)"

start: ## Démarre le service en production
	@echo "$(BLUE)Démarrage du service...$(NC)"
	bun run start:prod

dev: ## Démarre le service en mode développement
	@echo "$(BLUE)Démarrage en mode développement...$(NC)"
	bun run start:dev

test: ## Lance les tests unitaires
	@echo "$(BLUE)Exécution des tests...$(NC)"
	bun run test

test-e2e: ## Lance les tests end-to-end
	@echo "$(BLUE)Exécution des tests e2e...$(NC)"
	bun run test:e2e

test-cov: ## Lance les tests avec couverture
	@echo "$(BLUE)Exécution des tests avec couverture...$(NC)"
	bun run test:cov

lint: ## Vérifie le code avec ESLint
	@echo "$(BLUE)Vérification du code...$(NC)"
	bun run lint

format: ## Formate le code avec Prettier
	@echo "$(BLUE)Formatage du code...$(NC)"
	bunx prettier --write "src/**/*.ts" "test/**/*.ts"

clean: ## Nettoie les fichiers générés
	@echo "$(BLUE)Nettoyage...$(NC)"
	rm -rf dist/
	rm -rf node_modules/
	rm -rf coverage/
	@echo "$(GREEN)✓ Nettoyage terminé$(NC)"

# Docker commands
docker-build: ## Build l'image Docker
	@echo "$(BLUE)Construction de l'image Docker...$(NC)"
	docker build -t invoice-service:latest .
	@echo "$(GREEN)✓ Image construite$(NC)"

docker-build-dev: ## Build l'image Docker de développement
	@echo "$(BLUE)Construction de l'image Docker (dev)...$(NC)"
	docker build -f Dockerfile.dev -t invoice-service:dev .
	@echo "$(GREEN)✓ Image dev construite$(NC)"

docker-up: ## Démarre les services Docker (production)
	@echo "$(BLUE)Démarrage des services Docker...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Services démarrés$(NC)"
	@echo "$(YELLOW)Service gRPC: localhost:50051$(NC)"

docker-up-dev: ## Démarre les services Docker (développement)
	@echo "$(BLUE)Démarrage des services Docker (dev)...$(NC)"
	docker-compose -f docker-compose.dev.yml up
	@echo "$(GREEN)✓ Services dev démarrés$(NC)"

docker-down: ## Arrête les services Docker
	@echo "$(BLUE)Arrêt des services Docker...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Services arrêtés$(NC)"

docker-logs: ## Affiche les logs Docker
	docker-compose logs -f invoice-service

docker-ps: ## Liste les containers Docker
	docker-compose ps

docker-clean: ## Nettoie les containers et volumes Docker
	@echo "$(RED)Nettoyage des containers et volumes...$(NC)"
	docker-compose down -v
	docker system prune -f
	@echo "$(GREEN)✓ Nettoyage Docker terminé$(NC)"

# Database commands
db-create: ## Crée la base de données
	@echo "$(BLUE)Création de la base de données...$(NC)"
	createdb invoices_db || echo "Base de données déjà existante"
	@echo "$(GREEN)✓ Base de données prête$(NC)"

db-drop: ## Supprime la base de données
	@echo "$(RED)Suppression de la base de données...$(NC)"
	dropdb invoices_db || echo "Base de données inexistante"

db-reset: db-drop db-create ## Réinitialise la base de données
	@echo "$(GREEN)✓ Base de données réinitialisée$(NC)"

# Testing with grpcurl
grpc-list: ## Liste les services gRPC disponibles
	@echo "$(BLUE)Services gRPC disponibles:$(NC)"
	grpcurl -plaintext localhost:50051 list

grpc-describe: ## Décrit le service InvoiceService
	@echo "$(BLUE)Description du service InvoiceService:$(NC)"
	grpcurl -plaintext localhost:50051 describe invoice.InvoiceService

grpc-test-create: ## Test de création d'une facture via gRPC
	@echo "$(BLUE)Test de création d'une facture...$(NC)"
	grpcurl -plaintext -d '{"customerName": "Test Client", "customerAddress": "123 Rue Test", "issueDate": "2025-01-15", "deliveryDate": "2025-01-15", "items": [{"description": "Test", "quantity": 1, "unitPriceHT": 100, "vatRate": 20}]}' localhost:50051 invoice.InvoiceService/CreateInvoice

grpc-test-list: ## Liste toutes les factures via gRPC
	@echo "$(BLUE)Liste des factures...$(NC)"
	grpcurl -plaintext -d '{}' localhost:50051 invoice.InvoiceService/FindAllInvoices

# Utility commands
setup: install db-create ## Installation complète (dépendances + base de données)
	@echo "$(GREEN)✓ Installation terminée$(NC)"
	@echo "$(YELLOW)Étapes suivantes:$(NC)"
	@echo "  1. Configurer le fichier .env"
	@echo "  2. Lancer 'make dev' pour démarrer en développement"

check: lint test ## Vérifie le code (lint + tests)
	@echo "$(GREEN)✓ Vérifications terminées$(NC)"

deploy-prod: build docker-build docker-up ## Déploie en production
	@echo "$(GREEN)✓ Déploiement terminé$(NC)"

status: ## Affiche le statut des services
	@echo "$(BLUE)Statut des services:$(NC)"
	@if docker-compose ps | grep -q "Up"; then \
		echo "$(GREEN)✓ Services actifs$(NC)"; \
		docker-compose ps; \
	else \
		echo "$(YELLOW)⚠ Aucun service actif$(NC)"; \
	fi

# Version info
version: ## Affiche les versions
	@echo "$(BLUE)Versions:$(NC)"
	@echo "  Node.js:     $$(node --version)"
	@echo "  bun:         $$(bun --version)"
	@echo "  TypeScript:  $$(bunx tsc --version)"
	@echo "  Docker:      $$(docker --version 2>/dev/null || echo 'Non installé')"
