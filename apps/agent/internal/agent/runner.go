package agent

import (
	"context"
	"errors"
	"log/slog"
	"time"
)

func Run(ctx context.Context, cfg Config, logger *slog.Logger) error {
	client, err := NewClient(cfg)
	if err != nil {
		return err
	}

	if err := client.Authenticate(ctx); err != nil {
		return err
	}

	logger.Info("registering agent", "api_url", cfg.APIURL, "name", cfg.Name, "hostname", cfg.Hostname, "version", cfg.Version)
	registered, err := client.Register(ctx, cfg)
	if err != nil {
		var duplicate *DuplicateHostnameError
		if errors.As(err, &duplicate) {
			logger.Error(
				"agent hostname already exists",
				"hostname", duplicate.Hostname,
				"details", duplicate.Details,
				"next_steps", "Use a unique KYVORA_AGENT_HOSTNAME, remove the existing duplicate agent in the Kyvora UI, or reuse that agent only after adding a backend lookup flow.",
			)
		}
		return err
	}

	logger.Info("agent registered", "agent_id", registered.ID, "status", registered.Status)
	if err := sendHeartbeat(ctx, client, registered.ID, cfg.Version, logger); err != nil {
		return err
	}

	ticker := time.NewTicker(cfg.HeartbeatInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			logger.Info("shutdown requested")
			return nil
		case <-ticker.C:
			if err := sendHeartbeat(ctx, client, registered.ID, cfg.Version, logger); err != nil {
				logger.Error("heartbeat failed", "agent_id", registered.ID, "error", err)
			}
		}
	}
}

func sendHeartbeat(ctx context.Context, client *Client, agentID, version string, logger *slog.Logger) error {
	agent, err := client.Heartbeat(ctx, agentID, version)
	if err != nil {
		return err
	}
	logger.Info("heartbeat sent", "agent_id", agent.ID, "status", agent.Status, "version", agent.Version)
	return nil
}
