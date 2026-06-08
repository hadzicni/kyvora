package agent

import (
	"testing"
	"time"
)

func TestLoadConfigDefaults(t *testing.T) {
	cfg, err := loadConfig(func(string) string { return "" }, func() (string, error) {
		return "test-host", nil
	})
	if err != nil {
		t.Fatalf("loadConfig returned error: %v", err)
	}

	if cfg.APIURL != defaultAPIURL {
		t.Fatalf("APIURL = %q, want %q", cfg.APIURL, defaultAPIURL)
	}
	if cfg.Name != defaultAgentName {
		t.Fatalf("Name = %q, want %q", cfg.Name, defaultAgentName)
	}
	if cfg.Hostname != "test-host" {
		t.Fatalf("Hostname = %q, want test-host", cfg.Hostname)
	}
	if cfg.Version != defaultAgentVersion {
		t.Fatalf("Version = %q, want %q", cfg.Version, defaultAgentVersion)
	}
	if cfg.APIUsername != defaultAPIUsername {
		t.Fatalf("APIUsername = %q, want %q", cfg.APIUsername, defaultAPIUsername)
	}
	if cfg.APIPassword != defaultAPIPassword {
		t.Fatalf("APIPassword = %q, want %q", cfg.APIPassword, defaultAPIPassword)
	}
	if cfg.HeartbeatInterval != defaultHeartbeatInterval {
		t.Fatalf("HeartbeatInterval = %s, want %s", cfg.HeartbeatInterval, defaultHeartbeatInterval)
	}
}

func TestLoadConfigFromEnvironment(t *testing.T) {
	env := map[string]string{
		"KYVORA_API_URL":                    "http://kyvora.example.test",
		"KYVORA_AGENT_NAME":                 "agent-01",
		"KYVORA_AGENT_HOSTNAME":             "node01.example.test",
		"KYVORA_AGENT_VERSION":              "1.2.3",
		"KYVORA_API_USERNAME":               "alice",
		"KYVORA_API_PASSWORD":               "secret",
		"KYVORA_HEARTBEAT_INTERVAL_SECONDS": "5",
	}

	cfg, err := loadConfig(func(key string) string { return env[key] }, func() (string, error) {
		return "ignored-host", nil
	})
	if err != nil {
		t.Fatalf("loadConfig returned error: %v", err)
	}

	if cfg.APIURL != env["KYVORA_API_URL"] ||
		cfg.Name != env["KYVORA_AGENT_NAME"] ||
		cfg.Hostname != env["KYVORA_AGENT_HOSTNAME"] ||
		cfg.Version != env["KYVORA_AGENT_VERSION"] ||
		cfg.APIUsername != env["KYVORA_API_USERNAME"] ||
		cfg.APIPassword != env["KYVORA_API_PASSWORD"] {
		t.Fatalf("config did not use environment values: %#v", cfg)
	}
	if cfg.HeartbeatInterval != 5*time.Second {
		t.Fatalf("HeartbeatInterval = %s, want 5s", cfg.HeartbeatInterval)
	}
}

func TestLoadConfigRejectsInvalidHeartbeatInterval(t *testing.T) {
	_, err := loadConfig(func(key string) string {
		if key == "KYVORA_HEARTBEAT_INTERVAL_SECONDS" {
			return "0"
		}
		return ""
	}, func() (string, error) {
		return "test-host", nil
	})
	if err == nil {
		t.Fatal("loadConfig returned nil error")
	}
}
