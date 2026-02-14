# Document Builders - Sistema de Generación de Documentos

Este directorio contiene los builders para diferentes tipos de documentos que puede generar el sistema.

## Estructura del Proyecto

```
libs/
├── document-generator.js       # ⭐ Módulo central reutilizable
└── document-builders/
    ├── index.js                # Factory para seleccionar el builder correcto
    ├── ctt-builder.js          # Builder para Contratos (CTT)
    ├── dba-builder.js          # Builder para documentos DBA
    ├── dbr-builder.js          # Builder para documentos DBR
    └── README.md               # Esta documentación
```

## Tipos de Documentos Soportados

| Scope | Descripción | Estado |
|-------|-------------|--------|
| `CTT` | Contrato de Prestación de Servicios Turísticos | ✅ Implementado |
| `DBA` | Documento Borrador A | 🚧 Placeholder |
| `DBR` | Documento Borrador R | 🚧 Placeholder |

## Uso desde la API

### Endpoint: `POST /v1/documentos/pdf`

```javascript
{
  "scope": "CTT",        // Tipo de documento: CTT, DBA, DBR
  "form": {
    // Datos del formulario según el tipo de documento
  },
  "action": {
    "isPreview": true,     // true = con marca de agua "BORRADOR"
    "hasSigned": false   // false = con firmas digitales
  }
}
```

## Uso desde Otros Lambdas (Módulo Reutilizable)

El módulo central [`document-generator.js`](../document-generator.js:1-190) puede ser importado y usado desde **cualquier lambda del proyecto**.

### Ejemplo 1: Lambda Simple

```javascript
// En tu lambda: functions/mi-lambda.js
import { generateDocument } from '../../../libs/document-generator.js';

export const main = async (event) => {
  const result = await generateDocument({
    scope: 'CTT',
    form: {
      trip: { destination: 'París', ... },
      plan: { name: 'Tour Europa', ... },
      payments: { totalGroup: 5000000, ... }
    },
    action: {
      isPreview: false,    // Sin marca de agua (documento final)
      hasSigned: false   // Con firmas digitales
    },
    bucket: process.env.BUCKET_INFO_GI
  });

  if (result.success) {
    console.log('PDF generado exitosamente');
    console.log('Base64:', result.base64);
    // Hacer algo con el PDF (guardar en S3, enviar por email, etc.)
  } else {
    console.error('Error:', result.error);
    console.error('Código:', result.statusCode);
  }
};
```

### Ejemplo 2: Generar Múltiples Documentos

```javascript
import { generateDocument } from '../../../libs/document-generator.js';

export const main = async (event) => {
  const { BUCKET_INFO_GI } = process.env;

  // Generar borrador con marca de agua
  const borrador = await generateDocument({
    scope: 'CTT',
    form: miFormulario,
    action: { isPreview: true, hasSigned: true },
    bucket: BUCKET_INFO_GI
  });

  // Generar documento final con firmas
  const final = await generateDocument({
    scope: 'CTT',
    form: miFormulario,
    action: { isPreview: false, hasSigned: false },
    bucket: BUCKET_INFO_GI
  });

  return {
    borrador: borrador.base64,
    final: final.base64
  };
};
```

### Ejemplo 3: Validar Scope Antes de Generar

```javascript
import { generateDocument, isValidScope, getSupportedScopes } from '../../../libs/document-generator.js';

export const main = async (event) => {
  const scope = event.pathParameters.tipo; // Ej: "CTT"

  // Validar antes de generar
  if (!isValidScope(scope)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Tipo "${scope}" no soportado`,
        tiposDisponibles: getSupportedScopes()
      })
    };
  }

  const result = await generateDocument({
    scope,
    form: event.body,
    action: { isPreview: false, hasSigned: false },
    bucket: process.env.BUCKET_INFO_GI
  });

  return {
    statusCode: result.success ? 200 : result.statusCode,
    body: JSON.stringify(result)
  };
};
```

### Ejemplo 4: Integración con DynamoDB y S3

```javascript
import { generateDocument } from '../../../libs/document-generator.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const s3Client = new S3Client({});
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const main = async (event) => {
  const { contractId, formData } = JSON.parse(event.body);

  // 1. Generar documento final
  const result = await generateDocument({
    scope: 'CTT',
    form: formData,
    action: { isPreview: false, hasSigned: false },
    bucket: process.env.BUCKET_INFO_GI
  });

  if (!result.success) {
    return { statusCode: result.statusCode, body: JSON.stringify({ error: result.error }) };
  }

  // 2. Guardar PDF en S3
  const s3Key = `contracts/${contractId}/contract-final.pdf`;
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.BUCKET_CONTRACTS,
    Key: s3Key,
    Body: Buffer.from(result.base64, 'base64'),
    ContentType: 'application/pdf'
  }));

  // 3. Actualizar DynamoDB con referencia al PDF
  await dynamoClient.send(new PutCommand({
    TableName: process.env.DYNAMODB_CONTRACT_TABLE,
    Item: {
      contractId,
      pdfUrl: `s3://${process.env.BUCKET_CONTRACTS}/${s3Key}`,
      generatedAt: new Date().toISOString(),
      scope: 'CTT'
    }
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Contrato generado y guardado exitosamente',
      pdfUrl: s3Key
    })
  };
};
```

### Ejemplo 5: Enviar PDF por Email

```javascript
import { generateDocument } from '../../../libs/document-generator.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const main = async (event) => {
  const { email, formData } = JSON.parse(event.body);

  // Generar documento
  const result = await generateDocument({
    scope: 'CTT',
    form: formData,
    action: { isPreview: true, hasSigned: true }, // Borrador para cotización
    bucket: process.env.BUCKET_INFO_GI
  });

  if (!result.success) {
    return { statusCode: result.statusCode, body: JSON.stringify({ error: result.error }) };
  }

  // Enviar por email
  await transporter.sendMail({
    from: 'contratos@girasindómito.cl',
    to: email,
    subject: 'Cotización de Viaje - Giras Indómito',
    text: 'Adjunto encontrará la cotización de su viaje.',
    attachments: [
      {
        filename: 'cotizacion.pdf',
        content: result.base64,
        encoding: 'base64'
      }
    ]
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Cotización enviada exitosamente' })
  };
};
```

## Parámetros de Action

### `isPreview` (boolean)

- **`true`**: Genera el documento CON marca de agua "BORRADOR"
- **`false`**: Genera el documento SIN marca de agua (documento final)

### `hasSigned` (boolean)

- **`true`**: Genera el documento SIN firmas digitales (es una cotización)
- **`false`**: Genera el documento CON firmas digitales desde S3 (documento final para firma)

## Respuesta

La API retorna una respuesta compatible con la interfaz Angular v21:

```typescript
{
  "state": true,
  "metadata": {
    "statusCode": 200,
    "action": "Generar documento PDF en base64.",
    ...
  },
  "data": {
    "base64": "JVBERi0xLjcKJeLjz9..." // PDF en base64
  }
}
```

## Agregar un Nuevo Tipo de Documento

### 1. Crear el Builder

Crea un nuevo archivo `{scope}-builder.js` (ej: `pro-builder.js` para "PRO"):

```javascript
import { formatDate, formatCurrency } from '../pdf-generator/helpers/formatters.js';

/**
 * Builder para documentos de tipo PRO (Propuesta)
 */
export const buildDocumentData = (form = {}) => {
  // Extraer datos del formulario
  const { cliente, servicio, precio } = form;

  // Retornar estructura para el generador de PDF
  return {
    title: "PROPUESTA DE SERVICIOS",
    generalData: `Propuesta para ${cliente.nombre}...`,
    clauses: [
      {
        number: 1,
        title: "PRIMERO:",
        text: "Descripción del servicio..."
      }
    ],
    signatures: {
      operators: [...],
      clients: [...],
      companyName: 'GIRAS INDÓMITO LIMITADA',
      companyRut: '...'
    }
  };
};
```

### 2. Registrar en el Factory

Edita [`index.js`](index.js:1-63):

```javascript
import { buildDocumentData as buildPRODocument } from './pro-builder.js';

export const DOCUMENT_SCOPES = {
  CTT: 'CTT',
  DBA: 'DBA',
  DBR: 'DBR',
  PRO: 'PRO',  // ← Agregar nuevo scope
};

const BUILDERS = {
  [DOCUMENT_SCOPES.CTT]: buildCTTDocument,
  [DOCUMENT_SCOPES.DBA]: buildDBADocument,
  [DOCUMENT_SCOPES.DBR]: buildDBRDocument,
  [DOCUMENT_SCOPES.PRO]: buildPRODocument,  // ← Registrar builder
};
```

### 3. Listo!

El nuevo tipo de documento ya estará disponible automáticamente en el endpoint.

## Estructura de Datos del Builder

Todos los builders deben retornar un objeto con esta estructura:

```javascript
{
  title: string,           // Título del documento
  generalData: string,     // Texto introductorio
  clauses: [               // Cláusulas del documento
    {
      number: number,      // Número de cláusula
      title: string,       // Título (ej: "PRIMERO:")
      text: string,        // Texto de la cláusula
      detail?: {           // Detalle opcional (para listas)
        title: string,
        days: string,
        nights: string,
        services: string[]
      }
    }
  ],
  signatures: {            // Datos para página de firmas
    operators: [
      { name: string, rut: string }
    ],
    clients: [
      { name: string, rut: string }
    ],
    companyName: string,
    companyRut: string
  }
}
```

## Firmas Digitales

El sistema carga automáticamente las firmas desde S3 cuando `hasSigned = false`:

- **Ruta en S3**: `signatures/signature-{DNI}.png`
- **Formato**: PNG (imagen de firma escaneada)
- **Bucket**: Configurado en `BUCKET_INFO_GI`

Si no existe una firma para un DNI, se muestra una línea para firma manuscrita.

## Validación de Scopes

El sistema valida automáticamente que el scope sea soportado:

```javascript
import { isValidScope, getSupportedScopes } from './index.js';

if (!isValidScope('CTT')) {
  console.log('Scope no válido');
  console.log('Scopes disponibles:', getSupportedScopes());
  // => ['CTT', 'DBA', 'DBR']
}
```

## Ejemplos de Uso

### Generar Contrato Final (sin marca de agua, con firmas)

```bash
curl -X POST https://api.example.com/v1/documentos/pdf \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "CTT",
    "form": {
      "trip": { ... },
      "plan": { ... },
      "payments": { ... }
    },
    "action": {
      "isPreview": false,
      "hasSigned": false
    }
  }'
```

### Generar Borrador (con marca de agua, sin firmas)

```bash
curl -X POST https://api.example.com/v1/documentos/pdf \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "CTT",
    "form": { ... },
    "action": {
      "isPreview": true,
      "hasSigned": true
    }
  }'
```


## Notas Importantes

1. ✅ **Módulo reutilizable**: Puede usarse desde cualquier lambda del proyecto
2. ✅ **Extensibilidad**: Agregar nuevos tipos de documentos es simple y no afecta los existentes
3. ✅ **Validación automática**: El sistema valida scopes y parámetros requeridos
4. ✅ **Respuesta estandarizada**: Compatible con la interfaz TypeScript de Angular v21
5. ✅ **Firma y marca de agua configurables**: Control total mediante parámetros `action`
6. ⚠️ **Firmas opcionales**: Si no hay firma en S3, se muestra línea para firma manuscrita
7. ⚠️ **Builders placeholder**: DBA y DBR necesitan implementación según requerimientos

## API del Módulo `document-generator.js`

### Función: `generateDocument(params)`

**Parámetros:**
- `scope` (string, requerido): Tipo de documento (CTT, DBA, DBR)
- `form` (object, requerido): Datos del formulario
- `action` (object, opcional): Opciones de generación
  - `isPreview` (boolean): `true` = con marca de agua, `false` = sin marca de agua
  - `hasSigned` (boolean): `true` = sin firmas, `false` = con firmas
- `bucket` (string, requerido): Nombre del bucket S3

**Retorno:** `Promise<GenerateDocumentResult>`
```javascript
{
  success: boolean,
  base64?: string,           // Solo si success = true
  error?: string,            // Solo si success = false
  statusCode?: number,       // Solo si success = false
  supportedScopes?: string[] // Solo en errores de validación
}
```

### Funciones Auxiliares

```javascript
import { isValidScope, getSupportedScopes } from '../../../libs/document-generator.js';

isValidScope('CTT');        // true
isValidScope('INVALID');    // false
getSupportedScopes();       // ['CTT', 'DBA', 'DBR']
```
