package agent

import (
	"context"
	"log/slog"
)

func Run(ctx context.Context, cfg Config, logger *slog.Logger) error {
	server := NewServer(cfg, logger)
	logger.Info("starting agent HTTP API", "listen_address", cfg.ListenAddress, "listen_port", cfg.ListenPort, "hostname", cfg.Hostname, "version", cfg.Version)
	return server.Run(ctx)
}
