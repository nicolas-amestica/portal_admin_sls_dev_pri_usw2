package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/indomito/portal-admin/api-notification/internal/notification"
	"github.com/indomito/portal-admin/api-notification/shared/apperr"
	"github.com/indomito/portal-admin/api-notification/shared/database"
	"go.uber.org/zap"
)

var (
	log     *zap.Logger
	service notification.SendNotificationFunc
)

const action = "Enviar notificación"

// init inicializa el logger y el servicio una sola vez (optimización cold start).
func init() {
	var err error
	log, err = zap.NewProduction()
	if err != nil {
		panic(fmt.Sprintf("Error al inicializar logger: %v", err))
	}

	stage := os.Getenv("STAGE")
	if stage == "" {
		log.Fatal("Variable de entorno STAGE es requerida")
	}

	programTable := os.Getenv("DYNAMODB_PROGRAM_TABLE")
	if programTable == "" {
		log.Fatal("Variable de entorno DYNAMODB_PROGRAM_TABLE es requerida")
	}

	programPK := os.Getenv("PROGRAM_TABLE")
	if programPK == "" {
		log.Fatal("Variable de entorno PROGRAM_TABLE es requerida")
	}

	emailConfigKey := os.Getenv("EMAIL_CONFIG_SECRET_KEY")
	if emailConfigKey == "" {
		log.Fatal("Variable de entorno EMAIL_CONFIG_SECRET_KEY es requerida")
	}

	ctx := context.Background()

	dynamoClient := database.MustDynamoClient(ctx, log)
	s3Client := database.MustS3Client(ctx, log)
	ssmClient := database.MustSSMClient(ctx, log)

	// Composición funcional: Repository → Service
	getProgram := notification.NewGetProgram(dynamoClient, programTable, programPK, log)
	downloadPDFs := notification.NewDownloadContractPDFs(s3Client, log)
	getEmailConfig := notification.NewGetEmailConfig(ssmClient, emailConfigKey, log)
	sendEmail := notification.NewSendEmail(getEmailConfig, stage, log)

	service = notification.NewSendNotificationService(getProgram, downloadPDFs, sendEmail, stage, log)

	log.Info("Lambda inicializada correctamente",
		zap.String("handler", "send-notification"),
		zap.String("stage", stage),
		zap.String("programTable", programTable),
	)
}

// Handler procesa las solicitudes POST de envío de notificaciones.
func Handler(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	log.Info("Procesando solicitud de notificación",
		zap.String("requestId", request.RequestContext.RequestID),
	)

	var req notification.SendRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		log.Warn("Body JSON inválido", zap.Error(err))
		return handleError(apperr.BadRequest("Body JSON inválido"), action)
	}

	result, err := service(ctx, &req)
	if err != nil {
		return handleError(err, action)
	}

	return successResponse(result, action)
}

// successResponse construye una respuesta exitosa compatible con el formato del portal.
func successResponse(data interface{}, actionName string) (events.APIGatewayV2HTTPResponse, error) {
	response := map[string]interface{}{
		"state": true,
		"metadata": map[string]interface{}{
			"statusCode": 200,
			"action":     actionName,
		},
		"data": data,
	}

	body, err := json.Marshal(response)
	if err != nil {
		log.Error("Error al serializar respuesta exitosa", zap.Error(err))
		return events.APIGatewayV2HTTPResponse{StatusCode: 500}, err
	}

	log.Info("Solicitud procesada correctamente",
		zap.String("action", actionName),
		zap.Int("statusCode", 200),
	)

	return events.APIGatewayV2HTTPResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Headers": "*",
		},
		Body: string(body),
	}, nil
}

// handleError convierte un error en respuesta HTTP apropiada.
func handleError(err error, actionName string) (events.APIGatewayV2HTTPResponse, error) {
	var appErr *apperr.AppError

	if e, ok := err.(*apperr.AppError); ok {
		appErr = e
	} else {
		appErr = apperr.InternalServer("Error inesperado", err)
	}

	log.Error("Solicitud fallida",
		zap.String("action", actionName),
		zap.Int("statusCode", appErr.StatusCode),
		zap.Error(err),
	)

	return events.APIGatewayV2HTTPResponse{
		StatusCode: appErr.StatusCode,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Headers": "*",
		},
		Body: string(appErr.ToJSON(actionName)),
	}, nil
}

func main() {
	lambda.Start(Handler)
}
