package dev.kyvora.api.agent.dto;

import java.time.Instant;

import dev.kyvora.api.agent.entity.AgentStatus;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Result of a manual pull from a configured agent.")
public record AgentPullResponse(
		@Schema(description = "Updated agent.")
		AgentResponse agent,
		@Schema(description = "Resulting pull status.", example = "ONLINE")
		AgentStatus status,
		@Schema(description = "Pull completion timestamp.", example = "2026-06-08T10:00:00Z")
		Instant pulledAt,
		@Schema(description = "Pull error message when the agent could not be reached or rejected the request.")
		String error) {
}
