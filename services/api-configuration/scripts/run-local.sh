#!/bin/bash

# Script para ejecutar el servidor local con configuración de entorno

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}API Configuration - Servidor Local${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Verificar si existe .env
if [ -f .env ]; then
    echo -e "${GREEN}✓ Cargando variables de entorno desde .env${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠ Archivo .env no encontrado${NC}"
    echo -e "${YELLOW}  Copiando .env.example a .env...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}  Por favor configura .env con tus valores antes de continuar${NC}"
    exit 1
fi

# Verificar variables requeridas
if [ -z "$DYNAMODB_CONFIG_TABLE" ]; then
    echo -e "${YELLOW}⚠ DYNAMODB_CONFIG_TABLE no está configurado${NC}"
    exit 1
fi

# Puerto por defecto
PORT=${PORT:-3001}

echo -e "${GREEN}Configuración:${NC}"
echo -e "  Región AWS:      ${AWS_REGION:-us-west-2}"
echo -e "  Perfil AWS:      ${AWS_PROFILE:-pa-dev}"
echo -e "  Tabla Config:    $DYNAMODB_CONFIG_TABLE"
echo -e "  Puerto:          $PORT"
echo ""

echo -e "${GREEN}Iniciando servidor local...${NC}"
echo ""
echo -e "${BLUE}Endpoints disponibles:${NC}"
echo -e "  GET  http://localhost:$PORT/v1/configuracion/global"
echo -e "  POST http://localhost:$PORT/v1/configuracion/global"
echo -e "  GET  http://localhost:$PORT/health"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener el servidor${NC}"
echo ""

# Ejecutar servidor
go run cmd/local-server/main.go
