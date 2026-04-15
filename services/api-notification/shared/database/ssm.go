package database

import (
	"context"
	"fmt"
	"sync"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"go.uber.org/zap"
)

var (
	ssmClient     *ssm.Client
	ssmClientOnce sync.Once
	ssmInitErr    error
)

// MustSSMClient retorna el cliente SSM inicializado de forma lazy.
// Panic si falla la inicialización.
func MustSSMClient(ctx context.Context, log *zap.Logger) *ssm.Client {
	ssmClientOnce.Do(func() {
		ssmClient, ssmInitErr = initSSMClient(ctx, log)
	})

	if ssmInitErr != nil {
		log.Fatal("No se pudo inicializar el cliente SSM", zap.Error(ssmInitErr))
	}

	return ssmClient
}

func initSSMClient(ctx context.Context, log *zap.Logger) (*ssm.Client, error) {
	log.Info("Inicializando cliente SSM")

	cfg, err := awsconfig.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("error al cargar configuración AWS: %w", err)
	}

	client := ssm.NewFromConfig(cfg)
	log.Info("Cliente SSM inicializado correctamente")
	return client, nil
}
