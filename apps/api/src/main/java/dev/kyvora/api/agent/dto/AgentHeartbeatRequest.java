package dev.kyvora.api.agent.dto;

import dev.kyvora.api.agent.entity.AgentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Payload sent by a registered agent heartbeat.")
public record AgentHeartbeatRequest(
		@Schema(description = "Agent status reported by the heartbeat.", example = "ONLINE")
		@NotNull
		AgentStatus status,

		@Schema(description = "Agent software version.", example = "0.1.1", minLength = 1, maxLength = 64)
		@Size(min = 1, max = 64)
		String version,

		@Schema(description = "Hostname reported by the agent.", example = "node01.example.com", maxLength = 253)
		@Size(max = 253)
		String hostname,

		@Schema(description = "Latest host inventory facts collected by the agent.")
		@Valid
		AgentHostFactsRequest hostFacts) {
}
