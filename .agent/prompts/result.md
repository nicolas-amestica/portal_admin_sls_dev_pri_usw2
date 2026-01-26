1. Modificación de Login (Auth Service)

  El endpoint existente de login debe enriquecerse para devolver la configuración inicial.

   * Método: POST /auth/login
   * Cambio requerido: Agregar los objetos globalConfig y userConfig a la respuesta exitosa.
   * Respuesta JSON (Fragmento):

    1     {
    2       "token": "JWT_TOKEN",
    3       "user": {
    4         "pk": "USR#...",
    5         // ... otros campos existentes ...
    6         "globalConfig": {
    7           "ivaRateCrew": 0.1525,    // Decimal (15.25%)
    8           "ivaRateService": 0.19    // Decimal (19%)
    9         },
   10         "userConfig": {
   11           "language": "es"          // "es" | "en"
   12         }
   13       }
   14     }

  2. Configuración Global (Admin)

  Este endpoint es utilizado por la pantalla de configuración global.

   * Método: POST (o PUT)
   * Ruta: /configuration/global
   * Acceso: Solo usuarios con perfil ACC#ADMIN#Administrador.
   * Persistencia: Tabla config-<env>-pri-usw2 (u otra tabla global definida).
   * Body Request:

   1     {
   2       "ivaRateCrew": 0.1525,    // number (float)
   3       "ivaRateService": 0.19    // number (float)
   4     }
   * Body Response:
   1     {
   2       "success": true,
   3       "message": "Configuración global actualizada correctamente"
   4     }

  3. Configuración de Usuario (User Preferences)

  Este endpoint es utilizado cuando el usuario cambia su idioma desde el menú de perfil.

   * Método: POST (o PATCH)
   * Ruta: /configuration/user
   * Acceso: Cualquier usuario autenticado (ADMIN o CLIENTE).
   * Persistencia: Debe guardar en el registro del usuario (campo content o un atributo nuevo en la tabla de usuarios, según tu modelo DynamoDB para usuarios).
   * Body Request:

   1     {
   2       "language": "es" // "es" | "en"
   3     }
   * Body Response:
   1     {
   2       "success": true,
   3       "message": "Configuración de usuario actualizada correctamente"
   4     }

  Interfaces TypeScript de Referencia

  Estas son las interfaces que está usando el Frontend (src/app/app-admin-portal/configuration/interfaces/configuration.interface.ts):

    1 export interface GlobalConfig {
    2   ivaRateCrew: number;
    3   ivaRateService: number;
    4 }
    5 
    6 export interface UserConfig {
    7   language: 'es' | 'en';
    8 }
    9 
   10 export interface ConfigurationUpdateResponse {
   11   success: boolean;
   12   message: string;
   13 }