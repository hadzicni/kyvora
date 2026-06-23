package dev.kyvora.api.agent.dto;

import java.time.Instant;
import java.util.List;

public record AgentConnectionTestResponse(
		boolean success,
		String status,
		String message,
		String agentVersion,
		List<String> capabilities,
		long responseTimeMs,
		Instant checkedAt,
		String errorCode) {
}
