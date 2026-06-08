package dev.kyvora.api.agent.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Agent enrollment response. The token is returned only once and is never stored in plaintext.")
public record AgentEnrollmentResponse(
		@Schema(description = "Created agent.")
		AgentResponse agent,

		@Schema(description = "One-time plaintext agent token. Store it securely; Kyvora only stores its hash.")
		String agentToken) {
}
