.PHONY: setup dev solution test smoke clean db-up db-down db-push db-studio help

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

solution: ## Run the after/ (solution) version
	npm run start:after

test: ## Run integration tests
	npm run test

smoke: ## Run E2E smoke test
	@bash scripts/smoke-test.sh

clean: db-down ## Remove generated files
	rm -rf node_modules dist drizzle

db-up: ## Start Docker services
	docker compose up -d

db-down: ## Stop Docker services
	docker compose down -v

db-push: ## Push schema to database
	npm run db:push

db-studio: ## Open Drizzle Studio
	npm run db:studio
