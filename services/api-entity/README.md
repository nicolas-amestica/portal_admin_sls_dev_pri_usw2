# api-entity — Usuarios, Sesiones y Permisos

Servicio de gestión de usuarios, autenticación y control de acceso para el portal administrativo de Giras Indómito.

**Nombre SLS:** `usuarios` · **Runtime:** Node.js 20.x · **Framework:** Serverless v4

---

## Endpoints

| Método | Ruta | Handler | Descripción |
|---|---|---|---|
| `POST` | `/v1/sesiones/iniciar-sesion` | `login-v1` | Login con RUT y contraseña |
| `POST` | `/v1/sesiones/iniciar-sesion-google` | `google-login-v1` | Login con Google Identity Services (OAuth2) |
| `POST` | `/v1/sesiones/recuperar-clave` | `forgot-password-v1` | Solicitar recuperación de contraseña por RUT |
| `POST` | `/v1/sesiones/restablecer-clave` | `reset-password-v1` | Restablecer contraseña con token de recuperación |
| `GET` | `/v1/iam/accesos/aplicaciones/GI/user` | `get-access-v1` | Obtener permisos del usuario autenticado |

---

## Funciones Lambda

### `login-v1`
Autentica al usuario con su RUT (`username`) y contraseña. Valida credenciales contra DynamoDB (contraseña hasheada con bcryptjs) y retorna un token JWT firmado.

**Body:**
```json
{
  "username": "12345678-9",
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
    "role": "ADMIN | CLIENTE"
  }
}
```

> El campo `username` corresponde al **RUT** del usuario (formato `12345678-9`).

### `google-login-v1`
Autentica al usuario mediante un ID token emitido por Google Identity Services. Valida el token contra el endpoint `tokeninfo` de Google, busca al usuario registrado por email en DynamoDB y retorna el mismo formato JWT que el login tradicional.

**Requisito:** El usuario debe estar previamente registrado en el sistema. El email de su cuenta de Google debe coincidir con el registrado en DynamoDB.

**Body:**
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta:** Mismo formato que `login-v1` — retorna usuario + token JWT + accesos + configuración.

**Variable de entorno requerida:** `GOOGLE_CLIENT_ID` (Client ID de Google Cloud Console).

---

### `forgot-password-v1`
Genera un token de recuperación y envía un email con instrucciones para restablecer la contraseña.

**Body:**
```json
{
  "rut": "12345678-9"
}
```

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Recuperar clave." },
  "data": { "message": "Email de recuperación enviado." }
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

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Restablecer clave." },
  "data": { "message": "Contraseña actualizada correctamente." }
}
```

### `get-access-v1`
Retorna el perfil de permisos y el menú de navegación del usuario autenticado para la aplicación `GI` (Giras Indómito).

**Query Parameters:**
- `userId` (requerido): ID del usuario

```
GET /v1/iam/accesos/aplicaciones/GI/user?userId=<uuid-v7>
```

**Respuesta:**
```json
{
  "state": true,
  "metadata": { "statusCode": 200, "action": "Obtener accesos." },
  "data": {
    "userId": "uuid-v7",
    "role": "ADMIN",
    "menu": [
      {
        "label": "Programas",
        "route": "/app/gestion-administrativa/programas-lista",
        "permissions": ["read", "write"]
      }
    ]
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
  rut: "12345678-9",
  password: "bcrypt-hash",
  firstName: "Juan",
  lastName: "Pérez",
  role: "ADMIN | CLIENTE",
  status: "ACTIVE | INACTIVE",
  resetToken: "token-recuperacion",
  resetTokenExpiry: "2025-01-20T15:00:00Z",
  createdAt: "2025-01-15T09:30:00Z",
  updatedAt: "2025-02-01T10:00:00Z"
}
```

**Tabla configuración:** `config-<stage>-pri-<shortRegion>`

Usada para obtener perfiles de acceso y menú de navegación por rol.

---

## Roles disponibles

| Rol | Descripción | Rutas Angular |
|---|---|---|
| `ADMIN` | Administrador — acceso total | `/app/gestion-administrativa/*`, `/app/analytics/*`, `/app/configuracion` |
| `CLIENTE` | Pasajero / Apoderado — portal cliente | `/app/cliente/*` |

> Los roles son controlados por el `roleGuard` del portal administrativo Angular.

---

## Flujos de autenticación (frontend → backend)

### Flujo 1: Login tradicional (RUT + contraseña)

```
1. Usuario ingresa RUT + contraseña en /auth/login (Angular)
2. AuthService → POST /v1/sesiones/iniciar-sesion
3. Backend valida RUT y contraseña (bcrypt)
4. Backend retorna JWT
5. Angular almacena JWT en localStorage
6. authInterceptor inyecta Authorization: Bearer <token> en cada request
7. AuthService → GET /v1/iam/accesos/aplicaciones/GI/user?userId=<id>
8. Backend retorna menú y permisos según rol
9. Angular navega según rol (ADMIN → /app/inicio, CLIENTE → /app/cliente/inicio)
```

### Flujo 2: Login con Google (OAuth2)

```
1. Usuario hace clic en "Continuar con Google" en /auth/login (Angular)
2. Google Identity Services (GIS) muestra popup de selección de cuenta
3. GIS retorna un credential (ID token) al callback del componente
4. AuthStore.googleLogin(credential) → AuthService → POST /v1/sesiones/iniciar-sesion-google
5. Backend valida ID token contra Google tokeninfo (verifica audience + email_verified)
6. Backend busca usuario en DynamoDB por email (scan con filtro)
7. Backend verifica que el usuario esté activo y tenga permisos
8. Backend genera JWT de la aplicación (mismo formato que login tradicional)
9. Angular almacena JWT en localStorage y navega según rol
```

> **Importante:** Solo usuarios previamente registrados por el administrador pueden usar Google Login.
> El email de la cuenta de Google debe coincidir con el `email` del usuario en DynamoDB.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DYNAMODB_USER_TABLE` | Tabla DynamoDB de usuarios |
| `DYNAMODB_CONFIG_TABLE` | Tabla DynamoDB de configuración |
| `SECRET_KEY` | Nombre del secreto JWT en Secrets Manager |
| `EMAIL_CONFIG_SECRET_KEY` | Nombre del secreto con credenciales de email |
| `GOOGLE_CLIENT_ID` | Client ID de OAuth2 de Google Cloud Console (para `google-login-v1`) |
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

## Desarrollo local

```bash
# Desde raíz del proyecto
npm start

# Deploy del servicio
cd services/api-entity
AWS_PROFILE=pa-dev serverless deploy --stage dev --region us-west-2
```

---

## Configuración de Google OAuth2

Para activar el login con Google es necesario:

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear o seleccionar un proyecto
3. Habilitar la API: **Google Identity** (APIs & Services > Library)
4. Crear credenciales OAuth 2.0 (APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client IDs)
   - Tipo: **Web application**
   - Orígenes JavaScript autorizados: `http://localhost:4200`, `https://d2q00w63koc9yz.cloudfront.net` (dev), `https://d2e3zvke409odp.cloudfront.net` (prd)
5. Copiar el **Client ID** y configurarlo en:
   - `GOOGLE_CLIENT_ID` como variable de entorno en el `.env` del backend
   - `googleClientId` en los archivos `environment.ts` del frontend

---

**Última actualización:** 2026-02-27
