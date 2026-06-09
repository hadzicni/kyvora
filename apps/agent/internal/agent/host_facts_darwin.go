//go:build darwin

package agent

import (
	"regexp"
	"strconv"
)

func collectMemoryTotalBytes() (uint64, error) {
	value := commandOutput("sysctl", "-n", "hw.memsize")
	if value == "" {
		return 0, nil
	}
	return strconv.ParseUint(value, 10, 64)
}

func collectUptimeSeconds() (uint64, error) {
	value := commandOutput("sysctl", "-n", "kern.boottime")
	if value == "" {
		return 0, nil
	}
	matches := regexp.MustCompile(`sec = ([0-9]+)`).FindStringSubmatch(value)
	if len(matches) != 2 {
		return 0, nil
	}
	bootTime, err := strconv.ParseInt(matches[1], 10, 64)
	if err != nil {
		return 0, err
	}
	now := defaultHostFactCollectors().now().Unix()
	if now <= bootTime {
		return 0, nil
	}
	return uint64(now - bootTime), nil
}
