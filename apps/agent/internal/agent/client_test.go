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

func TestRegisterSendsExpectedPayloadAndBasicAuth(t *testing.T) {
	client, err := NewClient(Config{APIURL: "http://kyvora.example.test", APIUsername: "user", APIPassword: "dev-password"})
	if err != nil {
		t.Fatalf("NewClient returned error: %v", err)
	}
	client.httpClient = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		if r.URL.Path != "/api/v1/agents/register" {
			t.Fatalf("path = %q", r.URL.Path)
		}
		username, password, ok := r.BasicAuth()
		if !ok || username != "user" || password != "dev-password" {
			t.Fatalf("unexpected basic auth: %q/%q ok=%v", username, password, ok)
		}

		var body registerRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if body.Name != "agent-01" || body.Hostname != "node01.example.test" || body.Version != "0.1.0" {
			t.Fatalf("unexpected request body: %#v", body)
		}

		return jsonResponse(http.StatusCreated, Agent{ID: "agent-id", Status: "PENDING"}), nil
	})}

	registered, err := client.Register(context.Background(), Config{
		Name:     "agent-01",
		Hostname: "node01.example.test",
		Version:  "0.1.0",
	})
	if err != nil {
		t.Fatalf("Register returned error: %v", err)
	}
	if registered.ID != "agent-id" {
		t.Fatalf("registered.ID = %q, want agent-id", registered.ID)
	}
}

func TestRegisterMapsConflictToDuplicateHostnameError(t *testing.T) {
	client, err := NewClient(Config{APIURL: "http://kyvora.example.test"})
	if err != nil {
		t.Fatalf("NewClient returned error: %v", err)
	}
	client.httpClient = &http.Client{Transport: roundTripFunc(func(*http.Request) (*http.Response, error) {
		return jsonResponse(http.StatusConflict, apiErrorResponse{
			Status:  http.StatusConflict,
			Message: "Agent already exists with hostname: node01.example.test",
			Details: []string{
				"hostname: node01.example.test",
			},
		}), nil
	})}

	_, err = client.Register(context.Background(), Config{Hostname: "node01.example.test"})
	if err == nil {
		t.Fatal("Register returned nil error")
	}

	var duplicate *DuplicateHostnameError
	if !errors.As(err, &duplicate) {
		t.Fatalf("error type = %T, want DuplicateHostnameError", err)
	}
	if duplicate.Hostname != "node01.example.test" {
		t.Fatalf("duplicate.Hostname = %q, want node01.example.test", duplicate.Hostname)
	}
}

func TestHeartbeatSendsOnlineStatus(t *testing.T) {
	client, err := NewClient(Config{APIURL: "http://kyvora.example.test"})
	if err != nil {
		t.Fatalf("NewClient returned error: %v", err)
	}
	client.httpClient = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		if r.URL.Path != "/api/v1/agents/agent-id/heartbeat" {
			t.Fatalf("path = %q", r.URL.Path)
		}

		var body heartbeatRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if body.Status != "ONLINE" || body.Version != "0.1.0" {
			t.Fatalf("unexpected request body: %#v", body)
		}

		return jsonResponse(http.StatusOK, Agent{ID: "agent-id", Status: "ONLINE", Version: "0.1.0"}), nil
	})}

	agent, err := client.Heartbeat(context.Background(), "agent-id", "0.1.0")
	if err != nil {
		t.Fatalf("Heartbeat returned error: %v", err)
	}
	if agent.Status != "ONLINE" {
		t.Fatalf("agent.Status = %q, want ONLINE", agent.Status)
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
