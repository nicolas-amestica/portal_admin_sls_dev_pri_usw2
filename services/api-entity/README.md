# api-entity — Usuarios, Sesiones y Permisos

Servicio de gestión de usuarios, autenticación y control de acceso para el portal administrativo de Giras Indómito.

**Nombre SLS:** `usuarios` · **Runtime:** Node.js 20.x · **Framework:** Serverless v4

---

## Endpoints

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `POST` | `/v1/sesiones/iniciar-sesion` | `login-v1` | Login de usuario con email y contraseña |
| `POST` | `/v1/sesiones/recuperar-clave` | `forgot-password-v1` | Solicitar recuperación de contraseña por email |
| `POST` | `/v1/sesiones/restablecer-clave` | `reset-password-v1` | Restablecer contraseña con token de recuperación |
| `GET` | `/v1/iam/accesos/aplicaciones/GI/user` | `get-access-v1` | Obtener permisos del usuario autenticado |

---

## Funciones Lambda

### `login-v1`
Autentica al usuario con email y contraseña. Valida credenciales contra DynamoDB (contraseña hasheada con bcryptjs) y retorna un token JWT firmado.

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "contraseña"
}
```

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Iniciar sesión." },
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "uuid-v7",
    "role": "STUDENT | GUARDIAN | STAFF | ADMIN"
  }
}
```

### `forgot-password-v1`
Genera un token de recuperación y envía un email con instrucciones para restablecer la contraseña.

**Body:**
```json
{
  "email": "usuario@example.com"
}
```

### `reset-password-v1`
Valida el token de recuperación y actualiza la contraseña del usuario. El token tiene tiempo de expiración.

**Body:**
```json
{
  "token": "token-de-recuperacion",
  "newPassword": "nueva-contraseña"
}
```

### `get-access-v1`
Retorna el perfil de permisos del usuario autenticado para la aplicación `GI` (Giras Indómito).

**Query Parameters:**
- `userId`: ID del usuario (opcional, usa el del token JWT)

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Obtener accesos." },
  "data": {
    "userId": "uuid-v7",
    "role": "ADMIN",
    "permissions": ["programs.read", "programs.write", "payments.read"]
  }
}
```

---

## Modelo de datos (DynamoDB)

**Tabla usuarios:** `users-<stage>-pri-<shortRegion>`

```javascript
{
  pk: "USR#4f7cb502-4256-11ec-81d3-0242ac130003",   // Constante
  sk: "USR#<uuid-v7>",
  id: "uuid-v7",
  email: "usuario@example.com",
  password: "bcrypt-hash",
  firstName: "Juan",
  lastName: "Pérez",
  role: "STUDENT | GUARDIAN | STAFF | ADMIN",
  status: "ACTIVE | INACTIVE",
  resetToken: "token-recuperacion",
  resetTokenExpiry: "2025-01-20T15:00:00Z",
  createdAt: "2025-01-15T09:30:00Z",
  updatedAt: "2025-02-01T10:00:00Z"
}
```

**Tabla configuración:** `config-<stage>-pri-<shortRegion>`

Usada para obtener perfiles de acceso y permisos por rol.

---

## Roles disponibles

| Rol | Descripción |
|---|---|
| `STUDENT` | Estudiante — acceso de solo lectura a su programa |
| `GUARDIAN` | Apoderado — acceso a información del estudiante |
| `STAFF` | Personal — gestión de programas |
| `ADMIN` | Administrador — acceso total |

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DYNAMODB_USER_TABLE` | Tabla DynamoDB de usuarios |
| `DYNAMODB_CONFIG_TABLE` | Tabla DynamoDB de configuración |
| `SECRET_KEY` | Clave del secreto JWT |
| `EMAIL_SECRET_KEY` | Clave del secreto con credenciales de email |
| `STAGE` | Entorno de ejecución |

---

## IAM Policies utilizadas

- `lambda-policy-xray.yml` — AWS X-Ray
- `lambda-policy-dynamodb-user.yml` — DynamoDB (tabla usuarios)
- `lambda-policy-dynamodb-config.yml` — DynamoDB (tabla configuración)
- `lambda-policy-ssm.yml` — Parameter Store
- `lambda-policy-secretsmanager.yml` — Secrets Manager
- `lambda-policy-cloudwatch.yml` — CloudWatch

---

## Autenticación JWT

- El token se genera con `jsonwebtoken`
- La contraseña se almacena hasheada con `bcryptjs`
- El token contiene: `userId`, `role`, `profile`
- El authorizer compartido (`job-authorizer`) valida el token en rutas protegidas

---

## Desarrollo local

```bash
# Desde raíz del proyecto
npm start

# Deploy del servicio
cd services/api-entity
AWS_PROFILE=pa-dev serverless deploy --stage dev --region us-west-2
```

---

**Última actualización:** 2026-02-23
