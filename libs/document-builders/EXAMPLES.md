# Ejemplos de Inputs para Generación de Documentos

Este archivo contiene ejemplos de diferentes combinaciones de inputs para generar documentos PDF con distintas características.

## Estructura del Input

```javascript
{
  "scope": "CTT" | "DBA" | "DBR",  // Tipo de documento
  "form": { ... },                  // Datos específicos del documento
  "action": {                       // Opciones de generación (todas opcionales)
    "isPreview": boolean,           // Default: false
    "hasSigned": boolean,         // Default: true (sin firmas)
    "hasHeaderFooter": boolean      // Default: false
  }
}
```

## Propiedades de Action

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `isPreview` | boolean | `false` | Si es `true`, agrega marca de agua "BORRADOR" |
| `hasSigned` | boolean | `true` | Si es `false`, incluye firmas digitales desde S3 |
| `hasHeaderFooter` | boolean | `false` | Si es `true`, carga header.png y footer.png desde S3 |

**Importante:** Si no se especifica una propiedad, se asume `false` por defecto (excepto `hasSigned` que es `true`).

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

**Caso:** Contrato oficial con header/footer y espacio para firmas digitales, sin marca de agua

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
    "hasSigned": false,
    "hasHeaderFooter": true
  }
}
```

**Resultado:**
- ❌ Sin marca de agua (documento final)
- ✅ Con firmas digitales (carga desde `s3://bucket/signatures/signature-{DNI}.png`)
- ✅ Con header/footer

**Firmas cargadas:**
- `signatures/signature-12345678-9.png` → Firma de Juan Pérez
- `signatures/signature-98765432-1.png` → Firma de María González

---

### 5. Contrato Firmado y Aprobado (archivo final)

**Caso:** Documento final con firmas y header/footer, sin marca de agua

```json
{
  "scope": "CTT",
  "form": { ... },
  "action": {
    "isPreview": false,
    "hasSigned": false,
    "hasHeaderFooter": true
  }
}
```

**Resultado:**
- ❌ Sin marca de agua
- ✅ Con firmas digitales
- ✅ Con header/footer

**Uso:** Documento listo para archivar o enviar al cliente

---

### 6. Documento Solo con Firmas (sin header/footer)

**Caso:** Documento simple que requiere firmas pero sin elementos visuales

```json
{
  "scope": "DBA",
  "form": {
    "contenido": "...",
    "firmantes": [
      { "name": "Ana Silva", "dni": "11111111-1" }
    ]
  },
  "action": {
    "hasSigned": false
  }
}
```

**Resultado:**
- ❌ Sin marca de agua
- ✅ Con firmas digitales
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

**Caso:** Borrador con header/footer y firmas (para revisión final antes de aprobar)

```json
{
  "scope": "CTT",
  "form": { ... },
  "action": {
    "isPreview": true,
    "hasSigned": false,
    "hasHeaderFooter": true
  }
}
```

**Resultado:**
- ✅ Con marca de agua "BORRADOR"
- ✅ Con firmas digitales
- ✅ Con header/footer

**Uso:** Para que el cliente revise el documento final con todas sus características antes de aprobar

---

## Tabla de Combinaciones

| # | isPreview | hasSigned | hasHeaderFooter | Marca Agua | Firmas | Header/Footer | Caso de Uso |
|---|-----------|-------------|-----------------|------------|--------|---------------|-------------|
| 1 | `false` | `true` | `false` | ❌ | ❌ | ❌ | Documento simple |
| 2 | `true` | `true` | `false` | ✅ | ❌ | ❌ | Borrador interno |
| 3 | `true` | `true` | `true` | ✅ | ❌ | ✅ | Cotización con logo |
| 4 | `false` | `false` | `true` | ❌ | ✅ | ✅ | Contrato final |
| 5 | `false` | `false` | `false` | ❌ | ✅ | ❌ | Documento con firmas simple |
| 6 | `false` | `true` | `true` | ❌ | ❌ | ✅ | Presentación corporativa |
| 7 | `true` | `false` | `true` | ✅ | ✅ | ✅ | Revisión final pre-aprobación |
| 8 | `true` | `false` | `false` | ✅ | ✅ | ❌ | Borrador con firmas |

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
    "hasSigned": false,
    "hasHeaderFooter": true
  }
}
```

---

## Notas Importantes

1. **Valores por defecto**: Si `action` no se especifica o está vacío `{}`, todas las propiedades son `false` por defecto (excepto `hasSigned` que es `true`).

2. **Firmas en S3**: Para que las firmas se incluyan, debe cumplirse:
   - `action.hasSigned = false`
   - El documento debe tener datos de firmantes en `form.representatives` o `form.clientRepresentative`
   - Las firmas deben existir en S3: `s3://bucket/signatures/signature-{DNI}.png`

3. **Header/Footer en S3**: Para que se incluyan, debe cumplirse:
   - `action.hasHeaderFooter = true`
   - Las imágenes deben existir en S3:
     - `s3://bucket/assets/header.png`
     - `s3://bucket/assets/footer.png`

4. **Fallback**: Si faltan las firmas o imágenes en S3, el sistema continúa sin ellas (no genera error).

5. **Extensibilidad**: Los documentos DBA y DBR tienen la misma estructura de `action` que CTT, pero su `form` puede ser diferente según las necesidades de cada tipo de documento.
