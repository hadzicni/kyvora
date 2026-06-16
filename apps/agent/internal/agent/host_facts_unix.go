//go:build linux

package agent

import "syscall"

func collectDiskUsage() (uint64, uint64, error) {
	var stat syscall.Statfs_t
	if err := syscall.Statfs("/", &stat); err != nil {
		return 0, 0, err
	}
	blockSize := uint64(stat.Bsize)
	return stat.Blocks * blockSize, stat.Bavail * blockSize, nil
}
