.PHONY: build clean deploy test install fmt lint

# Variables
GOOS    := linux
GOARCH  := arm64
BIN_DIR := bin
CMD_DIR := cmd

# Funciones Lambda
FUNCTIONS := send-notification

# Compilar todas las funciones Lambda para ARM64
build: clean install
	@echo "Compilando funciones Lambda para ARM64..."
	@mkdir -p $(BIN_DIR)
	@for func in $(FUNCTIONS); do \
		echo "Compilando $$func..."; \
		GOOS=$(GOOS) GOARCH=$(GOARCH) go build -tags lambda.norpc -ldflags="-s -w" -o $(BIN_DIR)/bootstrap $(CMD_DIR)/$$func/main.go; \
		cd $(BIN_DIR) && zip $$func.zip bootstrap && rm bootstrap && cd ..; \
		echo "✓ $$func.zip generado"; \
	done
	@echo "Build completado!"

# Instalar dependencias
install:
	@echo "Instalando dependencias Go..."
	@go mod download
	@go mod tidy
	@echo "Dependencias instaladas!"

# Limpiar artefactos
clean:
	@echo "Limpiando artefactos..."
	@rm -rf $(BIN_DIR)
	@echo "Limpieza completada!"

# Deploy con Serverless Framework
deploy: build
	@echo "Desplegando en AWS..."
	@serverless deploy --verbose

# Deploy a stage específico
deploy-stage: build
	@echo "Desplegando al stage $(STAGE)..."
	@serverless deploy --stage $(STAGE) --verbose

# Eliminar deployment
remove:
	@echo "Eliminando deployment..."
	@serverless remove --verbose

# Tests unitarios
test:
	@echo "Ejecutando tests..."
	@go test -v ./...

# Tests con cobertura
test-coverage:
	@echo "Ejecutando tests con cobertura..."
	@go test -v -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Reporte de cobertura generado: coverage.html"

# Formatear código
fmt:
	@echo "Formateando código..."
	@go fmt ./...
	@echo "Código formateado!"

# Linting
lint:
	@echo "Ejecutando linter..."
	@golangci-lint run ./...

# Ayuda
help:
	@echo "Comandos disponibles:"
	@echo ""
	@echo "  make build          - Compila las funciones Lambda para ARM64"
	@echo "  make install        - Instala dependencias Go"
	@echo "  make clean          - Limpia artefactos de build"
	@echo "  make deploy         - Compila y despliega en AWS"
	@echo "  make deploy-stage   - Compila y despliega en stage específico (STAGE=dev|prd)"
	@echo "  make remove         - Elimina el deployment de AWS"
	@echo "  make test           - Ejecuta tests"
	@echo "  make test-coverage  - Ejecuta tests con reporte de cobertura"
	@echo "  make fmt            - Formatea el código"
	@echo "  make lint           - Ejecuta el linter"
