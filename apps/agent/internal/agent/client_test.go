package agent

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"
)

func TestHeartbeatSendsAgentTokenAndOnlineStatus(t *testing.T) {
	client, err := NewClient(Config{
		APIURL:     "http://kyvora.example.test",
		AgentToken: "agent-token",
	})
	if err != nil {
		t.Fatalf("NewClient returned error: %v", err)
	}
	client.httpClient = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		if r.URL.Path != "/api/v1/agents/agent-id/heartbeat" {
			t.Fatalf("path = %q", r.URL.Path)
		}
		if auth := r.Header.Get("Authorization"); auth != "" {
			t.Fatalf("Authorization = %q, want empty", auth)
		}
		if token := r.Header.Get(agentTokenHeader); token != "agent-token" {
			t.Fatalf("%s = %q, want agent-token", agentTokenHeader, token)
		}

		var body heartbeatRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if body.Status != "ONLINE" || body.Version != "0.1.0" || body.Hostname != "node01.example.test" {
			t.Fatalf("unexpected request body: %#v", body)
		}

		return jsonResponse(http.StatusOK, Agent{ID: "agent-id", Status: "ONLINE", Version: "0.1.0"}), nil
	})}

	agent, err := client.Heartbeat(context.Background(), "agent-id", "0.1.0", "node01.example.test", nil)
	if err != nil {
		t.Fatalf("Heartbeat returned error: %v", err)
	}
	if agent.Status != "ONLINE" {
		t.Fatalf("agent.Status = %q, want ONLINE", agent.Status)
	}
}

func TestHeartbeatPayloadIncludesHostFactsWhenAvailable(t *testing.T) {
	client, err := NewClient(Config{
		APIURL:     "http://kyvora.example.test",
		AgentToken: "agent-token",
	})
	if err != nil {
		t.Fatalf("NewClient returned error: %v", err)
	}

	cpuCount := 8
	memoryTotal := uint64(16 * 1024 * 1024 * 1024)
	collectedAt := time.Date(2026, 6, 9, 10, 0, 0, 0, time.UTC)
	facts := &HostFacts{
		Hostname:         "node01.example.test",
		OperatingSystem:  "linux",
		Platform:         "linux",
		KernelVersion:    "6.8.0",
		Architecture:     "amd64",
		CPUCount:         &cpuCount,
		MemoryTotalBytes: &memoryTotal,
		IPAddresses:      []string{"10.0.0.10"},
		AgentVersion:     "0.1.0",
		CollectedAt:      collectedAt,
	}

	client.httpClient = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		var body heartbeatRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if body.HostFacts == nil {
			t.Fatal("HostFacts = nil, want facts")
		}
		if body.HostFacts.Hostname != facts.Hostname ||
			body.HostFacts.OperatingSystem != "linux" ||
			body.HostFacts.Architecture != "amd64" ||
			body.HostFacts.CPUCount == nil ||
			*body.HostFacts.CPUCount != cpuCount ||
			body.HostFacts.MemoryTotalBytes == nil ||
			*body.HostFacts.MemoryTotalBytes != memoryTotal ||
			!body.HostFacts.CollectedAt.Equal(collectedAt) {
			t.Fatalf("unexpected host facts: %#v", body.HostFacts)
		}

		return jsonResponse(http.StatusOK, Agent{ID: "agent-id", Status: "ONLINE", Version: "0.1.0"}), nil
	})}

	if _, err := client.Heartbeat(context.Background(), "agent-id", "0.1.0", "node01.example.test", facts); err != nil {
		t.Fatalf("Heartbeat returned error: %v", err)
	}
}

func TestStatusReadsAPIVersionWithoutAgentToken(t *testing.T) {
	client, err := NewClient(Config{
		APIURL:     "http://kyvora.example.test",
		AgentToken: "agent-token",
	})
	if err != nil {
		t.Fatalf("NewClient returned error: %v", err)
	}
	client.httpClient = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		if r.Method != http.MethodGet {
			t.Fatalf("method = %q, want GET", r.Method)
		}
		if r.URL.Path != "/api/v1/status" {
			t.Fatalf("path = %q", r.URL.Path)
		}
		if token := r.Header.Get(agentTokenHeader); token != "" {
			t.Fatalf("%s = %q, want empty", agentTokenHeader, token)
		}
		return jsonResponse(http.StatusOK, StatusResponse{
			Service:     "kyvora-api",
			Version:     "0.2.0",
			GeneratedAt: time.Date(2026, 6, 9, 10, 0, 0, 0, time.UTC),
		}), nil
	})}

	status, err := client.Status(context.Background())
	if err != nil {
		t.Fatalf("Status returned error: %v", err)
	}
	if status.Version != "0.2.0" {
		t.Fatalf("Version = %q, want 0.2.0", status.Version)
	}
}

func TestHeartbeatMapsUnauthorizedToAgentTokenAuthError(t *testing.T) {
	client, err := NewClient(Config{
		APIURL:     "http://kyvora.example.test",
		AgentToken: "bad-token",
	})
	if err != nil {
		t.Fatalf("NewClient returned error: %v", err)
	}
	client.httpClient = &http.Client{Transport: roundTripFunc(func(*http.Request) (*http.Response, error) {
		return jsonResponse(http.StatusUnauthorized, apiErrorResponse{
			Status:  http.StatusUnauthorized,
			Message: "Invalid agent token",
		}), nil
	})}

	_, err = client.Heartbeat(context.Background(), "agent-id", "0.1.0", "node01.example.test", nil)
	if err == nil {
		t.Fatal("Heartbeat returned nil error")
	}

	var authError *AgentTokenAuthError
	if !errors.As(err, &authError) {
		t.Fatalf("error type = %T, want AgentTokenAuthError", err)
	}
	if authError.StatusCode != http.StatusUnauthorized {
		t.Fatalf("StatusCode = %d, want %d", authError.StatusCode, http.StatusUnauthorized)
	}
}

func TestHeartbeatMapsForbiddenToAgentTokenAuthError(t *testing.T) {
	client, err := NewClient(Config{
		APIURL:     "http://kyvora.example.test",
		AgentToken: "revoked-token",
	})
	if err != nil {
		t.Fatalf("NewClient returned error: %v", err)
	}
	client.httpClient = &http.Client{Transport: roundTripFunc(func(*http.Request) (*http.Response, error) {
		return jsonResponse(http.StatusForbidden, apiErrorResponse{
			Status:  http.StatusForbidden,
			Message: "Agent token has been revoked",
		}), nil
	})}

	_, err = client.Heartbeat(context.Background(), "agent-id", "0.1.0", "node01.example.test", nil)
	if err == nil {
		t.Fatal("Heartbeat returned nil error")
	}

	var authError *AgentTokenAuthError
	if !errors.As(err, &authError) {
		t.Fatalf("error type = %T, want AgentTokenAuthError", err)
	}
	if authError.StatusCode != http.StatusForbidden {
		t.Fatalf("StatusCode = %d, want %d", authError.StatusCode, http.StatusForbidden)
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return f(r)
}

func jsonResponse(statusCode int, body any) *http.Response {
	payload, err := json.Marshal(body)
	if err != nil {
		panic(err)
	}

	return &http.Response{
		StatusCode: statusCode,
		Header:     make(http.Header),
		Body:       io.NopCloser(strings.NewReader(string(payload))),
	}
}
