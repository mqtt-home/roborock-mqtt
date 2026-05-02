package roborock

import (
	"fmt"
	"net/smtp"
	"strings"

	"github.com/mqtt-home/roborock-mqtt/config"
	"github.com/philipparndt/go-logger"
)

// SendEmail sends an email via SMTP using the configured settings.
func SendEmail(subject, body string) error {
	cfg := config.Get().Notifications.Email
	if !cfg.Enabled {
		return nil
	}

	addr := fmt.Sprintf("%s:%d", cfg.SMTPHost, cfg.SMTPPort)
	auth := smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.SMTPHost)

	msg := strings.Join([]string{
		"From: " + cfg.From,
		"To: " + cfg.To,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=utf-8",
		"",
		body,
	}, "\r\n")

	if err := smtp.SendMail(addr, auth, cfg.From, []string{cfg.To}, []byte(msg)); err != nil {
		logger.Error("Failed to send email", "error", err)
		return err
	}
	logger.Info("Email sent", "subject", subject, "to", cfg.To)
	return nil
}
