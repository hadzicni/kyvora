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

	logger.Info("starting enrolled agent", "api_url", cfg.APIURL, "agent_id", cfg.AgentID, "hostname", cfg.Hostname, "version", cfg.Version)
	if err := sendHeartbeat(ctx, client, cfg.AgentID, cfg.Version, cfg.Hostname, logger); err != nil {
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
			if err := sendHeartbeat(ctx, client, cfg.AgentID, cfg.Version, cfg.Hostname, logger); err != nil {
				var authError *AgentTokenAuthError
				if errors.As(err, &authError) {
					logger.Error("agent token is invalid or revoked", "agent_id", cfg.AgentID, "status", authError.StatusCode, "error", err)
					return err
				}
				logger.Error("heartbeat failed", "agent_id", cfg.AgentID, "error", err)
			}
		}
	}
}

func sendHeartbeat(ctx context.Context, client *Client, agentID, version, hostname string, logger *slog.Logger) error {
	agent, err := client.Heartbeat(ctx, agentID, version, hostname)
	if err != nil {
		var authError *AgentTokenAuthError
		if errors.As(err, &authError) {
			logger.Error("agent token is invalid or revoked", "agent_id", agentID, "status", authError.StatusCode, "error", err)
		}
		return err
	}
	logger.Info("heartbeat sent", "agent_id", agent.ID, "status", agent.Status, "version", agent.Version)
	return nil
}
