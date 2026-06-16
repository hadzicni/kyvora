package agent

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"time"
)

const sharedSecretHeader = "X-Kyvora-Agent-Secret"

type Server struct {
	cfg    Config
	logger *slog.Logger
}

type HealthResponse struct {
	Status      string    `json:"status"`
	Service     string    `json:"service"`
	Version     string    `json:"version"`
	Hostname    string    `json:"hostname"`
	GeneratedAt time.Time `json:"generatedAt"`
}

type CapabilityResponse struct {
	Version     string    `json:"version"`
	Supports    []string  `json:"supports"`
	GeneratedAt time.Time `json:"generatedAt"`
}

type MetricsResponse struct {
	CollectedAt time.Time `json:"collectedAt"`
	CPUCount    *int      `json:"cpuCount,omitempty"`
	MemoryTotal *uint64   `json:"memoryTotalBytes,omitempty"`
	DiskTotal   *uint64   `json:"diskTotalBytes,omitempty"`
	DiskFree    *uint64   `json:"diskFreeBytes,omitempty"`
	Uptime      *uint64   `json:"uptimeSeconds,omitempty"`
}

type ServicesResponse struct {
	Services    []ServiceInfo `json:"services"`
	GeneratedAt time.Time     `json:"generatedAt"`
}

type ServiceInfo struct {
	Name   string `json:"name"`
	Status string `json:"status"`
}

type ActionResponse struct {
	Action      string    `json:"action"`
	Status      string    `json:"status"`
	Message     string    `json:"message"`
	CompletedAt time.Time `json:"completedAt"`
}

func NewServer(cfg Config, logger *slog.Logger) *Server {
	if len(cfg.Capabilities) == 0 {
		cfg.Capabilities = defaultCapabilities()
	}
	return &Server{cfg: cfg, logger: logger}
}

func (s *Server) Run(ctx context.Context) error {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", s.withAuth(s.handleHealth))
	mux.HandleFunc("GET /capabilities", s.withAuth(s.handleCapabilities))
	mux.HandleFunc("GET /system", s.withAuth(s.handleSystem))
	mux.HandleFunc("GET /metrics", s.withAuth(s.handleMetrics))
	mux.HandleFunc("GET /services", s.withAuth(s.handleServices))
	mux.HandleFunc("POST /actions/{actionName}", s.withAuth(s.handleAction))

	httpServer := &http.Server{
		Addr:              net.JoinHostPort(s.cfg.ListenAddress, fmt.Sprintf("%d", s.cfg.ListenPort)),
		Handler:           mux,
		ReadHeaderTimeout: s.cfg.ReadTimeout,
		ReadTimeout:       s.cfg.ReadTimeout,
		WriteTimeout:      s.cfg.WriteTimeout,
	}

	errCh := make(chan error, 1)
	go func() {
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
		close(errCh)
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), s.cfg.ShutdownTimeout)
		defer cancel()
		s.logger.Info("shutting down agent HTTP API")
		return httpServer.Shutdown(shutdownCtx)
	case err := <-errCh:
		return err
	}
}

func (s *Server) withAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !s.authorized(r) {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "Unauthorized"})
			return
		}
		next(w, r)
	}
}

func (s *Server) authorized(r *http.Request) bool {
	provided := r.Header.Get(sharedSecretHeader)
	if provided == "" || s.cfg.SharedSecret == "" {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(provided), []byte(s.cfg.SharedSecret)) == 1
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, HealthResponse{
		Status:      "UP",
		Service:     "kyvora-agent",
		Version:     s.cfg.Version,
		Hostname:    s.cfg.Hostname,
		GeneratedAt: time.Now().UTC(),
	})
}

func (s *Server) handleCapabilities(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, CapabilityResponse{
		Version:     s.cfg.Version,
		Supports:    s.cfg.Capabilities,
		GeneratedAt: time.Now().UTC(),
	})
}

func (s *Server) handleSystem(w http.ResponseWriter, _ *http.Request) {
	facts := CollectHostFacts(s.cfg.Version, s.cfg.Hostname)
	writeJSON(w, http.StatusOK, facts)
}

func (s *Server) handleMetrics(w http.ResponseWriter, _ *http.Request) {
	facts := CollectHostFacts(s.cfg.Version, s.cfg.Hostname)
	writeJSON(w, http.StatusOK, MetricsResponse{
		CollectedAt: facts.CollectedAt,
		CPUCount:    facts.CPUCount,
		MemoryTotal: facts.MemoryTotalBytes,
		DiskTotal:   facts.DiskTotalBytes,
		DiskFree:    facts.DiskFreeBytes,
		Uptime:      facts.UptimeSeconds,
	})
}

func (s *Server) handleServices(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, ServicesResponse{
		Services:    []ServiceInfo{},
		GeneratedAt: time.Now().UTC(),
	})
}

func (s *Server) handleAction(w http.ResponseWriter, r *http.Request) {
	actionName := strings.TrimSpace(r.PathValue("actionName"))
	if actionName == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Action name is required"})
		return
	}
	writeJSON(w, http.StatusNotFound, ActionResponse{
		Action:      actionName,
		Status:      "UNSUPPORTED",
		Message:     "No remote actions are currently supported by this agent.",
		CompletedAt: time.Now().UTC(),
	})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
