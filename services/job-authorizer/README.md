# job-authorizer — Authorizer JWT Compartido

Lambda Authorizer centralizado para autenticación y autorización JWT. Compartido por todos los servicios del portal administrativo de Giras Indómito.

**Nombre SLS:** `autorizador` · **Runtime:** Node.js 20.x · **Framework:** Serverless v4

---

## Endpoints

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `POST` | `/v1/autorizador` | `authorizer.authorize` | Validar token JWT |
| `POST` | `/v1/accesos` | `authorizer.generateToken` | Generar token JWT |

---

## Funciones Lambda

### `authorize`
Lambda Authorizer que valida el token JWT enviado en el header `Authorization`. Retorna una política IAM (`Allow` / `Deny`) y un contexto con información del usuario.

**Uso como authorizer en serverless.yml de otros servicios:**
```yaml
# Directamente en el serverless.yml de cada servicio
functions:
  myFunction:
    events:
      - httpApi:
          path: /v1/recurso
          method: GET
          authorizer:
            id: ${cf:autorizador-${self:custom.stage}.AuthorizerId}
            type: request
```

**Contexto inyectado al handler:**
```javascript
event.requestContext.authorizer.lambda.userId  // UUID del usuario
event.requestContext.authorizer.lambda.role    // ROL: ADMIN, STAFF, STUDENT, GUARDIAN
event.requestContext.authorizer.lambda.profile // Perfil de acceso
```

### `generateToken`
Genera un token JWT firmado para un usuario autenticado. Usado internamente por `api-entity` durante el login.

---

## Configuración JWT

| Parámetro | Valor |
|---|---|
| Algoritmo | `HS256` |
| Librería | `jsonwebtoken` |
| Hash de contraseña | `bcryptjs` |
| TTL del authorizer | `0` segundos (sin caché) |
| Secret | AWS Secrets Manager (`SECRET_KEY`) |

> El `resultTtlInSeconds: 0` evita que API Gateway cachee respuestas de autorización, previniendo inconsistencias al cambiar permisos.

---

## Integración con otros servicios

El ARN de la función `authorize` se exporta como output de CloudFormation:

```yaml
resources:
  Outputs:
    authArn:
      Value: !GetAtt [AuthLambdaFunction, Arn]
      Export:
        Name: ${stage}-authArn
```

Los demás servicios referencian el AuthorizerId vía CloudFormation outputs en su `serverless.yml`. El authorizer exporta su ID al deployarse:

```yaml
resources:
  Outputs:
    AuthorizerId:
      Value: !Ref HttpApiAuthorizerAuth
      Export:
        Name: autorizador-${self:custom.stage}-AuthorizerId
```

---

## Roles y permisos

| Rol | Descripción |
|---|---|
| `ADMIN` | Acceso total al sistema |
| `STAFF` | Gestión de programas y contratos |
| `STUDENT` | Lectura de su propio programa |
| `GUARDIAN` | Lectura de información del estudiante |

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `SECRET_KEY` | Nombre del secreto en Secrets Manager con la clave JWT |
| `STAGE` | Entorno de ejecución |

---

## IAM Policies utilizadas

- `lambda-policy-ssm.yml` — Parameter Store
- `lambda-policy-xray.yml` — AWS X-Ray

---

## Flujo de autenticación completo

```
1. Usuario hace login → POST /v1/sesiones/iniciar-sesion (api-entity)
2. api-entity valida credenciales y solicita token → POST /v1/accesos (job-authorizer)
3. job-authorizer genera JWT y lo retorna
4. api-entity retorna JWT al cliente

5. Cliente hace request con token → GET /v1/programas (api-program)
6. API Gateway invoca Lambda Authorizer → authorizer.authorize (job-authorizer)
7. Authorizer valida JWT y retorna Allow/Deny + contexto
8. API Gateway invoca Lambda Handler con contexto del usuario
```

---

## Desarrollo local

```bash
# Desde raíz del proyecto
npm start

# Deploy del servicio (debe deployarse antes que otros servicios)
cd services/job-authorizer
AWS_PROFILE=pa-dev serverless deploy --stage dev --region us-west-2

# Ver logs del authorizer
serverless logs --function auth --stage dev
```

> **Importante:** Este servicio debe deployarse **antes** que los demás, ya que su ARN es referenciado por los otros servicios vía CloudFormation Outputs.

---

**Última actualización:** 2026-02-23
