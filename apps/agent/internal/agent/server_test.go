package agent

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestServerRequiresSharedSecret(t *testing.T) {
	server := NewServer(testServerConfig(), slog.Default())
	handler := server.withAuth(server.handleHealth)

	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	response := httptest.NewRecorder()

	handler(response, request)

	if response.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusUnauthorized)
	}
}

func TestServerRejectsInvalidSharedSecret(t *testing.T) {
	server := NewServer(testServerConfig(), slog.Default())
	handler := server.withAuth(server.handleHealth)

	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	request.Header.Set(sharedSecretHeader, "wrong-secret")
	response := httptest.NewRecorder()

	handler(response, request)

	if response.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusUnauthorized)
	}
}

func TestServerAcceptsValidSharedSecret(t *testing.T) {
	server := NewServer(testServerConfig(), slog.Default())
	handler := server.withAuth(server.handleHealth)

	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	request.Header.Set(sharedSecretHeader, "agent-secret")
	response := httptest.NewRecorder()

	handler(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
	if response.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("content type = %q, want application/json", response.Header().Get("Content-Type"))
	}
}

func testServerConfig() Config {
	return Config{
		Name:            defaultAgentName,
		Hostname:        "node01.example.test",
		Version:         defaultAgentVersion,
		ListenAddress:   defaultListenAddress,
		ListenPort:      defaultListenPort,
		SharedSecret:    "agent-secret",
		ReadTimeout:     5 * time.Second,
		WriteTimeout:    5 * time.Second,
		ShutdownTimeout: 5 * time.Second,
	}
}
