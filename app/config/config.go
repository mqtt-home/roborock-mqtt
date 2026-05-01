package config

import (
	"encoding/json"
	"os"

	"github.com/philipparndt/go-logger"
	"github.com/philipparndt/mqtt-gateway/config"
)

var cfg Config

type Config struct {
	MQTT      config.MQTTConfig `json:"mqtt"`
	Roborock  RoborockConfig    `json:"roborock"`
	Web       WebConfig         `json:"web"`
	LogLevel  string            `json:"loglevel,omitempty"`
}

type RoborockConfig struct {
	Username        string `json:"username"`
	Password        string `json:"password"`
	ClientID        string `json:"client_id"`
	BaseURL         string `json:"base_url"`
	PollingInterval int    `json:"polling_interval"`
}

type WebConfig struct {
	Enabled bool `json:"enabled"`
	Port    int  `json:"port"`
}

func LoadConfig(file string) (Config, error) {
	data, err := os.ReadFile(file)
	if err != nil {
		logger.Error("Error reading config file", "error", err)
		return Config{}, err
	}

	data = config.ReplaceEnvVariables(data)

	err = json.Unmarshal(data, &cfg)
	if err != nil {
		logger.Error("Unmarshaling JSON", "error", err)
		return Config{}, err
	}

	if cfg.LogLevel == "" {
		cfg.LogLevel = "info"
	}

	if cfg.Roborock.BaseURL == "" {
		cfg.Roborock.BaseURL = "https://euiot.roborock.com"
	}

	if cfg.Roborock.PollingInterval == 0 {
		cfg.Roborock.PollingInterval = 30
	}

	if cfg.Web.Port == 0 {
		cfg.Web.Port = 8080
	}

	return cfg, nil
}

func Get() Config {
	return cfg
}
