package agent

import (
	"errors"
	"net"
	"testing"
	"time"
)

func TestCollectHostFactsHandlesPartialFailures(t *testing.T) {
	collectedAt := time.Date(2026, 6, 9, 10, 0, 0, 0, time.UTC)

	facts := collectHostFacts("0.1.0", "", hostFactCollectors{
		hostname: func() (string, error) {
			return "", errors.New("hostname unavailable")
		},
		interfaces: func() ([]net.Interface, error) {
			return nil, errors.New("interfaces unavailable")
		},
		platformInfo: func() platformInfo {
			return platformInfo{
				operatingSystem: "linux",
				platform:        "linux",
				kernelVersion:   "6.8.0",
			}
		},
		memoryTotal: func() (uint64, error) {
			return 0, errors.New("memory unavailable")
		},
		diskUsage: func() (uint64, uint64, error) {
			return 0, 0, errors.New("disk unavailable")
		},
		uptime: func() (uint64, error) {
			return 0, errors.New("uptime unavailable")
		},
		now: func() time.Time {
			return collectedAt
		},
	})

	if facts.AgentVersion != "0.1.0" {
		t.Fatalf("AgentVersion = %q, want 0.1.0", facts.AgentVersion)
	}
	if facts.OperatingSystem != "linux" || facts.Platform != "linux" || facts.KernelVersion != "6.8.0" {
		t.Fatalf("unexpected platform facts: %#v", facts)
	}
	if facts.MemoryTotalBytes != nil || facts.DiskTotalBytes != nil || facts.DiskFreeBytes != nil || facts.UptimeSeconds != nil {
		t.Fatalf("optional failed facts should be nil: %#v", facts)
	}
	if !facts.CollectedAt.Equal(collectedAt) {
		t.Fatalf("CollectedAt = %s, want %s", facts.CollectedAt, collectedAt)
	}
}
