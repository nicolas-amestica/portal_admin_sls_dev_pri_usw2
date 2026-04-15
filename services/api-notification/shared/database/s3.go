package database

import (
	"context"
	"fmt"
	"sync"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"go.uber.org/zap"
)

var (
	s3Client     *s3.Client
	s3ClientOnce sync.Once
	s3InitErr    error
)

// MustS3Client retorna el cliente S3 inicializado de forma lazy.
// Panic si falla la inicialización.
func MustS3Client(ctx context.Context, log *zap.Logger) *s3.Client {
	s3ClientOnce.Do(func() {
		s3Client, s3InitErr = initS3Client(ctx, log)
	})

	if s3InitErr != nil {
		log.Fatal("No se pudo inicializar el cliente S3", zap.Error(s3InitErr))
	}

	return s3Client
}

func initS3Client(ctx context.Context, log *zap.Logger) (*s3.Client, error) {
	log.Info("Inicializando cliente S3")

	cfg, err := awsconfig.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("error al cargar configuración AWS: %w", err)
	}

	client := s3.NewFromConfig(cfg)
	log.Info("Cliente S3 inicializado correctamente")
	return client, nil
}
