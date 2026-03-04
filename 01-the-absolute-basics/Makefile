.PHONY: setup dev test smoke clean help

help: ## Show this help
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2}'

setup: ## Install dependencies
	npm install

dev: ## Run the starting code (before hook)
	npm run start:before

solution: ## Run the completed code (after hook)
	npm run start:after

test: ## Run tests for the module
	npm run test

smoke: ## Run E2E smoke test (starts real server, tests with curl)
	@bash scripts/smoke-test.sh

clean: ## Remove node_modules and built files
	rm -rf node_modules dist
