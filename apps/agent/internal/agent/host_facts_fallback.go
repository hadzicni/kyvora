//go:build !linux && !darwin

package agent

func collectMemoryTotalBytes() (uint64, error) {
	return 0, nil
}

func collectDiskUsage() (uint64, uint64, error) {
	return 0, 0, nil
}

func collectUptimeSeconds() (uint64, error) {
	return 0, nil
}
