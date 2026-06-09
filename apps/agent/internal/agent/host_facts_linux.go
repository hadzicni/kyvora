//go:build linux

package agent

import "syscall"

func collectMemoryTotalBytes() (uint64, error) {
	var info syscall.Sysinfo_t
	if err := syscall.Sysinfo(&info); err != nil {
		return 0, err
	}
	return info.Totalram * uint64(info.Unit), nil
}

func collectUptimeSeconds() (uint64, error) {
	var info syscall.Sysinfo_t
	if err := syscall.Sysinfo(&info); err != nil {
		return 0, err
	}
	if info.Uptime < 0 {
		return 0, nil
	}
	return uint64(info.Uptime), nil
}
