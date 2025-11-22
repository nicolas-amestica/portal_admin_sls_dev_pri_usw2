# Configuración del Servicio de Recuperación de Contraseña

## Descripción

La función `forgot-password-v1` permite a los usuarios recuperar su contraseña mediante el envío de un correo electrónico con un enlace de recuperación.

## Características de Seguridad

- **Token único y seguro**: Genera un token aleatorio de 32 bytes hexadecimales
- **Expiración automática**: El token expira en 1 hora
- **Respuesta opaca**: Siempre retorna el mismo mensaje, sin revelar si el usuario existe (previene enumeración de usuarios)
- **Validación de estado**: Solo envía correos a usuarios activos
- **Limpieza de RUT**: Acepta RUT con o sin formato (puntos y guiones)

## Configuración Requerida

### 1. AWS Secret Manager

Debes crear un secreto en AWS Secret Manager con el nombre definido en `EMAIL_SECRET_KEY` (por defecto: `email-config-{stage}-pri-{region}`).

El secreto debe contener la siguiente estructura JSON:

```json
{
  "host": "mail.tudominio.com",
  "port": 465,
  "secure": true,
  "user": "noreply@tudominio.com",
  "password": "tu_contraseña_smtp",
  "frontendUrl": "https://portal.tudominio.com"
}
```

### Parámetros del Secret:

- **host**: Servidor SMTP de tu hosting (ej: `mail.tudominio.com`, `smtp.gmail.com`)
- **port**: Puerto SMTP (generalmente 465 para SSL o 587 para TLS)
- **secure**: `true` para puerto 465 (SSL), `false` para 587 (TLS)
- **user**: Email que se usará para enviar (ej: `noreply@tudominio.com`)
- **password**: Contraseña del email o contraseña de aplicación
- **frontendUrl**: URL base de tu aplicación frontend (ej: `https://admin.girasindómito.com`)

### 2. Configuración de Email en tu Hosting

#### Para cPanel/Hosting compartido:
1. Crea una cuenta de email (ej: `noreply@tudominio.com`)
2. Obtén las credenciales SMTP desde el panel de correo
3. Usa el servidor SMTP proporcionado por tu hosting

#### Para Gmail (desarrollo):
```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "user": "tucorreo@gmail.com",
  "password": "contraseña_de_aplicacion",
  "frontendUrl": "http://localhost:4200"
}
```
**Nota**: Para Gmail necesitas generar una "Contraseña de aplicación" en la configuración de seguridad de Google.

### 3. Actualizar DynamoDB

Asegúrate de que la tabla de usuarios tenga los siguientes campos:
- `email` (String): Email del usuario
- `resetToken` (String): Se crea automáticamente al solicitar recuperación
- `resetTokenExpiry` (String): Fecha de expiración del token (ISO 8601)

### 4. Crear página de Reset Password (Frontend)

La URL de recuperación será:
```
{frontendUrl}/auth/reset-password?token={resetToken}
```

Debes crear esta página en Angular para:
1. Capturar el token de la URL
2. Solicitar nueva contraseña al usuario
3. Enviar el token y la nueva contraseña al backend para validar y actualizar

## Uso

### Request:
```http
POST /v1/sesiones/recuperar-clave
Content-Type: application/json

{
  "rut": "12.345.678-9"
}
```

### Response (siempre exitosa por seguridad):
```json
{
  "state": true,
  "metadata": {
    "statusCode": 200,
    "action": "Recuperación de contraseña."
  },
  "data": {
    "message": "Si el RUT está registrado, recibirás un correo con instrucciones para recuperar tu contraseña."
  }
}
```

## Flujo Completo

1. **Usuario solicita recuperación** → Ingresa RUT en frontend
2. **Lambda verifica usuario** → Busca en DynamoDB por RUT
3. **Genera token** → Crea token seguro con expiración de 1 hora
4. **Guarda token** → Actualiza registro en DynamoDB
5. **Envía email** → Usa nodemailer con configuración SMTP
6. **Usuario recibe email** → Con enlace que incluye el token
7. **Usuario hace clic** → Redirige a página de reset password
8. **Valida y actualiza** → Backend verifica token y actualiza contraseña

## Comandos de Despliegue

```bash
# Desplegar solo esta función
cd services/api-entity
serverless deploy function -f forgot_password_v1

# Desplegar todo el servicio
serverless deploy
```

## Variables de Entorno

- `DYNAMODB_USER_TABLE`: Tabla de usuarios en DynamoDB
- `EMAIL_SECRET_KEY`: Nombre del secreto en Secret Manager con configuración SMTP

## Logs y Debugging

```bash
# Ver logs en tiempo real
serverless logs -f forgot_password_v1 -t

# Ver logs específicos
aws logs tail /aws/lambda/usuarios-dev-forgot_password_v1 --follow
```

## Consideraciones de Seguridad

1. **No revelar información**: La función siempre retorna el mismo mensaje, independiente de si el usuario existe
2. **Rate limiting**: Considera implementar rate limiting en API Gateway
3. **Monitoreo**: Configura alarmas en CloudWatch para detectar abuso
4. **Email válido**: Verifica que los usuarios tengan emails válidos en la base de datos
5. **HTTPS obligatorio**: El enlace de recuperación debe ser HTTPS en producción

## Próximos Pasos

Para completar la funcionalidad, necesitas crear:

1. **Lambda de reset password**: Para validar el token y actualizar la contraseña
2. **Componente Angular**: Página `/auth/reset-password` que capture el token y permita ingresar nueva contraseña
3. **Servicio Angular**: Método para enviar el token y nueva contraseña al backend

## Ejemplo de Configuración del Secret Manager (AWS CLI)

```bash
aws secretsmanager create-secret \
  --name email-config-dev-pri-usw2 \
  --description "Configuración SMTP para recuperación de contraseña" \
  --secret-string '{
    "host": "mail.tudominio.com",
    "port": 465,
    "secure": true,
    "user": "noreply@tudominio.com",
    "password": "tu_contraseña",
    "frontendUrl": "https://admin.tudominio.com"
  }' \
  --profile pa-dev
```
