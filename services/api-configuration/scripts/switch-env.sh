#!/bin/bash

# Script para cambiar entre entornos (dev/prod)

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

show_usage() {
    echo -e "${BLUE}Uso:${NC}"
    echo "  ./scripts/switch-env.sh [dev|prod]"
    echo ""
    echo -e "${BLUE}Ejemplos:${NC}"
    echo "  ./scripts/switch-env.sh dev   # Cambiar a entorno de desarrollo"
    echo "  ./scripts/switch-env.sh prod  # Cambiar a entorno de producción"
}

if [ $# -eq 0 ]; then
    echo -e "${RED}Error: Debes especificar el entorno (dev o prod)${NC}"
    echo ""
    show_usage
    exit 1
fi

ENV=$1

case $ENV in
    dev)
        SOURCE_FILE=".env.dev"
        ENV_NAME="Desarrollo"
        ;;
    prod)
        SOURCE_FILE=".env.prod"
        ENV_NAME="Producción"
        ;;
    *)
        echo -e "${RED}Error: Entorno inválido '$ENV'${NC}"
        echo -e "${YELLOW}Los entornos válidos son: dev, prod${NC}"
        exit 1
        ;;
esac

cd "$PROJECT_DIR"

if [ ! -f "$SOURCE_FILE" ]; then
    echo -e "${RED}Error: Archivo $SOURCE_FILE no encontrado${NC}"
    exit 1
fi

# Crear backup del .env actual si existe
if [ -f .env ]; then
    BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env "$BACKUP_FILE"
    echo -e "${YELLOW}✓ Backup creado: $BACKUP_FILE${NC}"
fi

# Copiar archivo de entorno
cp "$SOURCE_FILE" .env

echo -e "${GREEN}════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Entorno cambiado a: $ENV_NAME${NC}"
echo -e "${GREEN}════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Configuración activa:${NC}"
cat .env | grep -v '^#' | grep -v '^$'
echo ""
echo -e "${YELLOW}Recuerda reiniciar el servidor si está ejecutándose${NC}"
