package dev.kyvora.api.agent.event;

import java.time.Instant;
import java.util.UUID;

import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.agent.entity.AgentStatus;

public record AgentChangedEvent(
		AgentEventType type,
		UUID agentId,
		String name,
		String hostname,
		String version,
		AgentStatus status,
		Instant lastSeenAt,
		Instant occurredAt) {

	public static AgentChangedEvent from(AgentEventType type, Agent agent) {
		return new AgentChangedEvent(
				type,
				agent.getId(),
				agent.getName(),
				agent.getHostname(),
				agent.getVersion(),
				agent.getStatus(),
				agent.getLastSeenAt(),
				Instant.now());
	}
}
