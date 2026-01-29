.PHONY: build clean deploy test install

# Variables
GOOS := linux
GOARCH := arm64
BIN_DIR := bin
CMD_DIR := cmd

# Comandos disponibles
FUNCTIONS := get-global-config update-global-config

# Build all Lambda functions
build: clean install
	@echo "Building Lambda functions for ARM64..."
	@mkdir -p $(BIN_DIR)
	@for func in $(FUNCTIONS); do \
		echo "Building $$func..."; \
		GOOS=$(GOOS) GOARCH=$(GOARCH) go build -tags lambda.norpc -ldflags="-s -w" -o $(BIN_DIR)/bootstrap $(CMD_DIR)/$$func/main.go; \
		cd $(BIN_DIR) && zip $$func.zip bootstrap && rm bootstrap && cd ..; \
		echo "✓ $$func.zip created"; \
	done
	@echo "Build completed successfully!"

# Install dependencies
install:
	@echo "Installing Go dependencies..."
	@go mod download
	@go mod tidy
	@echo "Dependencies installed!"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BIN_DIR)
	@echo "Clean completed!"

# Deploy with Serverless Framework
deploy: build
	@echo "Deploying to AWS..."
	@serverless deploy --verbose

# Deploy to specific stage
deploy-stage: build
	@echo "Deploying to stage $(STAGE)..."
	@serverless deploy --stage $(STAGE) --verbose

# Remove deployment
remove:
	@echo "Removing deployment..."
	@serverless remove --verbose

# Run tests
test:
	@echo "Running tests..."
	@go test -v ./...

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	@go test -v -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Format code
fmt:
	@echo "Formatting code..."
	@go fmt ./...
	@echo "Code formatted!"

# Lint code
lint:
	@echo "Linting code..."
	@golangci-lint run ./...

# Local development - build without zip
build-local:
	@echo "Building for local development..."
	@mkdir -p $(BIN_DIR)
	@for func in $(FUNCTIONS); do \
		echo "Building $$func..."; \
		go build -o $(BIN_DIR)/$$func $(CMD_DIR)/$$func/main.go; \
	done
	@echo "Local build completed!"

# Switch to development environment
env-dev:
	@./scripts/switch-env.sh dev

# Switch to production environment
env-prod:
	@./scripts/switch-env.sh prod

# Show current environment configuration
env-show:
	@echo "Current environment configuration:"
	@if [ -f .env ]; then \
		cat .env | grep -v '^#' | grep -v '^$$'; \
	else \
		echo "No .env file found. Run 'make env-dev' or 'make env-prod'"; \
	fi

# Run local server
run-local:
	@echo "Starting local development server..."
	@echo "Server will be available at http://localhost:3001"
	@echo ""
	@echo "Endpoints:"
	@echo "  GET  http://localhost:3001/v1/configuracion/global"
	@echo "  POST http://localhost:3001/v1/configuracion/global"
	@echo "  GET  http://localhost:3001/health"
	@echo ""
	@if [ -f .env ]; then \
		export $$(cat .env | grep -v '^#' | xargs) && go run $(CMD_DIR)/local-server/main.go; \
	else \
		go run $(CMD_DIR)/local-server/main.go; \
	fi

# Run local server with custom port
run-local-port:
	@echo "Starting local development server on port $(PORT)..."
	@if [ -f .env ]; then \
		export $$(cat .env | grep -v '^#' | xargs) && PORT=$(PORT) go run $(CMD_DIR)/local-server/main.go; \
	else \
		PORT=$(PORT) go run $(CMD_DIR)/local-server/main.go; \
	fi

# Test GET endpoint locally with mock event
test-local-get:
	@echo "Testing GET endpoint with mock event..."
	@DYNAMODB_CONFIG_TABLE=$(shell echo $$DYNAMODB_CONFIG_TABLE) \
		go run $(CMD_DIR)/get-global-config/main.go < test/events/get-config.json

# Test POST endpoint locally with mock event
test-local-post:
	@echo "Testing POST endpoint with mock event..."
	@DYNAMODB_CONFIG_TABLE=$(shell echo $$DYNAMODB_CONFIG_TABLE) \
		go run $(CMD_DIR)/update-global-config/main.go < test/events/update-config.json

# Help
help:
	@echo "Available commands:"
	@echo ""
	@echo "Build & Deploy:"
	@echo "  make build          - Build all Lambda functions for ARM64"
	@echo "  make install        - Install Go dependencies"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make deploy         - Build and deploy to AWS"
	@echo "  make deploy-stage   - Build and deploy to specific stage (STAGE=dev|prod)"
	@echo "  make remove         - Remove deployment from AWS"
	@echo ""
	@echo "Environment Management:"
	@echo "  make env-dev        - Switch to development environment (.env.dev)"
	@echo "  make env-prod       - Switch to production environment (.env.prod)"
	@echo "  make env-show       - Show current environment configuration"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run tests"
	@echo "  make test-coverage  - Run tests with coverage report"
	@echo ""
	@echo "Local Development:"
	@echo "  make run-local      - Run local HTTP server on port 3001"
	@echo "  make run-local-port - Run local server on custom port (PORT=3002)"
	@echo "  make test-local-get - Test GET handler with mock event"
	@echo "  make test-local-post- Test POST handler with mock event"
	@echo "  make build-local    - Build for local development"
	@echo ""
	@echo "Code Quality:"
	@echo "  make fmt            - Format code"
	@echo "  make lint           - Lint code"
	@echo ""
	@echo "  make help           - Show this help message"
