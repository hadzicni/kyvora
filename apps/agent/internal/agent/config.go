package agent

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

const (
	defaultAPIURL            = "http://localhost:8080"
	defaultAgentName         = "local-agent"
	defaultAgentVersion      = "0.1.0"
	defaultAPILoginEmail     = "admin@kyvora.local"
	defaultAPILoginPassword  = "admin-password"
	defaultHeartbeatInterval = 30 * time.Second
)

type Config struct {
	APIURL            string
	Name              string
	Hostname          string
	Version           string
	APILoginEmail     string
	APILoginPassword  string
	HeartbeatInterval time.Duration
}

func LoadConfig() (Config, error) {
	return loadConfig(os.Getenv, os.Hostname)
}

func loadConfig(getenv func(string) string, hostname func() (string, error)) (Config, error) {
	osHostname, err := hostname()
	if err != nil {
		return Config{}, fmt.Errorf("read OS hostname: %w", err)
	}

	cfg := Config{
		APIURL:            envOrDefault(getenv, "KYVORA_API_URL", defaultAPIURL),
		Name:              envOrDefault(getenv, "KYVORA_AGENT_NAME", defaultAgentName),
		Hostname:          envOrDefault(getenv, "KYVORA_AGENT_HOSTNAME", osHostname),
		Version:           envOrDefault(getenv, "KYVORA_AGENT_VERSION", defaultAgentVersion),
		APILoginEmail:     envOrDefault(getenv, "KYVORA_API_LOGIN_EMAIL", defaultAPILoginEmail),
		APILoginPassword:  envOrDefault(getenv, "KYVORA_API_LOGIN_PASSWORD", defaultAPILoginPassword),
		HeartbeatInterval: defaultHeartbeatInterval,
	}

	if raw := getenv("KYVORA_HEARTBEAT_INTERVAL_SECONDS"); raw != "" {
		seconds, err := strconv.Atoi(raw)
		if err != nil || seconds <= 0 {
			return Config{}, fmt.Errorf("KYVORA_HEARTBEAT_INTERVAL_SECONDS must be a positive integer")
		}
		cfg.HeartbeatInterval = time.Duration(seconds) * time.Second
	}

	return cfg, nil
}

func envOrDefault(getenv func(string) string, key, fallback string) string {
	value := getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
