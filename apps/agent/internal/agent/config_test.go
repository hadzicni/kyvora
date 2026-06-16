package agent

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadConfigDefaults(t *testing.T) {
	env := map[string]string{
		"KYVORA_AGENT_SHARED_SECRET": "agent-secret",
	}
	cfg, err := loadConfig(func(key string) string { return env[key] }, func() (string, error) {
		return "test-host", nil
	})
	if err != nil {
		t.Fatalf("loadConfig returned error: %v", err)
	}

	if cfg.Name != defaultAgentName {
		t.Fatalf("Name = %q, want %q", cfg.Name, defaultAgentName)
	}
	if cfg.Hostname != "test-host" {
		t.Fatalf("Hostname = %q, want test-host", cfg.Hostname)
	}
	if cfg.Version != "0.1.0" {
		t.Fatalf("Version = %q, want 0.1.0", cfg.Version)
	}
	if cfg.ListenAddress != defaultListenAddress || cfg.ListenPort != defaultListenPort {
		t.Fatalf("listen = %s:%d, want %s:%d", cfg.ListenAddress, cfg.ListenPort, defaultListenAddress, defaultListenPort)
	}
}

func TestLoadConfigFromEnvironment(t *testing.T) {
	env := map[string]string{
		"KYVORA_AGENT_NAME":           "agent-01",
		"KYVORA_AGENT_HOSTNAME":       "node01.example.test",
		"KYVORA_AGENT_VERSION":        "1.2.3",
		"KYVORA_AGENT_LISTEN_ADDRESS": "10.0.0.10",
		"KYVORA_AGENT_LISTEN_PORT":    "9399",
		"KYVORA_AGENT_SHARED_SECRET":  "agent-secret",
	}

	cfg, err := loadConfig(func(key string) string { return env[key] }, func() (string, error) {
		return "ignored-host", nil
	})
	if err != nil {
		t.Fatalf("loadConfig returned error: %v", err)
	}

	if cfg.Name != env["KYVORA_AGENT_NAME"] ||
		cfg.Hostname != env["KYVORA_AGENT_HOSTNAME"] ||
		cfg.Version != env["KYVORA_AGENT_VERSION"] ||
		cfg.ListenAddress != env["KYVORA_AGENT_LISTEN_ADDRESS"] ||
		cfg.ListenPort != 9399 {
		t.Fatalf("config did not use environment values: %#v", cfg)
	}
}

func TestLoadConfigRejectsInvalidListenPort(t *testing.T) {
	_, err := loadConfig(func(key string) string {
		if key == "KYVORA_AGENT_LISTEN_PORT" {
			return "0"
		}
		if key == "KYVORA_AGENT_SHARED_SECRET" {
			return "agent-secret"
		}
		return ""
	}, func() (string, error) {
		return "test-host", nil
	})
	if err == nil {
		t.Fatal("loadConfig returned nil error")
	}
}

func TestLoadConfigRequiresSharedSecret(t *testing.T) {
	_, err := loadConfig(func(key string) string {
		return ""
	}, func() (string, error) {
		return "test-host", nil
	})
	if err == nil {
		t.Fatal("loadConfig returned nil error")
	}
}

func TestLoadConfigFile(t *testing.T) {
	dir := t.TempDir()
	secretPath := filepath.Join(dir, "agent.secret")
	configPath := filepath.Join(dir, "agent.yaml")

	if err := os.WriteFile(secretPath, []byte("file-secret\n"), 0o640); err != nil {
		t.Fatalf("write secret: %v", err)
	}
	if err := os.WriteFile(configPath, []byte(`
server:
  listenAddress: "127.0.0.1"
  listenPort: 9187
  hostname: "node01.example.test"
  id: "server-01"

security:
  sharedSecretFile: "`+secretPath+`"

logging:
  level: "debug"

agent:
  name: "node-agent"
  version: "1.2.3"
  enabledCapabilities: ["health", "system"]
`), 0o640); err != nil {
		t.Fatalf("write config: %v", err)
	}

	cfg, err := loadConfigFile(configPath, func() (string, error) {
		return "ignored-host", nil
	})
	if err != nil {
		t.Fatalf("loadConfigFile returned error: %v", err)
	}

	if cfg.Name != "node-agent" ||
		cfg.Hostname != "node01.example.test" ||
		cfg.ServerID != "server-01" ||
		cfg.Version != "1.2.3" ||
		cfg.ListenAddress != "127.0.0.1" ||
		cfg.ListenPort != 9187 ||
		cfg.SharedSecret != "file-secret" ||
		cfg.LogLevel != "debug" {
		t.Fatalf("config file values were not applied: %#v", cfg)
	}
	if len(cfg.Capabilities) != 2 || cfg.Capabilities[0] != "health" || cfg.Capabilities[1] != "system" {
		t.Fatalf("Capabilities = %#v, want health/system", cfg.Capabilities)
	}
}

func TestLoadConfigFileRequiresSharedSecretFile(t *testing.T) {
	dir := t.TempDir()
	configPath := filepath.Join(dir, "agent.yaml")

	if err := os.WriteFile(configPath, []byte(`
server:
  listenAddress: "127.0.0.1"
  listenPort: 9187
`), 0o640); err != nil {
		t.Fatalf("write config: %v", err)
	}

	_, err := loadConfigFile(configPath, func() (string, error) {
		return "test-host", nil
	})
	if err == nil {
		t.Fatal("loadConfigFile returned nil error")
	}
}

func TestLoadConfigFileRejectsInvalidLogLevel(t *testing.T) {
	dir := t.TempDir()
	secretPath := filepath.Join(dir, "agent.secret")
	configPath := filepath.Join(dir, "agent.yaml")

	if err := os.WriteFile(secretPath, []byte("file-secret\n"), 0o640); err != nil {
		t.Fatalf("write secret: %v", err)
	}
	if err := os.WriteFile(configPath, []byte(`
server:
  listenAddress: "127.0.0.1"
  listenPort: 9187
security:
  sharedSecretFile: "`+secretPath+`"
logging:
  level: "trace"
`), 0o640); err != nil {
		t.Fatalf("write config: %v", err)
	}

	_, err := loadConfigFile(configPath, func() (string, error) {
		return "test-host", nil
	})
	if err == nil {
		t.Fatal("loadConfigFile returned nil error")
	}
}
