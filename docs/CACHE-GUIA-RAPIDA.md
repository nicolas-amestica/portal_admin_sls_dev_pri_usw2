# Guía Rápida: Testing y Deploy del Caché

## ⚡ Quick Start

### 1. Testing Local (5 minutos)

```bash
# Terminal 1: Iniciar serverless-offline
cd services/api-program
serverless offline --stage dev

# Terminal 2: Ejecutar tests
cd ../..
./scripts/test-cache-local.sh
```

**Qué buscar en los logs:**
- ✅ Primera request: `CACHE_MISS`
- ✅ Segunda request: `CACHE_HIT`
- ✅ Duración reducida en cache hits
- ✅ `CACHE_STATS` con hit rate incrementando

---

### 2. Deploy a DEV (10 minutos)

```bash
# Desplegar api-program
cd services/api-program
serverless deploy --stage dev --verbose

# Desplegar api-maintainer
cd ../api-maintainer
serverless deploy --stage dev --verbose
```

---

### 3. Verificar en CloudWatch (5 minutos)

```bash
# Ver logs en tiempo real
aws logs tail /aws/lambda/programas-dev-get_program_v1 \
  --follow \
  --profile pa-dev \
  --region us-west-2
```

**Buscar en logs:**
- `CACHE_HIT` / `CACHE_MISS`
- `CACHE_DETAILED_STATS`
- Hit rate >60% después de 1 hora

---

## 📊 Métricas Esperadas

### Testing Local

| Métrica | Primera Request | Segunda Request |
|---------|----------------|-----------------|
| Status | `CACHE_MISS` | `CACHE_HIT` |
| Duración | 60-100ms | 5-10ms |
| Hit Rate | 0% | 50%+ |

### Producción (después de 1 hora)

| Endpoint | Hit Rate Objetivo | Reducción Latencia |
|----------|-------------------|--------------------|
| get-program-v1 | >60% | 85-90% |
| get-programs-view-v1 | >60% | 80-90% |
| get-banks-v1 | >70% | 90-95% |

---

## 🐛 Troubleshooting Rápido

### Problema: "Module not found: libs/cache"

**Solución:**
```bash
# Verificar que existe el directorio
ls -la libs/cache/

# Si no existe, los archivos están en el proyecto
# Verifica en: libs/cache/
```

### Problema: Hit rate muy bajo (<30%)

**Causas comunes:**
1. Cold starts frecuentes → Normal en desarrollo
2. TTL muy corto → Aumentar en `libs/cache/cache-keys.js`
3. Patrones de acceso diferentes → Normal si cada request pide datos distintos

### Problema: Errores al desplegar

```bash
# Limpiar build anterior
rm -rf .serverless/

# Re-desplegar
serverless deploy --stage dev --verbose
```

---

## 📈 Monitoreo en CloudWatch

### CloudWatch Logs Insights - Hit Rate

```sql
fields @timestamp
| filter @message like /CACHE_HIT/ or @message like /CACHE_MISS/
| stats count(*) as total,
        sum(case when @message like /CACHE_HIT/ then 1 else 0 end) as hits,
        sum(case when @message like /CACHE_MISS/ then 1 else 0 end) as misses
| extend hitRate = (hits / total) * 100
```

### CloudWatch Logs Insights - Cache Stats

```sql
fields @timestamp, @message
| filter @message like /CACHE_DETAILED_STATS/
| sort @timestamp desc
| limit 20
```

---

## ✅ Checklist de Validación

### Testing Local
- [ ] serverless-offline inicia sin errores
- [ ] Primera request retorna 200 OK
- [ ] Logs muestran `CACHE_MISS`
- [ ] Segunda request retorna 200 OK
- [ ] Logs muestran `CACHE_HIT`
- [ ] Duración reducida en segunda request

### Deploy DEV
- [ ] Deploy completado sin errores
- [ ] Endpoint responde en AWS
- [ ] CloudWatch muestra logs de caché
- [ ] Hit rate >0% después de 10 requests

### Performance
- [ ] Latencia reducida 70-85%
- [ ] Sin errores nuevos en logs
- [ ] Respuestas son correctas

---

## 🎯 Próximo Paso

Una vez verificado el caché en DEV:

```bash
# Monitorear 24-48 horas
# Luego documentar resultados y continuar con:
# - Extender caché a más handlers
# - O continuar con Punto 5 del plan (Separar lógica de negocio)
```

---

## 📚 Documentación Completa

Ver [CACHE-IMPLEMENTACION.md](./CACHE-IMPLEMENTACION.md) para:
- Detalles técnicos completos
- Troubleshooting avanzado
- Optimizaciones futuras
- ROI detallado
