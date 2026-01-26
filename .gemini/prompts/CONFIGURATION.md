# PROMPT ULTRA-ESTRICTO — GENERACIÓN AUTOMÁTICA DE CÓDIGO
## CONFIGURACIÓN DEL PORTAL

Actúa **exclusivamente** como Ingeniero de Software Senior y Arquitecto Cloud.
Genera código **productivo**, **final**, **sin placeholders**, **sin pseudocódigo** y **sin explicaciones innecesarias**.
No utilices servicios de AWS como ejemplo **scan de DynamoDB** y/o **servicios costosos**. **Prioriza Free Tier**.
Cumple todas las reglas. No omitas ningún punto.

---

## 1. CONTEXTO DEL SISTEMA

El sistema maneja dos tipos de configuración:

1. **Configuración global del portal**
   - Administrada solo por usuarios administradores
   - Aplica a todos los usuarios

2. **Configuración individual por usuario**
   - Aplica a administradores y usuarios clientes
   - Se carga y aplica automáticamente al iniciar sesión

No mezclar responsabilidades.

---

## 2. FRONTEND — ANGULAR 20

### Reglas obligatorias
- Usar **Componentes Standalone**
- Usar **Signals** (`signal`, `computed`, `effect`)
- No usar `NgModules`
- Tipado estricto
- Código limpio (SOLID, DRY)
- Arquitectura reactiva

---

## 3. PÁGINA DE CONFIGURACIÓN GLOBAL (SOLO ADMIN)

### Acceso
- Visible únicamente para usuarios con perfil administrador
- Acceso desde menú de perfil → “Configuración”

### Estado
- Toda la configuración debe:
  - Cargarse al login
  - Guardarse en `authStore` (SignalStore)
  - `authStore` es el **source of truth**

### Guardado
- Cambios solo se aplican al presionar **Guardar**
- Al guardar:
  - Actualizar `authStore`
  - Persistir en backend
- No aplicar cambios parciales
- No auto-guardar

---

## 4. CONFIGURACIÓN GLOBAL — IVA

### 4.1 Retención Boleta de Honorarios

- Input: porcentaje decimal (`15.25`)
- Persistencia: DynamoDB (configuración global)
- Uso:
  - Reemplazar `IVA_RATE_CREW`
  - Conversión obligatoria:
    ```
    15.25 → 0.1525
    ```
- Prohibido hardcodear valores

---

### 4.2 Retención IVA Services

- Input: porcentaje decimal (`19`)
- Persistencia: DynamoDB (configuración global)
- Uso:
  - Reemplazar `IVA_RATE_SERVICE`
  - Conversión:
    ```
    19 → 0.19
    ```

---

## 5. CONFIGURACIÓN POR USUARIO — IDIOMA

### Alcance
- Configuración individual
- Aplica a administradores y clientes
- No es global
- No se administra desde la página global

### Persistencia
```json
config: {
  "language": "es" | "en"
}
```

---

### Idioma por defecto (OBLIGATORIO)

- Idioma por defecto: **es**
- Si no existe configuración:
  - Inicializar en `es`
  - Aplicar inmediatamente
  - Persistir en backend al primer login

---

## 6. INTERNACIONALIZACIÓN (i18n)

### Reglas absolutas
- ❌ No hardcodear textos
- ❌ No recargar página
- ✅ Todo texto debe provenir de traducciones
- ✅ Cambio dinámico de idioma

### Alcance total
- Vistas
- Componentes
- Menús
- Formularios
- Errores
- Estados

---

### Integración
- Idioma activo debe reaccionar al `authStore`
- Reemplazar dinámicamente `LANGUAGE`
- Componentes no deben conocer el idioma directamente

---

## 7. BACKEND — AWS SERVERLESS CON SERVERLESS FRAMEWORK

### Tabla DynamoDB (Configuración Global)

```
config-<env>-pri-usw2
```

- Extensible
- Compartida por administradores

---

### Configuración Usuario

- Idioma se guarda solo en el JSON del usuario
- Nunca en tabla global

---

### 7.1 Endpoints

#### 7.1.1 Configuración Global (Admin)

Este endpoint es utilizado por la pantalla de configuración global.

- **Método**: `POST` (o `PUT`)
- **Ruta**: `/configuration/global`
- **Acceso**: Solo usuarios con perfil `ACC#ADMIN#Administrador`.
- **Persistencia**: Tabla `config-<env>-pri-usw2`.
- **Body Request**:
  ```json
  {
    "ivaRateCrew": 0.1525,
    "ivaRateService": 0.19
  }
  ```
- **Body Response**:
  ```json
  {
    "success": true,
    "message": "Configuración global actualizada correctamente"
  }
  ```

#### 7.1.2 Configuración de Usuario (User Preferences)

Este endpoint es utilizado cuando el usuario cambia su idioma.

- **Método**: `POST` (o `PATCH`)
- **Ruta**: `/configuration/user`
- **Acceso**: Cualquier usuario autenticado.
- **Persistencia**: Atributo en el item del usuario en DynamoDB.
- **Body Request**:
  ```json
  {
    "language": "es"
  }
  ```
- **Body Response**:
  ```json
  {
    "success": true,
    "message": "Configuración de usuario actualizada correctamente"
  }
  ```

---

## 8. LOGIN API

El login (`POST /auth/login`) debe retornar la configuración inicial. La respuesta JSON debe ser la siguiente:

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "pk": "USR#...",
    "globalConfig": {
      "ivaRateCrew": 0.1525,
      "ivaRateService": 0.19
    },
    "userConfig": {
      "language": "es"
    }
  }
}
```

Cargar `globalConfig` y `userConfig` en `authStore`.

---

## 9. REGLAS FINALES (NO NEGOCIABLES)

- No hardcodear valores
- No duplicar estado
- No lógica en componentes
- No texto sin traducción
- Código listo para producción

---

## 10. NO ROMPER EL FUNCIONAMIENTO DEL SISTEMA, NI EN FRONTEND NI EN BACKEND.

El sistema está funcionando correctamente. No romperlo.

Ejemplo de JSON de usuario administrador:

```json
{
 "pk": "USR#4f7cb502-4256-11ec-81d3-0242ac130003",
 "sk": "USR#171374405",
 "createdAt": "2025-08-25T17:26:52.913Z",
 "email": "niamesvi3@gmail.com",
 "gsiOne": "171374405",
 "id": "4127943b-5c13-48f2-b3f7-aefc0115b213",
 "isActive": true,
 "lastAccess": "2026-01-26T01:51:54.584Z",
 "names": "Nicolás",
 "password": "$2b$10$g.2voSPFe5kRGsmVB3ItWOgxGslt3kiIWMChSGnUUL3yxjIxB/MOm",
 "phoneNumber": "+56959139687",
 "profiles": [
  "ACC#ADMIN#Administrador"
 ],
 "resetToken": "95f76eb1627110c5eceecb90ad7d5a24a56b6ecc163c0fc6fe384b0272105df7",
 "resetTokenExpiry": "2025-11-23T05:56:54.429Z",
 "rut": "17137440-5",
 "surnames": "Améstica Vidal",
 "updatedAt": "2025-11-23T04:56:54.429Z"
}
```

Ejemplo de JSON de usuario cliente:

```json
{
 "pk": "USR#019be807-6b2a-777c-9e57-4b42e31889dc",
 "sk": "USR#19",
 "content": [
  {
   "createdAt": "2026-01-22T23:25:58.954Z",
   "isActive": true,
   "program": "PRG#019be38b-26ff-7972-b178-d177ac488cf7"
  }
 ],
 "createdAt": "2026-01-22T23:25:58.954Z",
 "email": "niamesvi3@gmail.com",
 "gsiOne": "19",
 "id": "019be807-6b2a-777c-9e57-4b42e31889dc",
 "isActive": true,
 "lastAccess": "2026-01-24T03:02:34.618Z",
 "names": "uytr",
 "password": "$2b$10$QQ114yJdSS4FUmuq2r3nROwJN5V07.eh/ACZZCWBxOzLDURUl/xLm",
 "phoneNumber": "(+56) 959139687",
 "profiles": [
  "ACC#CLI#Cliente"
 ],
 "rut": "1-9",
 "surnames": ""
}
```

---

## 11. SKILLS de senior-programmer

Utiliza la siguiente lista de habilidades para generar el código:

.agent/skills/senior-programmer/basic.md