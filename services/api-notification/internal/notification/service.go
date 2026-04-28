package notification

import (
	"context"
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/indomito/portal-admin/api-notification/shared/apperr"
	"go.uber.org/zap"
)

// SendNotificationFunc es el tipo de función del servicio de notificaciones.
type SendNotificationFunc func(ctx context.Context, req *SendRequest) (*SendResponse, error)

// NewSendNotificationService crea la función de servicio que orquesta:
//  1. Validar el request
//  2. Obtener el programa desde DynamoDB
//  3. Extraer los archivos del contrato
//  4. Descargar los PDFs desde S3
//  5. Enviar el email con los adjuntos
func NewSendNotificationService(
	getProgram GetProgramFunc,
	downloadPDFs DownloadContractPDFsFunc,
	downloadPreview DownloadPreviewContractFromKeyFunc,
	sendEmail SendEmailFunc,
	stage string,
	log *zap.Logger,
) SendNotificationFunc {
	return func(ctx context.Context, req *SendRequest) (*SendResponse, error) {
		// 1. Validar campos obligatorios
		if req.Name == "" || req.Email == "" {
			return nil, apperr.BadRequest("Los campos name y email son requeridos")
		}
		if req.SK == "" {
			return nil, apperr.BadRequest("El campo sk es requerido")
		}

		log.Info("Procesando solicitud de notificación",
			zap.String("email", req.Email),
			zap.String("sk", req.SK),
			zap.String("preview", req.Preview),
		)

		// 2. Obtener programa desde DynamoDB
		program, err := getProgram(ctx, req.SK)
		if err != nil {
			return nil, apperr.InternalServer("Error al obtener programa", err)
		}
		if program == nil {
			return nil, apperr.NotFound(fmt.Sprintf("Programa no encontrado: %s", req.SK))
		}

		// 3. Extraer archivos del contrato
		if len(program.Content) == 0 {
			return nil, apperr.NotFound("El programa no tiene contenido")
		}

		contract := program.Content[0].Contract
		files := resolveContractFiles(contract)

		var pdfs []AttachedPDF

		if len(files) > 0 {
			var err error
			pdfs, err = downloadPDFs(ctx, files)
			if err != nil {
				return nil, apperr.InternalServer("Error al descargar PDFs del contrato", err)
			}
		} else if k := strings.TrimSpace(req.AttachmentS3Key); k != "" {
			var err error
			pdfs, err = downloadPreview(ctx, k)
			if err != nil {
				if strings.Contains(err.Error(), "no permitida") {
					return nil, apperr.BadRequest(err.Error())
				}
				return nil, apperr.InternalServer("Error al descargar borrador del contrato", err)
			}
			log.Info("Usando borrador PDF desde S3 (vista previa)",
				zap.String("key", k),
				zap.Int("bytes", len(pdfs[0].Data)),
			)
		} else if rawB64 := strings.TrimSpace(req.AttachmentBase64); rawB64 != "" {
			decoded, err := base64.StdEncoding.DecodeString(rawB64)
			if err != nil {
				return nil, apperr.BadRequest("El adjunto en base64 no es válido")
			}
			if len(decoded) == 0 {
				return nil, apperr.BadRequest("El adjunto en base64 está vacío")
			}
			pdfs = []AttachedPDF{
				{Filename: "borrador-contrato.pdf", Data: decoded},
			}
			log.Info("Usando PDF adjunto inline (sin archivos en programa)",
				zap.Int("bytes", len(decoded)),
			)
		} else {
			return nil, apperr.NotFound("No se encontraron archivos de contrato en el programa")
		}

		// 5. Construir contenido del email y enviar
		content := BuildEmailContent(req.Preview, stage)
		if err := sendEmail(req.Email, req.Name, content, pdfs); err != nil {
			return nil, apperr.InternalServer("Error al enviar el email", err)
		}

		log.Info("Notificación enviada correctamente",
			zap.String("recipient", req.Email),
			zap.String("subject", content.Subject),
		)

		return &SendResponse{
			Message:   "Correo enviado exitosamente",
			Recipient: req.Email,
		}, nil
	}
}

// resolveContractFiles retorna el slice de archivos a usar.
// Soporta el formato nuevo (files[]) y el antiguo (file singular como fallback).
func resolveContractFiles(contract Contract) []ContractFile {
	if len(contract.Files) > 0 {
		return contract.Files
	}
	if contract.File != nil {
		return []ContractFile{*contract.File}
	}
	return nil
}
