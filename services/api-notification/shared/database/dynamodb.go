package database

import (
	"context"
	"fmt"
	"sync"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"go.uber.org/zap"
)

var (
	dynamoClient     *dynamodb.Client
	dynamoClientOnce sync.Once
	dynamoInitErr    error
)

// MustDynamoClient retorna el cliente DynamoDB inicializado de forma lazy.
// Panic si falla la inicialización.
func MustDynamoClient(ctx context.Context, log *zap.Logger) *dynamodb.Client {
	dynamoClientOnce.Do(func() {
		dynamoClient, dynamoInitErr = initDynamoClient(ctx, log)
	})

	if dynamoInitErr != nil {
		log.Fatal("No se pudo inicializar el cliente DynamoDB", zap.Error(dynamoInitErr))
	}

	return dynamoClient
}

func initDynamoClient(ctx context.Context, log *zap.Logger) (*dynamodb.Client, error) {
	log.Info("Inicializando cliente DynamoDB")

	cfg, err := awsconfig.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("error al cargar configuración AWS: %w", err)
	}

	client := dynamodb.NewFromConfig(cfg)
	log.Info("Cliente DynamoDB inicializado correctamente")
	return client, nil
}
