package dev.kyvora.api.agent.dto;

import java.time.Instant;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

@Schema(description = "Latest host inventory facts collected by the enrolled agent.")
public record AgentHostFactsRequest(
		@Size(max = 253)
		String hostname,
		@Size(max = 120)
		String operatingSystem,
		@Size(max = 120)
		String platform,
		@Size(max = 120)
		String kernelVersion,
		@Size(max = 64)
		String architecture,
		@Min(1)
		@Max(4096)
		Integer cpuCount,
		@Min(0)
		Long memoryTotalBytes,
		@Min(0)
		Long diskTotalBytes,
		@Min(0)
		Long diskFreeBytes,
		@Min(0)
		Long uptimeSeconds,
		@Size(max = 64)
		List<@Size(max = 64) String> ipAddresses,
		@Size(max = 64)
		String agentVersion,
		Instant collectedAt) {
}
