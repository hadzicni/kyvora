package agent

import (
	"testing"
	"time"
)

func TestLoadConfigDefaults(t *testing.T) {
	env := map[string]string{
		"KYVORA_AGENT_ID":    "agent-id",
		"KYVORA_AGENT_TOKEN": "agent-token",
	}
	cfg, err := loadConfig(func(key string) string { return env[key] }, func() (string, error) {
		return "test-host", nil
	})
	if err != nil {
		t.Fatalf("loadConfig returned error: %v", err)
	}

	if cfg.APIURL != defaultAPIURL {
		t.Fatalf("APIURL = %q, want %q", cfg.APIURL, defaultAPIURL)
	}
	if cfg.AgentID != "agent-id" {
		t.Fatalf("AgentID = %q, want agent-id", cfg.AgentID)
	}
	if cfg.AgentToken != "agent-token" {
		t.Fatalf("AgentToken = %q, want agent-token", cfg.AgentToken)
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
	if cfg.HeartbeatInterval != defaultHeartbeatInterval {
		t.Fatalf("HeartbeatInterval = %s, want %s", cfg.HeartbeatInterval, defaultHeartbeatInterval)
	}
}

func TestLoadConfigFromEnvironment(t *testing.T) {
	env := map[string]string{
		"KYVORA_API_URL":                    "http://kyvora.example.test",
		"KYVORA_AGENT_ID":                   "agent-id",
		"KYVORA_AGENT_TOKEN":                "agent-token",
		"KYVORA_AGENT_NAME":                 "agent-01",
		"KYVORA_AGENT_HOSTNAME":             "node01.example.test",
		"KYVORA_AGENT_VERSION":              "1.2.3",
		"KYVORA_HEARTBEAT_INTERVAL_SECONDS": "5",
	}

	cfg, err := loadConfig(func(key string) string { return env[key] }, func() (string, error) {
		return "ignored-host", nil
	})
	if err != nil {
		t.Fatalf("loadConfig returned error: %v", err)
	}

	if cfg.APIURL != env["KYVORA_API_URL"] ||
		cfg.AgentID != env["KYVORA_AGENT_ID"] ||
		cfg.AgentToken != env["KYVORA_AGENT_TOKEN"] ||
		cfg.Name != env["KYVORA_AGENT_NAME"] ||
		cfg.Hostname != env["KYVORA_AGENT_HOSTNAME"] ||
		cfg.Version != env["KYVORA_AGENT_VERSION"] {
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
		if key == "KYVORA_AGENT_ID" {
			return "agent-id"
		}
		if key == "KYVORA_AGENT_TOKEN" {
			return "agent-token"
		}
		return ""
	}, func() (string, error) {
		return "test-host", nil
	})
	if err == nil {
		t.Fatal("loadConfig returned nil error")
	}
}

func TestLoadConfigRequiresAgentID(t *testing.T) {
	_, err := loadConfig(func(key string) string {
		if key == "KYVORA_AGENT_TOKEN" {
			return "agent-token"
		}
		return ""
	}, func() (string, error) {
		return "test-host", nil
	})
	if err == nil {
		t.Fatal("loadConfig returned nil error")
	}
}

func TestLoadConfigRequiresAgentToken(t *testing.T) {
	_, err := loadConfig(func(key string) string {
		if key == "KYVORA_AGENT_ID" {
			return "agent-id"
		}
		return ""
	}, func() (string, error) {
		return "test-host", nil
	})
	if err == nil {
		t.Fatal("loadConfig returned nil error")
	}
}
