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

func TestRegisterLogsInAndSendsExpectedPayloadWithBearerToken(t *testing.T) {
	client, err := NewClient(Config{
		APIURL:           "http://kyvora.example.test",
		APILoginEmail:    "admin@kyvora.local",
		APILoginPassword: "admin-password",
	})
	if err != nil {
		t.Fatalf("NewClient returned error: %v", err)
	}
	requests := 0
	client.httpClient = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		requests++
		if requests == 1 {
			if r.URL.Path != "/api/v1/auth/login" {
				t.Fatalf("path = %q", r.URL.Path)
			}
			var body loginRequest
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				t.Fatalf("decode login request: %v", err)
			}
			if body.Email != "admin@kyvora.local" || body.Password != "admin-password" {
				t.Fatalf("unexpected login body: %#v", body)
			}
			return jsonResponse(http.StatusOK, tokenResponse{
				AccessToken:  "access-token",
				RefreshToken: "refresh-token",
				TokenType:    "Bearer",
				ExpiresIn:    900,
			}), nil
		}

		if r.URL.Path != "/api/v1/agents/register" {
			t.Fatalf("path = %q", r.URL.Path)
		}
		if auth := r.Header.Get("Authorization"); auth != "Bearer access-token" {
			t.Fatalf("Authorization = %q, want Bearer access-token", auth)
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
	if requests != 2 {
		t.Fatalf("requests = %d, want 2", requests)
	}
}

func TestRegisterMapsConflictToDuplicateHostnameError(t *testing.T) {
	client, err := NewClient(Config{APIURL: "http://kyvora.example.test"})
	if err != nil {
		t.Fatalf("NewClient returned error: %v", err)
	}
	client.accessToken = "access-token"
	client.refreshToken = "refresh-token"
	client.tokenType = "Bearer"
	client.expiresAt = time.Now().Add(requestTimeout)
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
	client.accessToken = "access-token"
	client.refreshToken = "refresh-token"
	client.tokenType = "Bearer"
	client.expiresAt = time.Now().Add(requestTimeout)
	client.httpClient = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		if r.URL.Path != "/api/v1/agents/agent-id/heartbeat" {
			t.Fatalf("path = %q", r.URL.Path)
		}
		if auth := r.Header.Get("Authorization"); auth != "Bearer access-token" {
			t.Fatalf("Authorization = %q, want Bearer access-token", auth)
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

func TestProtectedRequestRefreshesAndRetriesOnceAfterUnauthorized(t *testing.T) {
	client, err := NewClient(Config{APIURL: "http://kyvora.example.test"})
	if err != nil {
		t.Fatalf("NewClient returned error: %v", err)
	}
	client.accessToken = "expired-token"
	client.refreshToken = "refresh-token"
	client.tokenType = "Bearer"
	client.expiresAt = time.Now().Add(requestTimeout)

	requests := 0
	client.httpClient = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		requests++
		switch requests {
		case 1:
			if r.URL.Path != "/api/v1/agents/agent-id/heartbeat" {
				t.Fatalf("path = %q", r.URL.Path)
			}
			if auth := r.Header.Get("Authorization"); auth != "Bearer expired-token" {
				t.Fatalf("Authorization = %q, want Bearer expired-token", auth)
			}
			return jsonResponse(http.StatusUnauthorized, apiErrorResponse{Status: http.StatusUnauthorized}), nil
		case 2:
			if r.URL.Path != "/api/v1/auth/refresh" {
				t.Fatalf("path = %q", r.URL.Path)
			}
			var body refreshRequest
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				t.Fatalf("decode refresh request: %v", err)
			}
			if body.RefreshToken != "refresh-token" {
				t.Fatalf("RefreshToken = %q, want refresh-token", body.RefreshToken)
			}
			return jsonResponse(http.StatusOK, tokenResponse{
				AccessToken:  "new-access-token",
				RefreshToken: "new-refresh-token",
				TokenType:    "Bearer",
				ExpiresIn:    900,
			}), nil
		case 3:
			if r.URL.Path != "/api/v1/agents/agent-id/heartbeat" {
				t.Fatalf("path = %q", r.URL.Path)
			}
			if auth := r.Header.Get("Authorization"); auth != "Bearer new-access-token" {
				t.Fatalf("Authorization = %q, want Bearer new-access-token", auth)
			}
			return jsonResponse(http.StatusOK, Agent{ID: "agent-id", Status: "ONLINE"}), nil
		default:
			t.Fatalf("unexpected request %d to %s", requests, r.URL.Path)
			return nil, nil
		}
	})}

	agent, err := client.Heartbeat(context.Background(), "agent-id", "0.1.0")
	if err != nil {
		t.Fatalf("Heartbeat returned error: %v", err)
	}
	if agent.Status != "ONLINE" {
		t.Fatalf("agent.Status = %q, want ONLINE", agent.Status)
	}
}

func TestProtectedRequestLogsInWhenRefreshFails(t *testing.T) {
	client, err := NewClient(Config{
		APIURL:           "http://kyvora.example.test",
		APILoginEmail:    "admin@kyvora.local",
		APILoginPassword: "admin-password",
	})
	if err != nil {
		t.Fatalf("NewClient returned error: %v", err)
	}
	client.accessToken = "expired-token"
	client.refreshToken = "refresh-token"
	client.tokenType = "Bearer"
	client.expiresAt = time.Now().Add(requestTimeout)

	requests := 0
	client.httpClient = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		requests++
		switch requests {
		case 1:
			return jsonResponse(http.StatusUnauthorized, apiErrorResponse{Status: http.StatusUnauthorized}), nil
		case 2:
			if r.URL.Path != "/api/v1/auth/refresh" {
				t.Fatalf("path = %q", r.URL.Path)
			}
			return jsonResponse(http.StatusUnauthorized, apiErrorResponse{Status: http.StatusUnauthorized}), nil
		case 3:
			if r.URL.Path != "/api/v1/auth/login" {
				t.Fatalf("path = %q", r.URL.Path)
			}
			return jsonResponse(http.StatusOK, tokenResponse{
				AccessToken:  "login-access-token",
				RefreshToken: "login-refresh-token",
				TokenType:    "Bearer",
				ExpiresIn:    900,
			}), nil
		case 4:
			if r.URL.Path != "/api/v1/agents/agent-id/heartbeat" {
				t.Fatalf("path = %q", r.URL.Path)
			}
			if auth := r.Header.Get("Authorization"); auth != "Bearer login-access-token" {
				t.Fatalf("Authorization = %q, want Bearer login-access-token", auth)
			}
			return jsonResponse(http.StatusOK, Agent{ID: "agent-id", Status: "ONLINE"}), nil
		default:
			t.Fatalf("unexpected request %d to %s", requests, r.URL.Path)
			return nil, nil
		}
	})}

	_, err = client.Heartbeat(context.Background(), "agent-id", "0.1.0")
	if err != nil {
		t.Fatalf("Heartbeat returned error: %v", err)
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
