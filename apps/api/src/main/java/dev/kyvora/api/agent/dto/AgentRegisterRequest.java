package dev.kyvora.api.agent.dto;

import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Payload used to configure a pull-based agent target.")
public record AgentRegisterRequest(
		@Schema(description = "Server inventory entry this agent will run on.", example = "00000000-0000-0000-0000-000000000001")
		@NotNull
		UUID serverId,

		@Schema(description = "Human-readable agent name. Defaults to '<server name> Agent' when omitted.", example = "Homelab Agent 01", minLength = 2, maxLength = 120)
		@Size(min = 2, max = 120)
		String name,

		@Schema(description = "Agent base URL used by the Kyvora API when pulling data.", example = "http://10.0.0.15:9187", minLength = 8, maxLength = 512)
		@NotNull
		@Size(min = 8, max = 512)
		String baseUrl,

		@Schema(description = "Shared secret used by Kyvora when calling the agent. Never returned in API responses.", minLength = 12, maxLength = 512)
		@NotNull
		@Size(min = 12, max = 512)
		String sharedSecret,

		@Schema(description = "Whether Kyvora may pull data from this agent.", example = "true")
		Boolean pullEnabled) {
}
