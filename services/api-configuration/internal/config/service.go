package config

import (
	"context"
	"fmt"

	"github.com/indomito/portal-admin/api-configuration/shared/apperr"
	"go.uber.org/zap"
)

// UpdateConfigRequest representa el payload de actualización de configuración.
type UpdateConfigRequest struct {
	IvaRateCrew    float64 `json:"ivaRateCrew" validate:"required,gte=0,lte=1"`
	IvaRateService float64 `json:"ivaRateService" validate:"required,gte=0,lte=1"`
}

// ConfigResponse representa la respuesta de configuración global.
type ConfigResponse struct {
	IvaRateCrew    float64 `json:"ivaRateCrew"`
	IvaRateService float64 `json:"ivaRateService"`
}

// GetConfigServiceFunc define el tipo de función del servicio de obtención.
type GetConfigServiceFunc func(ctx context.Context) (*ConfigResponse, error)

// UpdateConfigServiceFunc define el tipo de función del servicio de actualización.
type UpdateConfigServiceFunc func(ctx context.Context, req *UpdateConfigRequest) error

// NewGetConfigService crea una función de servicio para obtener configuración global.
// Utiliza closure para capturar las dependencias (repository y logger).
func NewGetConfigService(getRepo GetGlobalConfigFunc, log *zap.Logger) GetConfigServiceFunc {
	return func(ctx context.Context) (*ConfigResponse, error) {
		log.Info("Service: Getting global configuration")

		config, err := getRepo(ctx)
		if err != nil {
			log.Error("Service: Failed to get global config", zap.Error(err))
			return nil, apperr.InternalServer("Error al obtener configuración global", err)
		}

		response := &ConfigResponse{
			IvaRateCrew:    config.IvaRateCrew,
			IvaRateService: config.IvaRateService,
		}

		log.Info("Service: Global configuration retrieved successfully")
		return response, nil
	}
}

// NewUpdateConfigService crea una función de servicio para actualizar configuración global.
// Valida los datos de entrada y delega la persistencia al repository.
func NewUpdateConfigService(updateRepo UpdateGlobalConfigFunc, log *zap.Logger) UpdateConfigServiceFunc {
	return func(ctx context.Context, req *UpdateConfigRequest) error {
		log.Info("Service: Updating global configuration",
			zap.Float64("ivaRateCrew", req.IvaRateCrew),
			zap.Float64("ivaRateService", req.IvaRateService),
		)

		// Validar rangos
		if err := validateConfigRequest(req); err != nil {
			log.Warn("Service: Invalid config request", zap.Error(err))
			return err
		}

		// Persistir en DynamoDB
		if err := updateRepo(ctx, req.IvaRateCrew, req.IvaRateService); err != nil {
			log.Error("Service: Failed to update global config", zap.Error(err))
			return apperr.InternalServer("Error al actualizar configuración global", err)
		}

		log.Info("Service: Global configuration updated successfully")
		return nil
	}
}

// validateConfigRequest valida el payload de configuración global.
// Retorna apperr.AppError con código 400 si la validación falla.
func validateConfigRequest(req *UpdateConfigRequest) error {
	if req.IvaRateCrew < 0 || req.IvaRateCrew > 1 {
		return apperr.BadRequest(
			fmt.Sprintf("ivaRateCrew debe ser un número entre 0 y 1 (ej: 0.1525 para 15.25%%). Recibido: %.4f", req.IvaRateCrew),
		)
	}

	if req.IvaRateService < 0 || req.IvaRateService > 1 {
		return apperr.BadRequest(
			fmt.Sprintf("ivaRateService debe ser un número entre 0 y 1 (ej: 0.19 para 19%%). Recibido: %.4f", req.IvaRateService),
		)
	}

	return nil
}
