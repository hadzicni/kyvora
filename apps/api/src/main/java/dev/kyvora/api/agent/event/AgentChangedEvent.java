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
		AgentStatus previousStatus,
		Instant lastSeenAt,
		UUID serverId,
		String serverName,
		String actor,
		Instant occurredAt) {

	public AgentChangedEvent(
			AgentEventType type,
			UUID agentId,
			String name,
			String hostname,
			String version,
			AgentStatus status,
			Instant lastSeenAt,
			UUID serverId,
			String serverName,
			String actor,
			Instant occurredAt) {
		this(type, agentId, name, hostname, version, status, null, lastSeenAt, serverId, serverName, actor, occurredAt);
	}

	public static AgentChangedEvent from(AgentEventType type, Agent agent) {
		return new AgentChangedEvent(
				type,
				agent.getId(),
				agent.getName(),
				agent.getHostname(),
				agent.getVersion(),
				agent.getStatus(),
				null,
				agent.getLastSeenAt(),
				agent.getServer() == null ? null : agent.getServer().getId(),
				agent.getServer() == null ? null : agent.getServer().getName(),
				null,
				Instant.now());
	}

	public static AgentChangedEvent fromAgentActor(AgentEventType type, Agent agent) {
		String actor = agent.getHostname() == null || agent.getHostname().isBlank()
				? "agent:" + agent.getId()
				: "agent:" + agent.getHostname();
		return withActor(type, agent, actor);
	}

	public static AgentChangedEvent fromSystemActor(AgentEventType type, Agent agent) {
		return withActor(type, agent, "system:agent-monitor");
	}

	public static AgentChangedEvent decommissioned(
			Agent agent,
			AgentStatus previousStatus,
			UUID serverId,
			String serverName) {
		return new AgentChangedEvent(
				AgentEventType.AGENT_DECOMMISSIONED,
				agent.getId(),
				agent.getName(),
				agent.getHostname(),
				agent.getVersion(),
				agent.getStatus(),
				previousStatus,
				agent.getLastSeenAt(),
				serverId,
				serverName,
				null,
				Instant.now());
	}

	private static AgentChangedEvent withActor(AgentEventType type, Agent agent, String actor) {
		return new AgentChangedEvent(
				type,
				agent.getId(),
				agent.getName(),
				agent.getHostname(),
				agent.getVersion(),
				agent.getStatus(),
				null,
				agent.getLastSeenAt(),
				agent.getServer() == null ? null : agent.getServer().getId(),
				agent.getServer() == null ? null : agent.getServer().getName(),
				actor,
				Instant.now());
	}
}
