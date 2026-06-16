package main

import (
	"context"
	"errors"
	"flag"
	"log/slog"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"dev.kyvora/agent/internal/agent"
)

func main() {
	configPath := flag.String("config", "", "Path to the Kyvora Agent YAML config file")
	flag.Parse()

	cfg, err := loadConfig(*configPath)
	if err != nil {
		logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
		logger.Error("configuration error", "error", err)
		os.Exit(1)
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slogLevel(cfg.LogLevel),
	}))

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

func loadConfig(configPath string) (agent.Config, error) {
	if strings.TrimSpace(configPath) != "" {
		return agent.LoadConfigFile(configPath)
	}
	return agent.LoadConfig()
}

func slogLevel(level string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(level)) {
	case "debug":
		return slog.LevelDebug
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
