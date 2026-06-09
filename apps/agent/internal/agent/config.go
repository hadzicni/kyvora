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
	defaultHeartbeatInterval = 30 * time.Second
)

type Config struct {
	APIURL            string
	AgentID           string
	AgentToken        string
	Name              string
	Hostname          string
	Version           string
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
		AgentID:           getenv("KYVORA_AGENT_ID"),
		AgentToken:        getenv("KYVORA_AGENT_TOKEN"),
		Name:              envOrDefault(getenv, "KYVORA_AGENT_NAME", defaultAgentName),
		Hostname:          envOrDefault(getenv, "KYVORA_AGENT_HOSTNAME", osHostname),
		Version:           getenv("KYVORA_AGENT_VERSION"),
		HeartbeatInterval: defaultHeartbeatInterval,
	}

	if raw := getenv("KYVORA_HEARTBEAT_INTERVAL_SECONDS"); raw != "" {
		seconds, err := strconv.Atoi(raw)
		if err != nil || seconds <= 0 {
			return Config{}, fmt.Errorf("KYVORA_HEARTBEAT_INTERVAL_SECONDS must be a positive integer")
		}
		cfg.HeartbeatInterval = time.Duration(seconds) * time.Second
	}
	if cfg.AgentID == "" {
		return Config{}, fmt.Errorf("KYVORA_AGENT_ID is required")
	}
	if cfg.AgentToken == "" {
		return Config{}, fmt.Errorf("KYVORA_AGENT_TOKEN is required")
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
