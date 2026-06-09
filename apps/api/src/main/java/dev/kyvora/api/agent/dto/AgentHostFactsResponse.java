package dev.kyvora.api.agent.dto;

import java.time.Instant;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Latest host inventory facts reported by an enrolled agent.")
public record AgentHostFactsResponse(
		String hostname,
		String operatingSystem,
		String platform,
		String kernelVersion,
		String architecture,
		Integer cpuCount,
		Long memoryTotalBytes,
		Long diskTotalBytes,
		Long diskFreeBytes,
		Long uptimeSeconds,
		List<String> ipAddresses,
		String agentVersion,
		Instant collectedAt,
		Instant updatedAt) {
}
