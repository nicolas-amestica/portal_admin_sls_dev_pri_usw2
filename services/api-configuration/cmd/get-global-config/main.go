package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/indomito/portal-admin/api-configuration/internal/config"
	"github.com/indomito/portal-admin/api-configuration/internal/database"
	"github.com/indomito/portal-admin/api-configuration/shared/apperr"
	"go.uber.org/zap"
)

var (
	log        *zap.Logger
	getService config.GetConfigServiceFunc
)

const action = "Obtener configuración global"

// init inicializa el logger y el servicio una sola vez (optimización cold start).
func init() {
	var err error
	log, err = zap.NewProduction()
	if err != nil {
		panic(fmt.Sprintf("Failed to initialize logger: %v", err))
	}

	tableName := os.Getenv("DYNAMODB_CONFIG_TABLE")
	if tableName == "" {
		log.Fatal("DYNAMODB_CONFIG_TABLE environment variable is required")
	}

	ctx := context.Background()
	dynamoClient := database.MustClient(ctx, log)

	// Composición funcional: Repository -> Service
	getRepo := config.NewGetGlobalConfig(dynamoClient, tableName, log)
	getService = config.NewGetConfigService(getRepo, log)

	log.Info("Lambda initialized successfully",
		zap.String("handler", "get-global-config"),
		zap.String("table", tableName),
	)
}

// Handler maneja las peticiones GET de configuración global.
func Handler(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	log.Info("Processing GET global config request",
		zap.String("requestId", request.RequestContext.RequestID),
	)

	// Ejecutar servicio
	configData, err := getService(ctx)
	if err != nil {
		return handleError(err, action)
	}

	// Respuesta exitosa
	return successResponse(configData, action)
}

// successResponse construye una respuesta exitosa compatible con el formato Node.js.
func successResponse(data interface{}, actionName string) (events.APIGatewayV2HTTPResponse, error) {
	response := map[string]interface{}{
		"state": true,
		"metadata": map[string]interface{}{
			"statusCode": 200,
			"action":     actionName,
		},
		"data": map[string]interface{}{
			"success": true,
			"data":    data,
		},
	}

	body, err := json.Marshal(response)
	if err != nil {
		log.Error("Failed to marshal success response", zap.Error(err))
		return events.APIGatewayV2HTTPResponse{StatusCode: 500}, err
	}

	log.Info("Request processed successfully",
		zap.String("action", actionName),
		zap.Int("statusCode", 200),
	)

	return events.APIGatewayV2HTTPResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers": "*",
		},
		Body: string(body),
	}, nil
}

// handleError maneja errores y retorna respuestas HTTP apropiadas.
func handleError(err error, actionName string) (events.APIGatewayV2HTTPResponse, error) {
	var appErr *apperr.AppError

	// Verificar si es un AppError
	if e, ok := err.(*apperr.AppError); ok {
		appErr = e
	} else {
		// Error inesperado
		appErr = apperr.InternalServer("Error inesperado", err)
	}

	statusCode := appErr.StatusCode
	body := appErr.ToJSON(actionName)

	log.Error("Request failed",
		zap.String("action", actionName),
		zap.Int("statusCode", statusCode),
		zap.Error(err),
	)

	return events.APIGatewayV2HTTPResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers": "*",
		},
		Body: string(body),
	}, nil
}

func main() {
	lambda.Start(Handler)
}
