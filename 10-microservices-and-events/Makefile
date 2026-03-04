.PHONY: setup dev order-service inventory-service test smoke clean db-up db-down db-push help

help: ## Show this help
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2}'

setup: db-up ## Install dependencies and start database + Redis
	npm install
	@echo "Waiting for database to be ready..."
	sleep 5
	npm run db:push

dev: db-up ## Run the dev server (starts Docker + DB automatically)
	@echo "Waiting for database to be ready..."
	@sleep 3
	@npm run db:push
	npm run start:before

order-service: ## Run the Order Microservice (port 3000)
	npm run start:order-service

inventory-service: ## Run the Inventory Microservice (port 4000)
	npm run start:inventory-service

test: ## Run integration tests for the event-driven system
	npm run test

smoke: ## Run E2E smoke test (starts both microservices, tests with curl)
	@bash scripts/smoke-test.sh

clean: db-down ## Remove node_modules, built files, and stop docker
	rm -rf node_modules dist drizzle

db-up: ## Start PostgreSQL and Redis via Docker Compose
	docker compose up -d

db-down: ## Stop PostgreSQL/Redis and remove volumes
	docker compose down -v

db-push: ## Push drizzle schema to the database
	npm run db:push
