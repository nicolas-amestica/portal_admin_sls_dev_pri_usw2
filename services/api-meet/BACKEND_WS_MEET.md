# Requerimientos de WebSocket para el Módulo de Reuniones (Meet)

Este documento detalla la estructura de mensajes y el comportamiento esperado del backend para soportar actualizaciones en tiempo real en la agenda de videollamadas.

## Endpoint
Se espera que el cliente se conecte a un endpoint de WebSocket con el siguiente parámetro de consulta:
`?scope=calendar`

## Comportamiento Esperado
El backend debe emitir un mensaje JSON a todos los clientes conectados al scope `calendar` cada vez que ocurra una operación CRUD sobre las reuniones (`v1/reuniones`).

## Estructura de Mensajes (Payloads)

### 1. Reunión Creada
Se debe emitir cuando se crea con éxito un evento en Google Calendar.
```json
{
  "type": "meeting_created",
  "meeting": {
    "id": "string",
    "title": "string",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "description": "string",
    "guests": ["email1@example.com"],
    "googleMeetLink": "https://meet.google.com/xxx-yyyy-zzz",
    "hostSk": "PRESENTER#uuid",
    "hostName": "Nombre",
    "hostColor": "#FFFFFF"
  }
}
```

### 2. Reunión Actualizada
Se debe emitir cuando se modifica cualquier campo de una reunión existente o se arrastra a un nuevo día.
```json
{
  "type": "meeting_updated",
  "meeting": {
    "id": "string",
    "title": "string",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "description": "string",
    "guests": ["email1@example.com"],
    "googleMeetLink": "https://meet.google.com/xxx-yyyy-zzz",
    "hostSk": "PRESENTER#uuid",
    "hostName": "Nombre",
    "hostColor": "#FFFFFF"
  }
}
```

### 3. Reunión Eliminada
Se debe emitir cuando se elimina un evento de Google Calendar.
```json
{
  "type": "meeting_deleted",
  "meetingId": "ID_DEL_EVENTO_BORRADO"
}
```

## Notas Adicionales
- El frontend maneja automáticamente la reconexión con backoff exponencial.
- Si el cliente recibe un mensaje con `type: "reconnected"`, el frontend forzará una recarga total de los eventos del mes visible para asegurar la consistencia de los datos.
- Se recomienda que el backend solo emita estos mensajes a los usuarios con rol de administrador que tengan acceso al portal.
