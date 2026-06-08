package agent

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
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

	agent, err := client.Heartbeat(context.Background(), "agent-id", "0.1.0", "node01.example.test")
	if err != nil {
		t.Fatalf("Heartbeat returned error: %v", err)
	}
	if agent.Status != "ONLINE" {
		t.Fatalf("agent.Status = %q, want ONLINE", agent.Status)
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

	_, err = client.Heartbeat(context.Background(), "agent-id", "0.1.0", "node01.example.test")
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

	_, err = client.Heartbeat(context.Background(), "agent-id", "0.1.0", "node01.example.test")
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
