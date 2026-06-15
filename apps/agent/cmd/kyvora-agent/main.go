package main

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"dev.kyvora/agent/internal/agent"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	cfg, err := agent.LoadConfig()
	if err != nil {
		logger.Error("configuration error", "error", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := agent.Run(ctx, cfg, logger); err != nil {
		if errors.Is(err, context.Canceled) {
			return
		}
		logger.Error("agent stopped", "error", err)
		os.Exit(1)
	}
}
