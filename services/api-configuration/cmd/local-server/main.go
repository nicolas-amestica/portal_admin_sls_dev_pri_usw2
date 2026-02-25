package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/indomito/portal-admin/api-configuration/internal/config"
	"github.com/indomito/portal-admin/api-configuration/internal/database"
	"go.uber.org/zap"
)

var (
	logger        *zap.Logger
	getService    config.GetConfigServiceFunc
	updateService config.UpdateConfigServiceFunc
)

func init() {
	var err error
	logger, err = zap.NewDevelopment()
	if err != nil {
		panic(fmt.Sprintf("Failed to initialize logger: %v", err))
	}

	// Configurar tabla DynamoDB local
	tableName := os.Getenv("DYNAMODB_CONFIG_TABLE")
	if tableName == "" {
		tableName = "portal-admin-config-dev-pri-usw2"
		logger.Warn("DYNAMODB_CONFIG_TABLE not set, using default", zap.String("table", tableName))
	}

	ctx := context.Background()
	dynamoClient := database.MustClient(ctx, logger)

	// Composición de servicios
	getRepo := config.NewGetGlobalConfig(dynamoClient, tableName, logger)
	getService = config.NewGetConfigService(getRepo, logger)

	updateRepo := config.NewUpdateGlobalConfig(dynamoClient, tableName, logger)
	updateService = config.NewUpdateConfigService(updateRepo, logger)

	logger.Info("Local server initialized", zap.String("table", tableName))
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	http.HandleFunc("/v1/configuracion/global", configHandler)
	http.HandleFunc("/health", healthHandler)

	logger.Info("Starting local server", zap.String("port", port))
	if err := http.ListenAndServe(":"+port, enableCORS(http.DefaultServeMux)); err != nil {
		logger.Fatal("Failed to start server", zap.Error(err))
	}
}

func configHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	logger.Info("Incoming request",
		zap.String("method", r.Method),
		zap.String("path", r.URL.Path),
	)

	// Convertir HTTP request a APIGatewayV2HTTPRequest
	apiGatewayRequest := httpToAPIGateway(r)

	var response events.APIGatewayV2HTTPResponse
	var err error

	switch r.Method {
	case http.MethodGet:
		response, err = handleGet(ctx, apiGatewayRequest)
	case http.MethodPost:
		response, err = handlePost(ctx, apiGatewayRequest)
	case http.MethodOptions:
		// Preflight CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "*")
		w.WriteHeader(http.StatusOK)
		return
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err != nil {
		logger.Error("Handler error", zap.Error(err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Escribir respuesta
	writeAPIGatewayResponse(w, response)
}

func handleGet(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	configData, err := getService(ctx)
	if err != nil {
		return errorResponse(err, "Obtener configuración global")
	}

	return successResponse(configData, "Obtener configuración global")
}

func handlePost(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var req config.UpdateConfigRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		logger.Warn("Invalid JSON body", zap.Error(err))
		return errorResponse(fmt.Errorf("body JSON inválido"), "Actualizar configuración global")
	}

	if err := updateService(ctx, &req); err != nil {
		return errorResponse(err, "Actualizar configuración global")
	}

	return successResponseUpdate("Actualizar configuración global")
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
	})
}

func httpToAPIGateway(r *http.Request) events.APIGatewayV2HTTPRequest {
	body := ""
	if r.Body != nil {
		bodyBytes, _ := io.ReadAll(r.Body)
		body = string(bodyBytes)
	}

	headers := make(map[string]string)
	for k, v := range r.Header {
		if len(v) > 0 {
			headers[k] = v[0]
		}
	}

	return events.APIGatewayV2HTTPRequest{
		HTTPMethod: r.Method,
		Path:       r.URL.Path,
		Headers:    headers,
		Body:       body,
		RequestContext: events.APIGatewayV2HTTPRequestContext{
			RequestID: "local-" + r.RemoteAddr,
		},
	}
}

func writeAPIGatewayResponse(w http.ResponseWriter, response events.APIGatewayV2HTTPResponse) {
	// Headers
	for k, v := range response.Headers {
		w.Header().Set(k, v)
	}

	// Status code
	w.WriteHeader(response.StatusCode)

	// Body
	w.Write([]byte(response.Body))
}

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

	body, _ := json.Marshal(response)

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

func successResponseUpdate(actionName string) (events.APIGatewayV2HTTPResponse, error) {
	response := map[string]interface{}{
		"state": true,
		"metadata": map[string]interface{}{
			"statusCode": 200,
			"action":     actionName,
		},
		"data": map[string]interface{}{
			"success": true,
			"message": "Configuración global actualizada correctamente",
		},
	}

	body, _ := json.Marshal(response)

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

func errorResponse(err error, actionName string) (events.APIGatewayV2HTTPResponse, error) {
	response := map[string]interface{}{
		"state": false,
		"metadata": map[string]interface{}{
			"statusCode": 500,
			"action":     actionName,
		},
		"data": map[string]interface{}{
			"message": err.Error(),
		},
	}

	body, _ := json.Marshal(response)

	return events.APIGatewayV2HTTPResponse{
		StatusCode: 500,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Headers": "*",
		},
		Body: string(body),
	}, nil
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "*")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
