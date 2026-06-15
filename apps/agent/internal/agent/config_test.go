package agent

import "testing"

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
