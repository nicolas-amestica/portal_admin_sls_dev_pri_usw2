package notification

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"go.uber.org/zap"
	gomail "gopkg.in/gomail.v2"
)

// GetEmailConfigFunc es el tipo de función para obtener la configuración SMTP desde SSM.
type GetEmailConfigFunc func(ctx context.Context) (*EmailConfig, error)

// SendEmailFunc es el tipo de función para enviar el email con adjuntos.
type SendEmailFunc func(to, recipientName string, content emailContent, pdfs []AttachedPDF) error

// NewGetEmailConfig crea una función para obtener credenciales SMTP desde SSM Parameter Store.
// Cachea el resultado para evitar llamadas repetidas en invocaciones cálidas.
func NewGetEmailConfig(client *ssm.Client, parameterKey string, log *zap.Logger) GetEmailConfigFunc {
	var cached *EmailConfig

	return func(ctx context.Context) (*EmailConfig, error) {
		if cached != nil {
			return cached, nil
		}

		log.Info("Obteniendo configuración SMTP desde SSM", zap.String("key", parameterKey))

		result, err := client.GetParameter(ctx, &ssm.GetParameterInput{
			Name:           aws.String(parameterKey),
			WithDecryption: aws.Bool(true),
		})
		if err != nil {
			log.Error("Error al obtener parámetro SSM", zap.Error(err))
			return nil, fmt.Errorf("error al obtener config email desde SSM: %w", err)
		}

		var cfg EmailConfig
		if err := json.Unmarshal([]byte(*result.Parameter.Value), &cfg); err != nil {
			log.Error("Error al parsear config email", zap.Error(err))
			return nil, fmt.Errorf("error al parsear config email: %w", err)
		}

		cached = &cfg
		log.Info("Configuración SMTP obtenida correctamente", zap.String("host", cfg.Host))
		return &cfg, nil
	}
}

// NewSendEmail crea una función para enviar emails con adjuntos PDF usando SMTP.
func NewSendEmail(getConfig GetEmailConfigFunc, stage string, log *zap.Logger) SendEmailFunc {
	return func(to, recipientName string, content emailContent, pdfs []AttachedPDF) error {
		ctx := context.Background()
		cfg, err := getConfig(ctx)
		if err != nil {
			return err
		}

		fromAddr, fromName := buildFromAddress(stage)
		html := buildEmailHTML(recipientName, content.BodyHTML, stage)

		m := gomail.NewMessage()
		m.SetAddressHeader("From", fromAddr, fromName)
		m.SetHeader("To", to)
		m.SetHeader("Subject", content.Subject)
		m.SetBody("text/html", html)

		for _, pdf := range pdfs {
			data := make([]byte, len(pdf.Data))
			copy(data, pdf.Data)
			filename := pdf.Filename

			m.Attach(filename, gomail.SetCopyFunc(func(w io.Writer) error {
				_, err := w.Write(data)
				return err
			}))
		}

		d := gomail.NewDialer(cfg.Host, cfg.Port, cfg.User, cfg.Password)
		d.TLSConfig = &tls.Config{InsecureSkipVerify: true} //nolint:gosec // coincide con config Node.js

		if err := d.DialAndSend(m); err != nil {
			log.Error("Error al enviar email",
				zap.String("to", to),
				zap.Error(err),
			)
			return fmt.Errorf("error al enviar email: %w", err)
		}

		log.Info("Email enviado correctamente",
			zap.String("to", to),
			zap.String("subject", content.Subject),
		)
		return nil
	}
}

// buildFromAddress retorna la dirección email y el nombre del remitente según el stage.
// Se devuelven separados para que gomail los codifique correctamente vía SetAddressHeader.
func buildFromAddress(stage string) (addr, name string) {
	alias := "no-reply-dev"
	if stage == "prd" {
		alias = "no-reply"
	}
	return fmt.Sprintf("%s@girasindomito.cl", alias), "Giras Indómito"
}

// BuildEmailContent devuelve subject y bodyHTML según el valor de preview y el stage.
//
//	preview == "1"      → borrador
//	preview == "resend" → reenvío
//	otro valor          → confirmado
func BuildEmailContent(preview, stage string) emailContent {
	isPrd := stage == "prd"

	switch preview {
	case "1":
		subject := "Borrador de contrato de viaje"
		if isPrd {
			return emailContent{Subject: subject, BodyHTML: "Adjunto encontrará el borrador del contrato del viaje:"}
		}
		return emailContent{Subject: subject, BodyHTML: "Adjunto encontrará el borrador del contrato del viaje:"}

	case "resend":
		subject := "Reenvío de contrato de viaje aprobado"
		return emailContent{Subject: subject, BodyHTML: "Le reenviamos el contrato aprobado de su viaje:"}

	default:
		subject := "Contrato de viaje confirmado"
		return emailContent{Subject: subject, BodyHTML: "Adjunto encontrará el contrato del viaje:"}
	}
}

// buildEmailHTML genera el HTML completo del email, equivalente al template del servicio Node.js.
func buildEmailHTML(recipientName, bodyHTML, stage string) string {
	assetBase := fmt.Sprintf("https://giras-indomito-%s-info.s3.us-west-2.amazonaws.com/assets", stage)
	year := time.Now().Year()

	var buf bytes.Buffer

	buf.WriteString(`<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6; color: #333333;
        background-color: #f4f7f9; padding: 20px;
      }
      .email-wrapper {
        max-width: 600px; margin: 0 auto;
        background-color: #ffffff; border-radius: 12px;
        overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      }
      .header {
        text-align: center; height: 160px;
        background-size: cover; background-position: center; background-repeat: no-repeat;
      }
      .content { padding: 40px 30px; background-color: #ffffff; }
      .greeting { font-size: 18px; color: #1e3a8a; margin-bottom: 20px; font-weight: 500; }
      .message-body { color: #4b5563; font-size: 15px; line-height: 1.8; margin-bottom: 20px; }
      .closing { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
      .signature { color: #1e3a8a; font-weight: 600; margin-top: 10px; }
      .footer { text-align: center; }
      .footer-text { font-size: 11px; color: #6b7280; }
      @media only screen and (max-width: 600px) {
        .email-wrapper { border-radius: 0; }
        .content { padding: 25px 20px; }
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">`)

	fmt.Fprintf(&buf, `
      <div class="header" style="background-image: url('%s/header.png');"></div>
      <div class="content">
        <p class="greeting">Estimado/a %s,</p>
        <div class="message-body">%s</div>
        <div class="closing">
          <p style="color: #4b5563;">Saludos cordiales,</p>
          <p class="signature">Equipo Giras Indómito</p>
          <p style="color: #6b7280; font-size: 13px; margin-top: 5px;">
            info@girasindomito.cl<br>
            www.girasindomito.cl
          </p>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">Este es un correo automático, por favor no responder a esta dirección.</p>
        <p class="footer-text" style="margin-top: 4px;">&copy; %d Giras Indómito. Todos los derechos reservados.</p>
        <img src="%s/footer.png" alt="" style="width: 100%%; display: block; margin-top: 5px;">
      </div>
    </div>
  </body>
</html>`, assetBase, recipientName, bodyHTML, year, assetBase)

	return buf.String()
}
