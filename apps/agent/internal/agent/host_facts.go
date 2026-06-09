package agent

import (
	"net"
	"os"
	"os/exec"
	"runtime"
	"sort"
	"strings"
	"time"
)

type HostFacts struct {
	Hostname         string    `json:"hostname,omitempty"`
	OperatingSystem  string    `json:"operatingSystem,omitempty"`
	Platform         string    `json:"platform,omitempty"`
	KernelVersion    string    `json:"kernelVersion,omitempty"`
	Architecture     string    `json:"architecture,omitempty"`
	CPUCount         *int      `json:"cpuCount,omitempty"`
	MemoryTotalBytes *uint64   `json:"memoryTotalBytes,omitempty"`
	DiskTotalBytes   *uint64   `json:"diskTotalBytes,omitempty"`
	DiskFreeBytes    *uint64   `json:"diskFreeBytes,omitempty"`
	UptimeSeconds    *uint64   `json:"uptimeSeconds,omitempty"`
	IPAddresses      []string  `json:"ipAddresses,omitempty"`
	AgentVersion     string    `json:"agentVersion,omitempty"`
	CollectedAt      time.Time `json:"collectedAt"`
}

type platformInfo struct {
	operatingSystem string
	platform        string
	kernelVersion   string
}

type hostFactCollectors struct {
	hostname     func() (string, error)
	interfaces   func() ([]net.Interface, error)
	platformInfo func() platformInfo
	memoryTotal  func() (uint64, error)
	diskUsage    func() (uint64, uint64, error)
	uptime       func() (uint64, error)
	now          func() time.Time
}

func CollectHostFacts(agentVersion, configuredHostname string) HostFacts {
	return collectHostFacts(agentVersion, configuredHostname, defaultHostFactCollectors())
}

func collectHostFacts(agentVersion, configuredHostname string, collectors hostFactCollectors) HostFacts {
	facts := HostFacts{
		Hostname:        strings.TrimSpace(configuredHostname),
		Architecture:    runtime.GOARCH,
		CPUCount:        intPtr(runtime.NumCPU()),
		AgentVersion:    agentVersion,
		CollectedAt:     collectors.now().UTC(),
		OperatingSystem: runtime.GOOS,
		Platform:        runtime.GOOS,
	}

	if facts.Hostname == "" {
		if hostname, err := collectors.hostname(); err == nil {
			facts.Hostname = strings.TrimSpace(hostname)
		}
	}

	platform := collectors.platformInfo()
	if platform.operatingSystem != "" {
		facts.OperatingSystem = platform.operatingSystem
	}
	if platform.platform != "" {
		facts.Platform = platform.platform
	}
	if platform.kernelVersion != "" {
		facts.KernelVersion = platform.kernelVersion
	}

	if total, err := collectors.memoryTotal(); err == nil && total > 0 {
		facts.MemoryTotalBytes = uint64Ptr(total)
	}
	if total, free, err := collectors.diskUsage(); err == nil && total > 0 {
		facts.DiskTotalBytes = uint64Ptr(total)
		facts.DiskFreeBytes = uint64Ptr(free)
	}
	if uptime, err := collectors.uptime(); err == nil && uptime > 0 {
		facts.UptimeSeconds = uint64Ptr(uptime)
	}
	if interfaces, err := collectors.interfaces(); err == nil {
		facts.IPAddresses = collectIPAddresses(interfaces)
	}

	return facts
}

func defaultHostFactCollectors() hostFactCollectors {
	return hostFactCollectors{
		hostname:     os.Hostname,
		interfaces:   net.Interfaces,
		platformInfo: defaultPlatformInfo,
		memoryTotal:  collectMemoryTotalBytes,
		diskUsage:    collectDiskUsage,
		uptime:       collectUptimeSeconds,
		now:          time.Now,
	}
}

func defaultPlatformInfo() platformInfo {
	return platformInfo{
		operatingSystem: runtime.GOOS,
		platform:        runtime.GOOS,
		kernelVersion:   commandOutput("uname", "-r"),
	}
}

func collectIPAddresses(interfaces []net.Interface) []string {
	addresses := make([]string, 0)
	seen := make(map[string]struct{})
	for _, iface := range interfaces {
		if iface.Flags&net.FlagUp == 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			ip := ipFromAddress(addr)
			if ip == nil || ip.IsLoopback() {
				continue
			}
			value := ip.String()
			if _, ok := seen[value]; ok {
				continue
			}
			seen[value] = struct{}{}
			addresses = append(addresses, value)
		}
	}
	sort.Strings(addresses)
	return addresses
}

func ipFromAddress(addr net.Addr) net.IP {
	switch value := addr.(type) {
	case *net.IPNet:
		return value.IP
	case *net.IPAddr:
		return value.IP
	default:
		return nil
	}
}

func commandOutput(name string, args ...string) string {
	output, err := exec.Command(name, args...).Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(output))
}

func intPtr(value int) *int {
	return &value
}

func uint64Ptr(value uint64) *uint64 {
	return &value
}
