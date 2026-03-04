.PHONY: setup dev worker solution solution-worker test smoke clean db-up db-down db-push db-studio help

help: ## Show this help
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2}'

setup: db-up ## Install dependencies and start database
	npm install
	@echo "Waiting for database to be ready..."
	sleep 5
	npm run db:push

dev: db-up ## Run the dev server (starts Docker + DB automatically)
	@echo "Waiting for database to be ready..."
	@sleep 3
	@npm run db:push
	npm run start:before

worker: ## Run the starting code Worker (before hook)
	npm run worker:before

solution: ## Run the completed code API (after hook)
	npm run start:after

solution-worker: ## Run the completed code Worker (after hook)
	npm run worker:after

test: ## Run tests for the module
	npm run test

smoke: ## Run E2E smoke test (starts real server + worker, tests with curl)
	@bash scripts/smoke-test.sh

clean: db-down ## Remove node_modules, built files, and stop docker
	rm -rf node_modules dist drizzle

db-up: ## Start PostgreSQL and Redis via Docker Compose
	docker compose up -d

db-down: ## Stop PostgreSQL/Redis and remove volumes
	docker compose down -v

db-push: ## Push drizzle schema to the database
	npm run db:push

db-studio: ## Inspect the database UI using Drizzle Studio
	npm run db:studio
