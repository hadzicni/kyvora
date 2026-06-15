package agent

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

const (
	defaultAgentName       = "local-agent"
	defaultListenAddress   = "127.0.0.1"
	defaultListenPort      = 9288
	defaultReadTimeout     = 5 * time.Second
	defaultWriteTimeout    = 10 * time.Second
	defaultShutdownTimeout = 5 * time.Second
)

type Config struct {
	Name            string
	Hostname        string
	Version         string
	ListenAddress   string
	ListenPort      int
	SharedSecret    string
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	ShutdownTimeout time.Duration
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
		Name:            envOrDefault(getenv, "KYVORA_AGENT_NAME", defaultAgentName),
		Hostname:        envOrDefault(getenv, "KYVORA_AGENT_HOSTNAME", osHostname),
		Version:         envOrDefault(getenv, "KYVORA_AGENT_VERSION", "0.1.0"),
		ListenAddress:   envOrDefault(getenv, "KYVORA_AGENT_LISTEN_ADDRESS", defaultListenAddress),
		ListenPort:      defaultListenPort,
		SharedSecret:    getenv("KYVORA_AGENT_SHARED_SECRET"),
		ReadTimeout:     defaultReadTimeout,
		WriteTimeout:    defaultWriteTimeout,
		ShutdownTimeout: defaultShutdownTimeout,
	}

	if raw := getenv("KYVORA_AGENT_LISTEN_PORT"); raw != "" {
		port, err := strconv.Atoi(raw)
		if err != nil || port <= 0 || port > 65535 {
			return Config{}, fmt.Errorf("KYVORA_AGENT_LISTEN_PORT must be a valid TCP port")
		}
		cfg.ListenPort = port
	}
	if raw := getenv("KYVORA_AGENT_READ_TIMEOUT_SECONDS"); raw != "" {
		timeout, err := positiveDuration(raw, "KYVORA_AGENT_READ_TIMEOUT_SECONDS")
		if err != nil {
			return Config{}, err
		}
		cfg.ReadTimeout = timeout
	}
	if raw := getenv("KYVORA_AGENT_WRITE_TIMEOUT_SECONDS"); raw != "" {
		timeout, err := positiveDuration(raw, "KYVORA_AGENT_WRITE_TIMEOUT_SECONDS")
		if err != nil {
			return Config{}, err
		}
		cfg.WriteTimeout = timeout
	}
	if raw := getenv("KYVORA_AGENT_SHUTDOWN_TIMEOUT_SECONDS"); raw != "" {
		timeout, err := positiveDuration(raw, "KYVORA_AGENT_SHUTDOWN_TIMEOUT_SECONDS")
		if err != nil {
			return Config{}, err
		}
		cfg.ShutdownTimeout = timeout
	}
	if cfg.SharedSecret == "" {
		return Config{}, fmt.Errorf("KYVORA_AGENT_SHARED_SECRET is required")
	}

	return cfg, nil
}

func positiveDuration(raw, key string) (time.Duration, error) {
	seconds, err := strconv.Atoi(raw)
	if err != nil || seconds <= 0 {
		return 0, fmt.Errorf("%s must be a positive integer", key)
	}
	return time.Duration(seconds) * time.Second, nil
}

func envOrDefault(getenv func(string) string, key, fallback string) string {
	value := getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
