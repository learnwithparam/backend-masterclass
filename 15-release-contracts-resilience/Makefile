.PHONY: setup dev dev-down test smoke push-db build run-prod logs clean help

help: ## Show this help
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2}'

setup: ## Install local dependencies (for IDE/TypeScript support)
	npm install

dev: ## Start only external dependencies using a separate temporary compose file (for dev testing)
	docker compose -f docker-compose.yml up db redis -d
	@echo "Waiting for database..."
	sleep 5
	npm run db:push

dev-down: ## Stop local dependencies
	docker compose -f docker-compose.yml down -v

test: ## Run integration tests against Testcontainers
	npm run test

smoke: ## Run E2E smoke test (builds + starts all Docker containers, tests with curl)
	@bash scripts/smoke-test.sh

build: ## Build docker images using multi-stage Dockerfiles
	docker compose build

run-prod: ## Run exactly like Production (Full containers for Node.js, DB, and Redis)
	docker compose up -d
	@echo "Waiting for production database to initialize..."
	sleep 5
	npm run db:push
	@echo "Everything is running! Order Service on 3150, Inventory on 4150"

logs: ## Tail logs from production containers
	docker compose logs -f

clean: dev-down ## Remove node_modules, dist, and destroy all docker containers
	rm -rf node_modules dist drizzle
