# Ejemplos de Inputs para Generación de Documentos

Este archivo contiene ejemplos de diferentes combinaciones de inputs para generar documentos PDF con distintas características.

## Estructura del Input

```javascript
{
  "scope": "CTT" | "DBA" | "DBR",  // Tipo de documento
  "form": { ... },                  // Datos específicos del documento
  "action": {                       // Opciones de generación (todas opcionales)
    "isPreview": boolean,           // Default: false
    "hasHeaderFooter": boolean      // Default: false
  }
}
```

## Propiedades de Action

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `isPreview` | boolean | `false` | Si es `true`, agrega marca de agua "BORRADOR" |
| `hasHeaderFooter` | boolean | `false` | Si es `true`, carga header.png y footer.png desde S3 |

**Importante:** Si no se especifica una propiedad, se asume `false` por defecto.

---

## Ejemplos por Caso de Uso

### 1. Documento Simple (sin nada extra)

**Caso:** Documento básico sin marca de agua, sin firmas, sin header/footer

```json
{
  "scope": "DBA",
  "form": {
    "cliente": "Empresa XYZ",
    "fecha": "2024-01-15"
  },
  "action": {}
}
```

**Resultado:**
- ❌ Sin marca de agua
- ❌ Sin firmas
- ❌ Sin header/footer

---

### 2. Borrador para Revisión Interna

**Caso:** Documento con marca de agua para revisión, sin firmas ni header/footer

```json
{
  "scope": "DBR",
  "form": {
    "proyecto": "Viaje Escolar 2024",
    "detalles": "..."
  },
  "action": {
    "isPreview": true
  }
}
```

**Resultado:**
- ✅ Con marca de agua "BORRADOR"
- ❌ Sin firmas
- ❌ Sin header/footer

---

### 3. Cotización para Cliente (con logo)

**Caso:** Documento de cotización con marca de agua y header/footer corporativo, sin firmas

```json
{
  "scope": "CTT",
  "form": {
    "trip": {
      "destination": "París",
      "departureDate": "2024-06-15",
      "returnDate": "2024-06-22"
    },
    "plan": {
      "name": "Tour Europa Premium",
      "servicesIncluded": [...]
    },
    "payments": { ... }
  },
  "action": {
    "isPreview": true,
    "hasHeaderFooter": true
  }
}
```

**Resultado:**
- ✅ Con marca de agua "BORRADOR"
- ❌ Sin firmas
- ✅ Con header/footer (logo corporativo)

---

### 4. Contrato Final para Firma (completo)

**Caso:** Contrato oficial con header/footer y espacios para firma manual, sin marca de agua

```json
{
  "scope": "CTT",
  "form": {
    "trip": { ... },
    "plan": { ... },
    "institution": { ... },
    "clientRepresentative": { ... },
    "representatives": [
      { "name": "Juan Pérez", "dni": "12345678-9" },
      { "name": "María González", "dni": "98765432-1" }
    ],
    "payments": { ... }
  },
  "action": {
    "isPreview": false,
    "hasHeaderFooter": true
  }
}
```

**Resultado:**
- ❌ Sin marca de agua (documento final)
- ✅ Con líneas y datos para firma manual
- ✅ Con header/footer

---

### 5. Contrato sin marca de agua

**Caso:** Documento final con espacios para firma manual y header/footer

```json
{
  "scope": "CTT",
  "form": { ... },
  "action": {
    "isPreview": false,
    "hasHeaderFooter": true
  }
}
```

**Resultado:**
- ❌ Sin marca de agua
- ✅ Con líneas y datos para firma manual
- ✅ Con header/footer

**Uso:** Documento listo para archivar o enviar al cliente

---

### 6. Documento sin Header/Footer

**Caso:** Documento simple con espacios para firma manual, sin elementos visuales

```json
{
  "scope": "DBA",
  "form": {
    "contenido": "...",
    "firmantes": [
      { "name": "Ana Silva", "dni": "11111111-1" }
    ]
  },
  "action": {}
}
```

**Resultado:**
- ❌ Sin marca de agua
- ✅ Con líneas y datos para firma manual
- ❌ Sin header/footer

---

### 7. Documento Solo con Header/Footer (sin firmas)

**Caso:** Documento de presentación con branding pero sin firmas

```json
{
  "scope": "DBR",
  "form": {
    "presentacion": "Propuesta de Servicios 2024",
    "contenido": "..."
  },
  "action": {
    "hasHeaderFooter": true
  }
}
```

**Resultado:**
- ❌ Sin marca de agua
- ❌ Sin firmas
- ✅ Con header/footer

---

### 8. Combinación Personalizada

**Caso:** Borrador con header/footer para revisión final antes de aprobar

```json
{
  "scope": "CTT",
  "form": { ... },
  "action": {
    "isPreview": true,
    "hasHeaderFooter": true
  }
}
```

**Resultado:**
- ✅ Con marca de agua "BORRADOR"
- ✅ Con líneas y datos para firma manual
- ✅ Con header/footer

**Uso:** Para que el cliente revise el documento final con todas sus características antes de aprobar

---

## Tabla de Combinaciones

| # | isPreview | hasHeaderFooter | Marca Agua | Header/Footer | Caso de Uso |
|---|-----------|-----------------|------------|---------------|-------------|
| 1 | `false` | `false` | ❌ | ❌ | Documento simple |
| 2 | `true` | `false` | ✅ | ❌ | Borrador interno |
| 3 | `true` | `true` | ✅ | ✅ | Cotización con logo |
| 4 | `false` | `true` | ❌ | ✅ | Contrato final |

---

## Ejemplo Completo de Form (Contrato CTT)

```json
{
  "scope": "CTT",
  "form": {
    "trip": {
      "city": "Santiago",
      "destination": "Buenos Aires, Argentina",
      "departurePoint": "Aeropuerto Internacional Arturo Merino Benítez",
      "departureDate": "2024-07-15T08:00:00Z",
      "returnDate": "2024-07-22T20:00:00Z",
      "contractDate": "2024-05-01T00:00:00Z",
      "days": "8",
      "nights": "7"
    },
    "plan": {
      "name": "Tour Buenos Aires Premium",
      "servicesIncluded": [
        { "description": "Pasaje aéreo Santiago - Buenos Aires - Santiago" },
        { "description": "7 noches de alojamiento en hotel 4 estrellas" },
        { "description": "Desayuno buffet diario" },
        { "description": "City tour por Buenos Aires" },
        { "description": "Show de tango con cena" },
        { "description": "Traslados aeropuerto-hotel-aeropuerto" },
        { "description": "Seguro de viaje" }
      ]
    },
    "institution": {
      "name": "Colegio San Agustín",
      "address": "Av. Libertador 1234, Santiago"
    },
    "clientRepresentative": {
      "name": "Carlos Rodríguez",
      "dni": "15555555-5",
      "course": "4° Medio A"
    },
    "representatives": [
      {
        "name": "Patricia Morales",
        "dni": "12345678-9"
      },
      {
        "name": "Roberto Sánchez",
        "dni": "98765432-1"
      }
    ],
    "payments": {
      "totalGroup": 15000000,
      "downPayment": 3000000,
      "groupBalance": 12000000,
      "pricePerPerson": 500000,
      "totalPassengers": 30,
      "freePassengers": 2,
      "priceInUSD": 550,
      "maxExchangeRate": 950,
      "daysBeforePayment": 30,
      "bankAccount": {
        "accountNumber": "123456789",
        "accountHolder": "GIRAS INDÓMITO LIMITADA",
        "holderDNI": "76123456-7",
        "bank": "Banco de Chile",
        "email": "pagos@girasindómito.cl"
      },
      "conditions": {
        "depositPercentageWithFlight": 30,
        "depositPercentageWithoutFlight": 20,
        "specialProgramDeposit": 500000,
        "daysBeforeFlightBalance": 45,
        "daysBeforeTerrestrialBalance": 30,
        "complaintDeadlineDays": 15,
        "cancellationNoticeDays": 30,
        "cancellationPenaltyPercentage": 30
      },
      "installments": {
        "quantity": 3,
        "startMonth": "Junio",
        "groupInstallmentValue": 4000000,
        "individualInstallmentValue": 133333
      }
    }
  },
  "action": {
    "isPreview": false,
    "hasHeaderFooter": true
  }
}
```

---

## Notas Importantes

1. **Valores por defecto**: Si `action` no se especifica o está vacío `{}`, todas las propiedades son `false` por defecto.

2. **Firmas**: La página de firmas sólo contiene líneas y datos para firma manual; no se cargan ni estampan imágenes automáticamente.

3. **Header/Footer en S3**: Para que se incluyan, debe cumplirse:
   - `action.hasHeaderFooter = true`
   - Las imágenes deben existir en S3:
     - `s3://bucket/assets/header.png`
     - `s3://bucket/assets/footer.png`

4. **Fallback**: Si faltan las firmas o imágenes en S3, el sistema continúa sin ellas (no genera error).

5. **Extensibilidad**: Los documentos DBA y DBR tienen la misma estructura de `action` que CTT, pero su `form` puede ser diferente según las necesidades de cada tipo de documento.
