# CRM Final - Project Makefile
# Usage: make <target>

.PHONY: help up down logs ps build clean install dev dev-frontend dev-backend dev-services proto

# Default target
help:
	@echo "CRM Final - Available Commands"
	@echo ""
	@echo "  Docker Commands:"
	@echo "    make up              - Start all services with Docker"
	@echo "    make down            - Stop all services"
	@echo "    make logs            - View logs (all services)"
	@echo "    make logs-f          - Follow logs (all services)"
	@echo "    make ps              - Show running containers"
	@echo "    make build           - Build all Docker images"
	@echo "    make clean           - Stop and remove all containers, volumes"
	@echo ""
	@echo "  Development Commands:"
	@echo "    make install         - Install dependencies for all projects"
	@echo "    make dev             - Start full dev environment (requires tmux)"
	@echo "    make dev-simple      - Start frontend + backend only"
	@echo "    make dev-frontend    - Start frontend only"
	@echo "    make dev-backend     - Start backend only"
	@echo ""
	@echo "  Database Commands:"
	@echo "    make db-up           - Start PostgreSQL only"
	@echo "    make db-down         - Stop PostgreSQL"
	@echo "    make db-reset        - Reset database (drop and recreate)"
	@echo ""
	@echo "  Proto Commands:"
	@echo "    make proto           - Generate protobuf/gRPC files"
	@echo "    make proto-lint      - Lint proto files with Buf"
	@echo "    make proto-logs      - Show proto generator logs"
	@echo ""
	@echo "  Utility Commands:"
	@echo "    make lint            - Run linters on all projects"
	@echo "    make test            - Run tests on all projects"

# ============================================
# DOCKER COMMANDS
# ============================================

up:
	@echo "Starting all services..."
	docker-compose up -d
	@echo ""
	@echo "Services started! Access:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:4000"
	@echo "  API Docs: http://localhost:4000/docs"

down:
	@echo "Stopping all services..."
	docker-compose down

logs:
	docker-compose logs

logs-f:
	docker-compose logs -f

ps:
	docker-compose ps

build:
	@echo "Building all Docker images..."
	docker-compose build

clean:
	@echo "Cleaning up..."
	docker-compose down -v --remove-orphans
	docker system prune -f

# ============================================
# DATABASE COMMANDS
# ============================================

db-up:
	docker-compose up -d postgres-main
	@echo "PostgreSQL started on port 5432"

db-down:
	docker-compose stop postgres-main

db-reset:
	docker-compose stop postgres-main
	docker-compose rm -f postgres-main
	docker volume rm crm_final_postgres_main_data || true
	docker-compose up -d postgres-main
	@echo "Database reset complete"

# ============================================
# DEVELOPMENT COMMANDS
# ============================================

install:
	@echo "Installing dependencies..."
	@echo ">> Backend"
	cd backend && npm install
	@echo ">> Frontend"
	cd frontend && npm install
	@echo ""
	@echo "Dependencies installed!"

dev-frontend:
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

dev-backend:
	@echo "Starting backend development server..."
	@echo "Using existing PostgreSQL on port 5433"
	cd backend && npm run start:4000

dev-simple:
	@echo "Starting simple dev environment..."
	@echo "This requires two terminals or use 'make dev' with tmux"
	@echo ""
	@echo "Terminal 1: make dev-backend"
	@echo "Terminal 2: make dev-frontend"
	@echo ""
	@echo "Or run: make db-up && (cd backend && npm run start:4000 &) && cd frontend && npm run dev"

# Start EVERYTHING (17 microservices + frontend)
start:
	@echo "Starting CRM Full Stack..."
	@echo ""
	@echo "Step 1: Building and starting 17 microservices (Docker)..."
	docker-compose -f docker-compose.services.yml up -d --build
	@echo ""
	@echo "Step 2: Starting Frontend..."
	@echo ""
	@echo "Frontend: http://localhost:3000"
	@echo "Keycloak: http://localhost:8080"
	@echo ""
	@echo "Press Ctrl+C to stop frontend (services keep running)"
	@echo "Use 'make stop' to stop everything"
	@echo ""
	cd frontend && npm run dev

# Stop everything
stop:
	@echo "Stopping all services..."
	docker-compose -f docker-compose.services.yml down
	@pkill -f "next dev" || true
	@echo "All services stopped"

# Start only microservices (Docker)
start-services:
	@echo "Starting 17 microservices..."
	docker-compose -f docker-compose.services.yml up -d --build
	@echo "Services started! Use 'docker-compose -f docker-compose.services.yml logs -f' to see logs"

# Start only frontend (no microservices)
start-frontend:
	@echo "Starting Frontend only..."
	@echo "Frontend: http://localhost:3000"
	cd frontend && npm run dev

# Full dev environment with tmux
dev:
	@if ! command -v tmux &> /dev/null; then \
		echo "tmux is not installed. Please install it or use 'make start'"; \
		exit 1; \
	fi
	@echo "Starting full development environment with tmux..."
	@./scripts/dev.sh

# ============================================
# UTILITY COMMANDS
# ============================================

proto:
	@echo "Generating protobuf files with Buf..."
	@echo "This will restart the proto-generator container"
	docker-compose restart proto-generator
	docker-compose logs proto-generator
	@echo "Protobuf generation complete"

proto-lint:
	@echo "Linting proto files..."
	cd proto && buf lint

proto-logs:
	docker-compose logs -f proto-generator

lint:
	@echo "Running linters..."
	cd backend && npm run lint
	cd frontend && npm run lint
	@echo "Linting complete"

test:
	@echo "Running tests..."
	cd backend && npm run test
	@echo "Tests complete"

# ============================================
# SERVICE-SPECIFIC COMMANDS
# ============================================

up-backend:
	docker-compose up -d postgres-main backend

up-frontend:
	docker-compose up -d frontend

up-services:
	docker-compose up -d \
		service-activites \
		service-clients \
		service-commerciaux \
		service-commission \
		service-contrats \
		service-dashboard \
		service-documents \
		service-email \
		service-factures \
		service-logistics \
		service-notifications \
		service-organisations \
		service-payments \
		service-products \
		service-referentiel \
		service-relance \
		service-users
