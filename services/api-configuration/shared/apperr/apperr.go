package apperr

import (
	"encoding/json"
	"fmt"
)

// AppError representa un error de aplicación con código HTTP y detalles estructurados.
type AppError struct {
	StatusCode int         `json:"statusCode"`
	Message    string      `json:"message"`
	Code       string      `json:"code,omitempty"`
	Details    interface{} `json:"details,omitempty"`
	Err        error       `json:"-"` // Error original (no se serializa)
}

// Error implementa la interfaz error.
func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%d] %s: %v", e.StatusCode, e.Message, e.Err)
	}
	return fmt.Sprintf("[%d] %s", e.StatusCode, e.Message)
}

// Unwrap permite unwrapping del error original.
func (e *AppError) Unwrap() error {
	return e.Err
}

// Response estructura la respuesta HTTP de error compatible con el formato Node.js.
type Response struct {
	State    bool        `json:"state"`
	Metadata Metadata    `json:"metadata"`
	Data     interface{} `json:"data"`
}

// Metadata contiene información sobre la operación.
type Metadata struct {
	StatusCode int    `json:"statusCode"`
	Action     string `json:"action"`
}

// ToJSON convierte el AppError en el formato de respuesta compatible con Node.js.
func (e *AppError) ToJSON(action string) []byte {
	response := Response{
		State: false,
		Metadata: Metadata{
			StatusCode: e.StatusCode,
			Action:     action,
		},
		Data: map[string]interface{}{
			"message": e.Message,
			"code":    e.Code,
			"details": e.Details,
		},
	}

	body, _ := json.Marshal(response)
	return body
}

// New crea un nuevo AppError con código de estado y mensaje.
func New(statusCode int, message string) *AppError {
	return &AppError{
		StatusCode: statusCode,
		Message:    message,
	}
}

// Wrap envuelve un error existente con un AppError.
func Wrap(statusCode int, message string, err error) *AppError {
	return &AppError{
		StatusCode: statusCode,
		Message:    message,
		Err:        err,
	}
}

// BadRequest crea un error 400.
func BadRequest(message string) *AppError {
	return &AppError{
		StatusCode: 400,
		Message:    message,
		Code:       "BAD_REQUEST",
	}
}

// NotFound crea un error 404.
func NotFound(message string) *AppError {
	return &AppError{
		StatusCode: 404,
		Message:    message,
		Code:       "NOT_FOUND",
	}
}

// InternalServer crea un error 500.
func InternalServer(message string, err error) *AppError {
	return &AppError{
		StatusCode: 500,
		Message:    message,
		Code:       "INTERNAL_SERVER_ERROR",
		Err:        err,
	}
}

// Validation crea un error de validación 400 con detalles.
func Validation(details interface{}) *AppError {
	return &AppError{
		StatusCode: 400,
		Message:    "Error de validación",
		Code:       "VALIDATION_ERROR",
		Details:    details,
	}
}
