package database

import (
	"context"
	"fmt"
	"sync"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"go.uber.org/zap"
)

var (
	client     *dynamodb.Client
	clientOnce sync.Once
	initErr    error
)

// MustClient retorna el cliente DynamoDB inicializado de forma lazy.
// Utiliza estado global para optimizar cold starts en Lambda.
// Panic si falla la inicialización.
func MustClient(ctx context.Context, log *zap.Logger) *dynamodb.Client {
	clientOnce.Do(func() {
		client, initErr = initClient(ctx, log)
	})

	if initErr != nil {
		log.Fatal("Failed to initialize DynamoDB client", zap.Error(initErr))
	}

	return client
}

// Client retorna el cliente DynamoDB inicializado de forma lazy.
// Retorna error si falla la inicialización.
func Client(ctx context.Context, log *zap.Logger) (*dynamodb.Client, error) {
	clientOnce.Do(func() {
		client, initErr = initClient(ctx, log)
	})

	if initErr != nil {
		return nil, fmt.Errorf("failed to initialize DynamoDB client: %w", initErr)
	}

	return client, nil
}

// initClient inicializa el cliente DynamoDB con la configuración de AWS.
func initClient(ctx context.Context, log *zap.Logger) (*dynamodb.Client, error) {
	log.Info("Initializing DynamoDB client")

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	client := dynamodb.NewFromConfig(cfg)

	log.Info("DynamoDB client initialized successfully")
	return client, nil
}
