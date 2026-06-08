package dev.kyvora.api.agent.dto;

import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Payload used to register an agent with Kyvora.")
public record AgentRegisterRequest(
		@Schema(description = "Server inventory entry this agent will run on.", example = "00000000-0000-0000-0000-000000000001")
		@NotNull
		UUID serverId,

		@Schema(description = "Human-readable agent name. Defaults to '<server name> Agent' when omitted.", example = "Homelab Agent 01", minLength = 2, maxLength = 120)
		@Size(min = 2, max = 120)
		String name,

		@Schema(description = "Agent software version.", example = "0.1.0", minLength = 1, maxLength = 64)
		@Size(min = 1, max = 64)
		String version) {
}
