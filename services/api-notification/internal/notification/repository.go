package notification

import (
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	dynamodbtypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"go.uber.org/zap"
)

// GetProgramFunc es el tipo de función para obtener un programa desde DynamoDB.
type GetProgramFunc func(ctx context.Context, sk string) (*ProgramItem, error)

// DownloadContractPDFsFunc es el tipo de función para descargar los PDFs del contrato desde S3.
type DownloadContractPDFsFunc func(ctx context.Context, files []ContractFile) ([]AttachedPDF, error)

// NewGetProgram crea una función para consultar un programa por sk usando GetItem.
// Usa pk (partition key fija del programa) + sk (sort key del programa específico).
func NewGetProgram(client *dynamodb.Client, tableName, programPK string, log *zap.Logger) GetProgramFunc {
	return func(ctx context.Context, sk string) (*ProgramItem, error) {
		log.Info("Consultando programa en DynamoDB",
			zap.String("table", tableName),
			zap.String("pk", programPK),
			zap.String("sk", sk),
		)

		result, err := client.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: aws.String(tableName),
			Key: map[string]dynamodbtypes.AttributeValue{
				"pk": &dynamodbtypes.AttributeValueMemberS{Value: programPK},
				"sk": &dynamodbtypes.AttributeValueMemberS{Value: sk},
			},
		})
		if err != nil {
			log.Error("Error al consultar DynamoDB", zap.Error(err))
			return nil, fmt.Errorf("error al obtener programa: %w", err)
		}

		if result.Item == nil {
			log.Warn("Programa no encontrado", zap.String("sk", sk))
			return nil, nil
		}

		var program ProgramItem
		if err := attributevalue.UnmarshalMap(result.Item, &program); err != nil {
			log.Error("Error al deserializar programa", zap.Error(err))
			return nil, fmt.Errorf("error al deserializar programa: %w", err)
		}

		log.Info("Programa obtenido correctamente", zap.String("sk", sk))
		return &program, nil
	}
}

// NewDownloadContractPDFs crea una función para descargar todos los PDFs del contrato desde S3.
func NewDownloadContractPDFs(client *s3.Client, log *zap.Logger) DownloadContractPDFsFunc {
	return func(ctx context.Context, files []ContractFile) ([]AttachedPDF, error) {
		pdfs := make([]AttachedPDF, 0, len(files))

		for _, f := range files {
			key := fmt.Sprintf("%s/%s", f.Path, f.Key)

			log.Info("Descargando PDF desde S3",
				zap.String("bucket", f.Bucket),
				zap.String("key", key),
			)

			out, err := client.GetObject(ctx, &s3.GetObjectInput{
				Bucket: aws.String(f.Bucket),
				Key:    aws.String(key),
			})
			if err != nil {
				log.Error("Error al descargar PDF de S3",
					zap.String("bucket", f.Bucket),
					zap.String("key", key),
					zap.Error(err),
				)
				return nil, fmt.Errorf("error al descargar PDF %s: %w", key, err)
			}
			defer out.Body.Close()

			data, err := io.ReadAll(out.Body)
			if err != nil {
				return nil, fmt.Errorf("error al leer cuerpo del PDF %s: %w", key, err)
			}

			pdfs = append(pdfs, AttachedPDF{
				Filename: f.Key,
				Data:     data,
			})

			log.Info("PDF descargado correctamente",
				zap.String("filename", f.Key),
				zap.Int("bytes", len(data)),
			)
		}

		return pdfs, nil
	}
}
