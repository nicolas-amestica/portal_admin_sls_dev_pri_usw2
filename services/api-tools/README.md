# Herramientas del portal (`api-tools`)

Lambdas HTTP bajo prefijo `/v1/herramientas/` (JWT compartido).

## PDF → Word (jobs asíncronos)

Las rutas viven en `serverless.yml`. El proceso descarga desde S3, convierte con el worker Python `herramientas-worker-py` y marca el resultado en la tabla DynamoDB mantenedor (`pk=TOOLS#PDF_TO_WORD`).

**Deploy:** ejecutar antes `services/api-tools-worker-py` para que exista la export CloudFormation `${stage}-pdf-to-word-worker-arn`.
