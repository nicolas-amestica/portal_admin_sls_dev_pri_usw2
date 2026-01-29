#!/bin/bash

# Ejemplos de requests cURL para testing local
# Asegúrate de tener el servidor local ejecutándose: make run-local

BASE_URL="http://localhost:3001"

echo "======================================"
echo "API Configuration - Ejemplos cURL"
echo "======================================"
echo ""

# Health check
echo "1. Health Check"
echo "curl -X GET $BASE_URL/health"
curl -X GET "$BASE_URL/health"
echo -e "\n\n"

# GET configuración
echo "2. GET - Obtener configuración global"
echo "curl -X GET $BASE_URL/v1/configuracion/global"
curl -X GET "$BASE_URL/v1/configuracion/global" | jq .
echo -e "\n\n"

# POST configuración válida
echo "3. POST - Actualizar configuración (válida)"
echo "curl -X POST $BASE_URL/v1/configuracion/global -H 'Content-Type: application/json' -d '{...}'"
curl -X POST "$BASE_URL/v1/configuracion/global" \
  -H "Content-Type: application/json" \
  -d '{
    "ivaRateCrew": 0.1525,
    "ivaRateService": 0.19
  }' | jq .
echo -e "\n\n"

# POST configuración inválida (fuera de rango)
echo "4. POST - Actualizar configuración (inválida - fuera de rango)"
echo "curl -X POST $BASE_URL/v1/configuracion/global -H 'Content-Type: application/json' -d '{...}'"
curl -X POST "$BASE_URL/v1/configuracion/global" \
  -H "Content-Type: application/json" \
  -d '{
    "ivaRateCrew": 1.5,
    "ivaRateService": 0.19
  }' | jq .
echo -e "\n\n"

# Verificar cambios
echo "5. GET - Verificar cambios"
echo "curl -X GET $BASE_URL/v1/configuracion/global"
curl -X GET "$BASE_URL/v1/configuracion/global" | jq .
echo -e "\n\n"

echo "======================================"
echo "Tests completados"
echo "======================================"
