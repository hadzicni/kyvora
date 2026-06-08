package dev.kyvora.api.agent.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Payload used to register an agent with Kyvora.")
public record AgentRegisterRequest(
		@Schema(description = "Human-readable agent name.", example = "Homelab Agent 01", minLength = 2, maxLength = 120)
		@NotBlank
		@Size(min = 2, max = 120)
		String name,

		@Schema(description = "Hostname reported by the agent.", example = "node01.example.com", maxLength = 253)
		@Size(max = 253)
		@Pattern(regexp = HOSTNAME_PATTERN)
		String hostname,

		@Schema(description = "Agent software version.", example = "0.1.0", minLength = 1, maxLength = 64)
		@Size(min = 1, max = 64)
		String version) {

	private static final String HOSTNAME_PATTERN =
			"^(?=.{1,253}$)(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)\\.)*(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)$";
}
