package config

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"go.uber.org/zap"
)

const (
	configPK = "CONFIG"
	configSK = "GLOBAL"
)

// GlobalConfig representa la configuración global del portal.
type GlobalConfig struct {
	PK             string    `dynamodbav:"pk"`
	SK             string    `dynamodbav:"sk"`
	IvaRateCrew    float64   `dynamodbav:"ivaRateCrew"`
	IvaRateService float64   `dynamodbav:"ivaRateService"`
	UpdatedAt      time.Time `dynamodbav:"updatedAt"`
}

// GetGlobalConfigFunc define el tipo de función para obtener configuración global.
type GetGlobalConfigFunc func(ctx context.Context) (*GlobalConfig, error)

// UpdateGlobalConfigFunc define el tipo de función para actualizar configuración global.
type UpdateGlobalConfigFunc func(ctx context.Context, ivaRateCrew, ivaRateService float64) error

// NewGetGlobalConfig crea una función para obtener configuración global desde DynamoDB.
// Utiliza acoplamiento estrecho con el cliente global para simplicidad.
func NewGetGlobalConfig(client *dynamodb.Client, tableName string, log *zap.Logger) GetGlobalConfigFunc {
	return func(ctx context.Context) (*GlobalConfig, error) {
		log.Info("Fetching global configuration from DynamoDB",
			zap.String("table", tableName),
			zap.String("pk", configPK),
			zap.String("sk", configSK),
		)

		result, err := client.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: aws.String(tableName),
			Key: map[string]types.AttributeValue{
				"pk": &types.AttributeValueMemberS{Value: configPK},
				"sk": &types.AttributeValueMemberS{Value: configSK},
			},
		})

		if err != nil {
			log.Error("Failed to get global config from DynamoDB", zap.Error(err))
			return nil, fmt.Errorf("failed to get global config: %w", err)
		}

		// Si no existe configuración, retornar valores por defecto
		if result.Item == nil {
			log.Warn("Global config not found, returning defaults")
			return &GlobalConfig{
				PK:             configPK,
				SK:             configSK,
				IvaRateCrew:    0.1525, // 15.25%
				IvaRateService: 0.19,   // 19%
			}, nil
		}

		var config GlobalConfig
		if err := attributevalue.UnmarshalMap(result.Item, &config); err != nil {
			log.Error("Failed to unmarshal global config", zap.Error(err))
			return nil, fmt.Errorf("failed to unmarshal config: %w", err)
		}

		log.Info("Global configuration retrieved successfully",
			zap.Float64("ivaRateCrew", config.IvaRateCrew),
			zap.Float64("ivaRateService", config.IvaRateService),
		)

		return &config, nil
	}
}

// NewUpdateGlobalConfig crea una función para actualizar configuración global en DynamoDB.
func NewUpdateGlobalConfig(client *dynamodb.Client, tableName string, log *zap.Logger) UpdateGlobalConfigFunc {
	return func(ctx context.Context, ivaRateCrew, ivaRateService float64) error {
		log.Info("Updating global configuration in DynamoDB",
			zap.String("table", tableName),
			zap.Float64("ivaRateCrew", ivaRateCrew),
			zap.Float64("ivaRateService", ivaRateService),
		)

		item := GlobalConfig{
			PK:             configPK,
			SK:             configSK,
			IvaRateCrew:    ivaRateCrew,
			IvaRateService: ivaRateService,
			UpdatedAt:      time.Now(),
		}

		av, err := attributevalue.MarshalMap(item)
		if err != nil {
			log.Error("Failed to marshal global config", zap.Error(err))
			return fmt.Errorf("failed to marshal config: %w", err)
		}

		_, err = client.PutItem(ctx, &dynamodb.PutItemInput{
			TableName: aws.String(tableName),
			Item:      av,
		})

		if err != nil {
			log.Error("Failed to put global config to DynamoDB", zap.Error(err))
			return fmt.Errorf("failed to update global config: %w", err)
		}

		log.Info("Global configuration updated successfully")
		return nil
	}
}
