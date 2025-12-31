# Ejemplos de Uso de la Librería PDF Generator

## Caso 1: Uso desde un Lambda Simple

Este es el ejemplo más básico de cómo usar la librería desde cualquier lambda.

```javascript
import { generatePDF, loadImages } from '../../libs/pdf-generator/index.js';

export const main = async (event) => {
  try {
    // 1. Preparar datos del documento
    const documentData = {
      title: "MI DOCUMENTO PERSONALIZADO",
      generalData: "Este es un documento de ejemplo generado con la librería genérica.",
      clauses: [
        {
          title: "CLÁUSULA 1:",
          text: "Este es el contenido de la primera cláusula del documento."
        },
        {
          title: "CLÁUSULA 2:",
          text: "Este es el contenido de la segunda cláusula."
        }
      ],
      signatures: {
        operators: [
          { name: "Juan Pérez", rut: "12345678-9" }
        ],
        clients: [
          { name: "María González", rut: "98765432-1" }
        ],
        companyName: "MI EMPRESA LTDA"
      }
    };

    // 2. Cargar imágenes de header y footer
    const { headerImage, footerImage } = await loadImages(
      process.env.BUCKET_NAME,
      'assets/header.png',
      'assets/footer.png'
    );

    // 3. Generar PDF
    const pdfBuffer = await generatePDF(
      documentData,
      headerImage,
      footerImage
    );

    // 4. Retornar en base64
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        pdf: pdfBuffer.toString('base64')
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

## Caso 2: PDF Sin Marca de Agua

```javascript
import { generatePDF, loadImages } from '../../libs/pdf-generator/index.js';

export const main = async (event) => {
  const { documentData } = JSON.parse(event.body);

  const { headerImage, footerImage } = await loadImages(
    process.env.BUCKET_NAME,
    'assets/header.png',
    'assets/footer.png'
  );

  // Generar PDF sin marca de agua
  const pdfBuffer = await generatePDF(
    documentData,
    headerImage,
    footerImage,
    {
      addWatermark: false  // Desactivar marca de agua
    }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      pdf: pdfBuffer.toString('base64')
    })
  };
};
```

## Caso 3: PDF con Marca de Agua Personalizada

```javascript
import { generatePDF, loadImages } from '../../libs/pdf-generator/index.js';

export const main = async (event) => {
  const { documentData } = JSON.parse(event.body);

  const { headerImage, footerImage } = await loadImages(
    process.env.BUCKET_NAME,
    'assets/header.png',
    'assets/footer.png'
  );

  // PDF con marca de agua personalizada
  const pdfBuffer = await generatePDF(
    documentData,
    headerImage,
    footerImage,
    {
      watermarkText: 'CONFIDENCIAL',
      addWatermark: true
    }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      pdf: pdfBuffer.toString('base64')
    })
  };
};
```

## Caso 4: Usando Helpers de Formato

```javascript
import {
  generatePDF,
  loadImages,
  formatDate,
  formatCurrency,
  formatRut
} from '../../libs/pdf-generator/index.js';

export const main = async (event) => {
  const { contractData } = JSON.parse(event.body);

  // Usar helpers para formatear datos
  const formattedDate = formatDate('31-12-2024');
  const formattedPrice = formatCurrency(1500000);
  const formattedRut = formatRut('12345678-9');

  const documentData = {
    title: "CONTRATO DE SERVICIO",
    generalData: `Contrato firmado el ${formattedDate.simple} por un valor de ${formattedPrice}`,
    clauses: [
      {
        title: "DATOS DEL CLIENTE:",
        text: `RUT: ${formattedRut}, valor acordado: ${formattedPrice}`
      }
    ],
    signatures: {
      operators: [{ name: "Operador", rut: "12345678-9" }],
      clients: [{ name: "Cliente", rut: contractData.clientRut }]
    }
  };

  const { headerImage, footerImage } = await loadImages(
    process.env.BUCKET_NAME,
    'assets/header.png',
    'assets/footer.png'
  );

  const pdfBuffer = await generatePDF(documentData, headerImage, footerImage);

  return {
    statusCode: 200,
    body: JSON.stringify({ pdf: pdfBuffer.toString('base64') })
  };
};
```

## Caso 5: Documento con Servicios Detallados

```javascript
import { generatePDF, loadImages } from '../../libs/pdf-generator/index.js';

export const main = async (event) => {
  const documentData = {
    title: "PROPUESTA DE SERVICIOS",
    generalData: "Propuesta comercial para servicios turísticos.",
    clauses: [
      {
        title: "PROGRAMA INCLUIDO:",
        text: "El programa turístico incluye los siguientes servicios:",
        detail: {
          title: "TOUR COMPLETO",
          days: 7,
          nights: 6,
          services: [
            "Transporte terrestre durante todo el programa",
            "Alojamiento en hoteles 4 estrellas",
            "Desayuno diario incluido",
            "Guía turístico profesional",
            "Entradas a todos los atractivos mencionados",
            "Seguro de viaje"
          ]
        }
      },
      {
        title: "CONDICIONES:",
        text: "Las condiciones de pago y cancelación se detallan a continuación..."
      }
    ],
    signatures: {
      operators: [
        { name: "Pedro Silva", rut: "11111111-1" }
      ],
      clients: [
        { name: "Ana Torres", rut: "22222222-2" }
      ],
      companyName: "TOURS Y VIAJES LTDA"
    }
  };

  const { headerImage, footerImage } = await loadImages(
    process.env.BUCKET_NAME,
    'assets/header.png',
    'assets/footer.png'
  );

  const pdfBuffer = await generatePDF(documentData, headerImage, footerImage);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=propuesta.pdf'
    },
    body: pdfBuffer.toString('base64'),
    isBase64Encoded: true
  };
};
```

## Caso 6: Construir Datos Dinámicamente con Builder Personalizado

```javascript
import { generatePDF, loadImages, formatDate, formatCurrency } from '../../libs/pdf-generator/index.js';

// Builder personalizado para tu tipo de documento
const buildMyDocumentData = (rawData) => {
  const { client, service, pricing } = rawData;

  return {
    title: "CONTRATO DE PRESTACIÓN DE SERVICIOS",
    generalData: `En Santiago, ${formatDate(new Date().toISOString()).simple}, entre MI EMPRESA y ${client.name}...`,
    clauses: [
      {
        number: 1,
        title: "PRIMERO:",
        text: `El servicio contratado es: ${service.name}`
      },
      {
        number: 2,
        title: "SEGUNDO:",
        text: `El valor del servicio es de ${formatCurrency(pricing.total)}`
      }
    ],
    signatures: {
      operators: [
        { name: "Gerente Comercial", rut: "11111111-1" }
      ],
      clients: [
        { name: client.name, rut: client.rut }
      ],
      companyName: "MI EMPRESA LTDA"
    }
  };
};

export const main = async (event) => {
  const rawData = JSON.parse(event.body);

  // Construir datos usando tu builder
  const documentData = buildMyDocumentData(rawData);

  const { headerImage, footerImage } = await loadImages(
    process.env.BUCKET_NAME,
    'assets/header.png',
    'assets/footer.png'
  );

  const pdfBuffer = await generatePDF(documentData, headerImage, footerImage);

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      pdf: pdfBuffer.toString('base64')
    })
  };
};
```

## Notas Importantes

1. **Rutas de Importación**: Ajusta las rutas de importación según dónde esté ubicado tu lambda respecto a la carpeta `libs/pdf-generator/`

2. **Variables de Entorno**: Asegúrate de tener configuradas las variables necesarias:
   - `BUCKET_NAME`: Nombre del bucket S3 donde están las imágenes

3. **Imágenes**: Las imágenes de header y footer deben estar en formato PNG en S3

4. **Caché**: La librería cachea las imágenes automáticamente en memoria para mejorar el rendimiento en warm starts

5. **Estructura de Datos**: Respeta la estructura de `documentData` especificada en el README principal
