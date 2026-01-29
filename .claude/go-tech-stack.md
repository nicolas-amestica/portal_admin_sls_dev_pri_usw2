# Tech Stack del Proyecto

Este documento describe las principales tecnologías, librerías y herramientas utilizadas en el proyecto.

## Backend

- **Lenguaje:** Go (versión 1.24)
- **Framework Principal:** [Echo (v4)](https://echo.labstack.com/)
- **Servidor de Aplicación:** La aplicación se ejecuta como un servicio compilado de Go, desplegado en AWS Lambda.

## Base de Datos

- **Sistema Gestor:** PostgreSQL
- **Drivers Go:** `github.com/lib/pq` y `github.com/jackc/pgx/v5`
- **Migraciones:** Se gestionan con scripts SQL nativos.

## Infraestructura y Despliegue (IaC)

- **Proveedor Cloud:** Amazon Web Services (AWS)
- **Herramienta de IaC:** Terraform
- **Servicios Principales de AWS:**
    - **Computo:** AWS Lambda para la API, Amazon EC2 para un bastion host.
    - **Base de Datos:** DynamoDB.
    - **Redes:** Amazon VPC, Subredes públicas y privadas, y Security Groups.
    - **API Gateway:** Para exponer la función Lambda como un endpoint HTTP.
    - **Almacenamiento de Secretos:** AWS Secrets Manager para credenciales de la base de datos.
    - **Almacenamiento:** Amazon S3 para el backend.

## CI/CD y Automatización

- **Scripts:** Se utilizan scripts de Shell (`.sh`) para automatizar tareas de despliegue, migraciones y ejecución del entorno local.

## Librerías Clave de Go

- **AWS SDK:** `github.com/aws/aws-sdk-go-v2` para la integración con servicios de AWS.
- **Autenticación:** `github.com/golang-jwt/jwt/v5` para la generación y validación de tokens JWT.
- **Logging:** `go.uber.org/zap` para un logging estructurado y de alto rendimiento.
- **Validación:** `github.com/go-playground/validator/v10` para la validación de structs.
- **Email:** `github.com/go-gomail/gomail` para el envío de correos transaccionales.
- **Ofimática:**
    - `github.com/xuri/excelize/v2` para la creación y manipulación de archivos Excel.
    - `github.com/skip2/go-qrcode` para la generación de códigos QR.
- **GraphQL:** `github.com/machinebox/graphql` como cliente GraphQL.
