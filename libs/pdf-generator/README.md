# Librería Genérica de Generación de PDF

Esta librería proporciona una solución genérica y reutilizable para generar documentos PDF con estructura de contratos, incluyendo headers, footers, cláusulas, firmas y marcas de agua.

## Estructura de Carpetas

```
libs/pdf-generator/
├── core/
│   ├── config.js          # Configuración de estilos y dimensiones del PDF
│   ├── image-loader.js    # Carga de imágenes desde S3 con caché
│   ├── layout.js          # Funciones de layout (headers, footers, paginación)
│   └── watermark.js       # Aplicación de marcas de agua
├── helpers/
│   └── formatters.js      # Formateadores (fechas, moneda, RUT)
├── index.js               # Función principal de generación
└── README.md              # Esta documentación
```

## Instalación

La librería ya está lista para usar. Solo necesitas importarla en tu lambda:

```javascript
import { generatePDF, loadImages } from '../../../libs/pdf-generator/index.js';
```

## Uso Básico

### 1. Preparar los datos del documento

```javascript
const documentData = {
  title: "TÍTULO DEL DOCUMENTO",
  generalData: "Datos generales o introducción del documento...",
  clauses: [
    {
      number: 1,
      title: "PRIMERO:",
      text: "Contenido de la primera cláusula..."
    },
    {
      number: 2,
      title: "SEGUNDO:",
      text: "Contenido de la segunda cláusula...",
      detail: {
        title: "DETALLES ADICIONALES",
        days: 5,
        nights: 4,
        services: [
          "Servicio 1",
          "Servicio 2",
          "Servicio 3"
        ]
      }
    }
  ],
  signatures: {
    operators: [
      { name: "Nombre Operador", rut: "12345678-9" }
    ],
    clients: [
      { name: "Nombre Cliente", rut: "98765432-1" }
    ],
    companyName: "NOMBRE DE LA EMPRESA"
  }
};
```

### 2. Cargar imágenes (Header y Footer)

```javascript
import { loadImages } from '../../../libs/pdf-generator/index.js';

const { headerImage, footerImage } = await loadImages(
  'nombre-bucket-s3',
  'ruta/header.png',
  'ruta/footer.png'
);
```

### 3. Generar el PDF

```javascript
const pdfBuffer = await generatePDF(
  documentData,
  headerImage,
  footerImage,
  {
    watermarkText: 'BORRADOR',  // Opcional
    addWatermark: true           // Opcional (default: true)
  }
);

// Convertir a base64 si es necesario
const base64PDF = pdfBuffer.toString('base64');
```

## Funciones Exportadas

### Función Principal

#### `generatePDF(documentData, headerImageBase64, footerImageBase64, options)`

Genera un PDF con los datos proporcionados.

**Parámetros:**
- `documentData` (Object): Estructura de datos del documento (ver ejemplo arriba)
- `headerImageBase64` (String): Imagen del header en base64
- `footerImageBase64` (String): Imagen del footer en base64
- `options` (Object, opcional):
  - `watermarkText` (String): Texto de la marca de agua (default: 'BORRADOR')
  - `addWatermark` (Boolean): Si agregar marca de agua (default: true)

**Retorna:** `Promise<Buffer>` - Buffer del PDF generado

### Funciones Auxiliares

#### `loadImages(bucket, headerKey, footerKey)`

Carga imágenes desde S3 con caché en memoria.

**Parámetros:**
- `bucket` (String): Nombre del bucket S3
- `headerKey` (String): Ruta de la imagen del header
- `footerKey` (String): Ruta de la imagen del footer

**Retorna:** `Promise<Object>` - `{ headerImage, footerImage }` en base64

#### `clearImageCache()`

Limpia el caché de imágenes (útil para testing).

#### `formatDate(dateString)`

Formatea fecha en español.

**Parámetros:**
- `dateString` (String): Fecha en formato DD-MM-YYYY o ISO

**Retorna:** `Object` - `{ full, simple }`

#### `formatCurrency(amount)`

Formatea número como moneda chilena (CLP).

**Parámetros:**
- `amount` (Number): Monto a formatear

**Retorna:** `String` - Monto formateado

#### `formatRut(rut)`

Formatea RUT chileno con puntos y guión.

**Parámetros:**
- `rut` (String): RUT sin formato

**Retorna:** `String` - RUT formateado

## Estructura de Datos Requerida

### documentData

```javascript
{
  title: String,           // Título del documento (requerido)
  generalData: String,     // Datos generales/introducción (requerido)
  clauses: Array<{         // Array de cláusulas (requerido)
    number: Number,        // Número de cláusula (opcional)
    title: String,         // Título de cláusula (opcional)
    text: String,          // Texto de cláusula (requerido)
    detail: {              // Detalles adicionales (opcional)
      title: String,
      days: Number,
      nights: Number,
      services: Array<String>
    }
  }>,
  signatures: {            // Datos de firmas (opcional)
    operators: Array<{
      name: String,
      rut: String
    }>,
    clients: Array<{
      name: String,
      rut: String
    }>,
    companyName: String
  }
}
```

## Ejemplo Completo

```javascript
import { generatePDF, loadImages } from '../../../libs/pdf-generator/index.js';

export const main = async (event) => {
  try {
    // 1. Parsear datos
    const { documentData } = JSON.parse(event.body);

    // 2. Cargar imágenes
    const { headerImage, footerImage } = await loadImages(
      process.env.BUCKET_NAME,
      'assets/header.png',
      'assets/footer.png'
    );

    // 3. Generar PDF
    const pdfBuffer = await generatePDF(
      documentData,
      headerImage,
      footerImage,
      {
        watermarkText: 'BORRADOR',
        addWatermark: true
      }
    );

    // 4. Retornar base64
    return {
      statusCode: 200,
      body: JSON.stringify({
        base64: pdfBuffer.toString('base64')
      })
    };
  } catch (error) {
    console.error('Error generando PDF:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

## Configuración

Puedes modificar la configuración de estilos y dimensiones editando:

```javascript
// libs/pdf-generator/core/config.js

export const PDF_CONFIG = {
  PAGE_WIDTH: 595,        // Ancho de página (A4)
  PAGE_HEIGHT: 842,       // Alto de página (A4)
  MARGIN: 50,             // Margen
  HEADER_HEIGHT: 60,      // Alto del header
  FOOTER_HEIGHT: 60       // Alto del footer
};

export const PDF_STYLES = {
  title: { size: 14, isBold: true },
  generalData: { size: 10, lineHeight: 15 },
  clauseText: { size: 10, lineHeight: 15 },
  // ... más estilos
};
```

## Notas

- La librería usa `pdf-lib` para la generación de PDFs
- Las imágenes deben estar en formato PNG
- El caché de imágenes se mantiene durante warm starts de Lambda
- La marca de agua es opcional y configurable
- Los headers y footers se agregan automáticamente en cada página
- La paginación se maneja automáticamente
