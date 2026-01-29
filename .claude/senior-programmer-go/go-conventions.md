# Convenciones de Código y Estándares del Proyecto

Este documento define las convenciones de codificación y los patrones de arquitectura a seguir en este proyecto. El módulo `internal/api/favorites` sirve como la implementación de referencia de estos estándares por su enfoque 100% funcional.

## 1. Arquitectura y Estructura de Paquetes (Functional Style)

El proyecto utiliza **Programación Funcional** basada en funciones de paquete puras y composición, evitando estructuras que simulen objetos, clases o inyección de dependencias compleja.

- `router.go`: El "Composer". Define las rutas y asocia los handlers directamente.
- `handler.go`: Contiene funciones que actúan como adaptadores entre HTTP y la lógica de negocio. Extraen datos de la petición y llaman a funciones de servicio.
- `service.go`: Define funciones de paquete que contienen la lógica de negocio. **No se utilizan structs con métodos ni closures para agrupar lógica.**
- `repository/`: Funciones de persistencia directas que interactúan con la base de datos utilizando el estado global del paquete de base de datos.

## 2. Gestión de Dependencias: Estado Global y Acoplamiento Estrecho

Para mantener el flujo de trabajo simple y evitar la complejidad de la inyección de dependencias explícita, el proyecto favorece el acoplamiento estrecho con los proveedores de infraestructura globales.

- **Base de Datos:** Los repositorios deben llamar directamente al cliente global (ej. `database.MustClient()`).
- **Sin Factories:** No se deben crear funciones `New...Service` que retornen closures o interfaces. La lógica se expone directamente como funciones exportadas del paquete.
- **Sin Interfaces innecesarias:** No definimos interfaces para servicios o repositorios a menos que sea estrictamente necesario para múltiples implementaciones reales (no solo para testing).

**Ejemplo (service.go):**
```go
// Lógica de negocio directa como función de paquete
func CreateOrder(ctx context.Context, cmd CreateOrderCmd) (OrderResponse, error) {
    // Llamada directa al repositorio de paquete
    return dynamodb.SaveOrder(ctx, cmd)
}
```

## 3. Logging Estructurado

Se utiliza un logger estructurado para la observabilidad, accediendo a él de forma global o mediante el contexto.

- **Herramienta Estándar:** `go.uber.org/zap`.
- **Acceso:** Se prefiere el uso del logger global del proyecto o la recuperación del mismo desde el proveedor de logging, evitando pasarlo como parámetro en cada función si el flujo lo permite.
- **Logs con Contexto:** Todos los logs deben incluir campos estructurados (`zap.String`, `zap.Error`, etc.).
- **Niveles de Log:**
    - `log.Info()`: Eventos importantes del flujo.
    - `log.Warn()`: Eventos inesperados no críticos.
    - `log.Error()`: Errores que impiden completar la operación.
- **No usar `fmt.Println` o `log.Printf`.**

## 4. Manejo de Errores

Un manejo de errores consistente es clave para la robustez del sistema.

- **Paquete `apperr`:** Utilizar `shared/apperr` para errores que se traducen en respuestas HTTP (4xx, 5xx).
- **Error Wrapping:** Siempre envolver el error original con `%w` o pasarlo a `apperr`.
- **Responsabilidades:**
    - **Repositorio:** Devuelve errores nativos o envueltos.
    - **Servicio:** Transforma errores esperados en `apperr` y propaga/envuelve errores inesperados.
    - **Handler:** Loguea errores 5xx y retorna la respuesta al cliente.

## 5. Patrones de Diseño

- **Strategy / Registry:** Cuando existen múltiples implementaciones (ej. tipos de órdenes), se utiliza un patrón de registro global para evitar modificar el código base al añadir nuevas estrategias.
- **Evitar Simulación de OO:** No usar receptores de struct (`func (s *Service) ...`) para agrupar funciones que no mantienen estado real.

**Ejemplo Registry:**
```go
var strategyRegistry = make(map[string]OrderStrategyFunc)

func RegisterStrategy(name string, fn OrderStrategyFunc) {
    strategyRegistry[name] = fn
}
```
