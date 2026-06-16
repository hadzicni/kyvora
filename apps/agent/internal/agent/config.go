package agent

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	defaultAgentName       = "local-agent"
	defaultListenAddress   = "127.0.0.1"
	defaultListenPort      = 9187
	defaultReadTimeout     = 5 * time.Second
	defaultWriteTimeout    = 10 * time.Second
	defaultShutdownTimeout = 5 * time.Second
	defaultLogLevel        = "info"
)

type Config struct {
	Name            string
	Hostname        string
	ServerID        string
	Version         string
	ListenAddress   string
	ListenPort      int
	SharedSecret    string
	LogLevel        string
	Capabilities    []string
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	ShutdownTimeout time.Duration
}

func LoadConfig() (Config, error) {
	return loadConfig(os.Getenv, os.Hostname)
}

func LoadConfigFile(path string) (Config, error) {
	return loadConfigFile(path, os.Hostname)
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
		LogLevel:        envOrDefault(getenv, "KYVORA_AGENT_LOG_LEVEL", defaultLogLevel),
		Capabilities:    defaultCapabilities(),
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
	if err := validateConfig(cfg, "environment"); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

func loadConfigFile(path string, hostname func() (string, error)) (Config, error) {
	if strings.TrimSpace(path) == "" {
		return Config{}, fmt.Errorf("config path is required")
	}

	values, err := parseAgentConfigFile(path)
	if err != nil {
		return Config{}, err
	}

	osHostname, err := hostname()
	if err != nil {
		return Config{}, fmt.Errorf("read OS hostname: %w", err)
	}

	cfg := Config{
		Name:            valueOrDefault(values["agent.name"], defaultAgentName),
		Hostname:        valueOrDefault(values["server.hostname"], valueOrDefault(values["agent.hostname"], osHostname)),
		ServerID:        values["server.id"],
		Version:         valueOrDefault(values["agent.version"], "0.1.0"),
		ListenAddress:   valueOrDefault(values["server.listenAddress"], defaultListenAddress),
		ListenPort:      defaultListenPort,
		LogLevel:        valueOrDefault(values["logging.level"], defaultLogLevel),
		Capabilities:    defaultCapabilities(),
		ReadTimeout:     defaultReadTimeout,
		WriteTimeout:    defaultWriteTimeout,
		ShutdownTimeout: defaultShutdownTimeout,
	}

	if raw := values["server.listenPort"]; raw != "" {
		port, err := strconv.Atoi(raw)
		if err != nil || port <= 0 || port > 65535 {
			return Config{}, fmt.Errorf("server.listenPort must be a valid TCP port")
		}
		cfg.ListenPort = port
	}
	if raw := values["server.enabledCapabilities"]; raw != "" {
		cfg.Capabilities = parseStringList(raw)
	}
	if raw := values["agent.enabledCapabilities"]; raw != "" {
		cfg.Capabilities = parseStringList(raw)
	}
	if raw := values["timeouts.readSeconds"]; raw != "" {
		timeout, err := positiveDuration(raw, "timeouts.readSeconds")
		if err != nil {
			return Config{}, err
		}
		cfg.ReadTimeout = timeout
	}
	if raw := values["timeouts.writeSeconds"]; raw != "" {
		timeout, err := positiveDuration(raw, "timeouts.writeSeconds")
		if err != nil {
			return Config{}, err
		}
		cfg.WriteTimeout = timeout
	}
	if raw := values["timeouts.shutdownSeconds"]; raw != "" {
		timeout, err := positiveDuration(raw, "timeouts.shutdownSeconds")
		if err != nil {
			return Config{}, err
		}
		cfg.ShutdownTimeout = timeout
	}

	secretFile := values["security.sharedSecretFile"]
	if secretFile == "" {
		return Config{}, fmt.Errorf("security.sharedSecretFile is required")
	}
	secret, err := os.ReadFile(secretFile)
	if err != nil {
		return Config{}, fmt.Errorf("read shared secret file: %w", err)
	}
	cfg.SharedSecret = strings.TrimSpace(string(secret))

	if err := validateConfig(cfg, path); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

func validateConfig(cfg Config, source string) error {
	if strings.TrimSpace(cfg.ListenAddress) == "" {
		return fmt.Errorf("%s: listen address is required", source)
	}
	if cfg.ListenPort <= 0 || cfg.ListenPort > 65535 {
		return fmt.Errorf("%s: listen port must be between 1 and 65535", source)
	}
	if strings.TrimSpace(cfg.SharedSecret) == "" {
		return fmt.Errorf("%s: shared secret is required", source)
	}
	if len(cfg.Capabilities) == 0 {
		return fmt.Errorf("%s: at least one capability must be enabled", source)
	}
	switch strings.ToLower(strings.TrimSpace(cfg.LogLevel)) {
	case "debug", "info", "warn", "error":
	default:
		return fmt.Errorf("%s: logging.level must be one of debug, info, warn, or error", source)
	}
	return nil
}

func parseAgentConfigFile(path string) (map[string]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("read config file %s: %w", path, err)
	}
	defer file.Close()

	values := make(map[string]string)
	section := ""
	scanner := bufio.NewScanner(file)
	lineNumber := 0
	for scanner.Scan() {
		lineNumber++
		raw := stripComment(scanner.Text())
		if strings.TrimSpace(raw) == "" {
			continue
		}
		indent := len(raw) - len(strings.TrimLeft(raw, " "))
		line := strings.TrimSpace(raw)
		if strings.HasSuffix(line, ":") {
			if indent != 0 {
				return nil, fmt.Errorf("%s:%d: nested sections are not supported", path, lineNumber)
			}
			section = strings.TrimSuffix(line, ":")
			continue
		}
		if section == "" {
			return nil, fmt.Errorf("%s:%d: key must be inside a section", path, lineNumber)
		}
		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {
			return nil, fmt.Errorf("%s:%d: expected key: value", path, lineNumber)
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		if key == "" {
			return nil, fmt.Errorf("%s:%d: key is required", path, lineNumber)
		}
		values[section+"."+key] = unquote(value)
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("read config file %s: %w", path, err)
	}
	return values, nil
}

func stripComment(line string) string {
	inSingleQuote := false
	inDoubleQuote := false
	for index, char := range line {
		switch char {
		case '\'':
			if !inDoubleQuote {
				inSingleQuote = !inSingleQuote
			}
		case '"':
			if !inSingleQuote {
				inDoubleQuote = !inDoubleQuote
			}
		case '#':
			if !inSingleQuote && !inDoubleQuote {
				return line[:index]
			}
		}
	}
	return line
}

func unquote(value string) string {
	value = strings.TrimSpace(value)
	if len(value) >= 2 {
		if (value[0] == '"' && value[len(value)-1] == '"') || (value[0] == '\'' && value[len(value)-1] == '\'') {
			return value[1 : len(value)-1]
		}
	}
	return value
}

func positiveDuration(raw, key string) (time.Duration, error) {
	seconds, err := strconv.Atoi(raw)
	if err != nil || seconds <= 0 {
		return 0, fmt.Errorf("%s must be a positive integer", key)
	}
	return time.Duration(seconds) * time.Second, nil
}

func parseStringList(raw string) []string {
	raw = strings.TrimSpace(raw)
	raw = strings.TrimPrefix(raw, "[")
	raw = strings.TrimSuffix(raw, "]")
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	values := make([]string, 0, len(parts))
	for _, part := range parts {
		value := unquote(strings.TrimSpace(part))
		if value != "" {
			values = append(values, value)
		}
	}
	return values
}

func defaultCapabilities() []string {
	return []string{"health", "capabilities", "system", "metrics", "services"}
}

func envOrDefault(getenv func(string) string, key, fallback string) string {
	value := getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func valueOrDefault(value, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return strings.TrimSpace(value)
}
