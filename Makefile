.PHONY: help build start stop restart logs clean test backend-dev frontend-dev migrate

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	docker-compose build

start: ## Start all services
	docker-compose up -d

stop: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

clean: ## Remove all containers, volumes, and images
	docker-compose down -v --rmi all

test: ## Run all tests
	cd backend && go test ./...
	cd frontend && npm test

backend-dev: ## Run backend in development mode
	cd backend && go run cmd/server/main.go

frontend-dev: ## Run frontend in development mode
	cd frontend && npm start

backend-build: ## Build backend binary
	cd backend && go build -o bin/server cmd/server/main.go

frontend-build: ## Build frontend for production
	cd frontend && npm run build

migrate: ## Run database migrations
	cd backend && go run cmd/server/main.go migrate

lint-backend: ## Lint backend code
	cd backend && golangci-lint run

lint-frontend: ## Lint frontend code
	cd frontend && npm run lint

format-backend: ## Format backend code
	cd backend && go fmt ./...

format-frontend: ## Format frontend code
	cd frontend && npm run format

setup: ## Initial setup (install dependencies)
	cd backend && go mod download
	cd frontend && npm install

docker-network: ## Create Docker network for Traefik
	docker network create web || true

prod-start: docker-network ## Start production environment
	docker-compose -f docker-compose.prod.yml up -d

prod-stop: ## Stop production environment
	docker-compose -f docker-compose.prod.yml down

prod-logs: ## Show production logs
	docker-compose -f docker-compose.prod.yml logs -f

backup-db: ## Backup PostgreSQL database
	docker-compose exec postgres pg_dump -U dockermgr dockermanager > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore-db: ## Restore PostgreSQL database (usage: make restore-db FILE=backup.sql)
	docker-compose exec -T postgres psql -U dockermgr dockermanager < $(FILE)

health: ## Check health of all services
	@echo "Checking backend health..."
	@curl -f http://localhost:8080/health || echo "Backend is not healthy"
	@echo "\nChecking PostgreSQL..."
	@docker-compose exec postgres pg_isready -U dockermgr || echo "PostgreSQL is not ready"
	@echo "\nChecking Redis..."
	@docker-compose exec redis redis-cli ping || echo "Redis is not responding"
