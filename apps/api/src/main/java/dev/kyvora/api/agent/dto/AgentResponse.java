package dev.kyvora.api.agent.dto;

import java.time.Instant;

import dev.kyvora.api.agent.entity.AgentStatus;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Agent returned by the API.")
public record AgentResponse(
		@Schema(description = "Agent identifier.", example = "00000000-0000-0000-0000-000000000001")
		String id,
		@Schema(description = "Human-readable agent name.", example = "Homelab Agent 01")
		String name,
		@Schema(description = "Linked server inventory entry identifier.", example = "00000000-0000-0000-0000-000000000001")
		String serverId,
		@Schema(description = "Linked server name.", example = "Web 01")
		String serverName,
		@Schema(description = "Linked server hostname.", example = "web01.example.com")
		String serverHostname,
		@Schema(description = "Hostname reported by the agent.", example = "node01.example.com")
		String hostname,
		@Schema(description = "Agent software version.", example = "0.1.0")
		String version,
		@Schema(description = "Current agent status.", example = "ONLINE")
		AgentStatus status,
		@Schema(description = "Time when Kyvora last received a heartbeat from the agent.", example = "2026-06-08T10:00:00Z")
		Instant lastSeenAt,
		@Schema(description = "Time when the agent was registered.", example = "2026-06-08T09:00:00Z")
		Instant registeredAt,
		@Schema(description = "Time when the agent was last updated.", example = "2026-06-08T10:00:00Z")
		Instant updatedAt,
		@Schema(description = "Time when the current token hash was created.", example = "2026-06-08T09:00:00Z")
		Instant tokenCreatedAt,
		@Schema(description = "Time when the current token was last used for heartbeat authentication.", example = "2026-06-08T10:00:00Z")
		Instant tokenLastUsedAt,
		@Schema(description = "Time when the token was revoked, when applicable.", example = "2026-06-08T11:00:00Z")
		Instant tokenRevokedAt,
		@Schema(description = "Latest host inventory facts reported by this agent.")
		AgentHostFactsResponse hostFacts) {
}
