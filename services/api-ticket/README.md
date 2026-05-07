# api-ticket

API REST de tickets (casos) para Indómito Hub: DynamoDB por período MMYYYY + uploads directos a S3 vía URL prefirmada.

## Prerrequisitos

1. Tabla `tickets-{stage}-pri-{region}` (ver `scripts/bootstrap.example.sh`).
2. Parámetro SSM `/pa/{stage}/ticket-table-pk` con valor `APP#INDOMITO_HUB#TIC#<ulid>` — crear con:

   ```bash
   node scripts/init-ticket-pk.mjs --stage dev
   ```

3. Bucket `giras-indomito-{stage}-info` con CORS PUT (ya configurado en bootstrap).

## Deploy

```bash
cd services/api-ticket
AWS_PROFILE=pa-dev npx sls deploy --stage dev --region us-west-2
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/v1/tickets` | Crear ticket |
| GET | `/v1/tickets?periodo=MMYYYY` | Listar por mes |
| GET | `/v1/tickets/{id}?periodo=MMYYYY` | Detalle |
| PUT | `/v1/tickets/{id}?periodo=MMYYYY` | Actualizar (admin o creador) |
| DELETE | `/v1/tickets/{id}?periodo=MMYYYY` | Eliminar (admin o creador) |
| GET | `/v1/tickets/presigned-url` | Upload: `fileName`, `contentType`, opcional `ticketId`; lectura: `key` |
