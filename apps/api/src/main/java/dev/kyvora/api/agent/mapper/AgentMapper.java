package dev.kyvora.api.agent.mapper;

import java.util.Locale;

import org.springframework.stereotype.Component;

import dev.kyvora.api.agent.dto.AgentRegisterRequest;
import dev.kyvora.api.agent.dto.AgentResponse;
import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.agent.entity.AgentStatus;

@Component
public class AgentMapper {

	public Agent toEntity(AgentRegisterRequest request) {
		return new Agent(
				request.name().trim(),
				normalizeHostname(request.hostname()),
				normalizeVersion(request.version()),
				AgentStatus.PENDING);
	}

	public AgentResponse toResponse(Agent entity) {
		return new AgentResponse(
				entity.getId().toString(),
				entity.getName(),
				entity.getHostname(),
				entity.getVersion(),
				entity.getStatus(),
				entity.getLastSeenAt(),
				entity.getRegisteredAt(),
				entity.getUpdatedAt());
	}

	public String normalizeHostname(String hostname) {
		if (hostname == null || hostname.isBlank()) {
			return null;
		}
		return hostname.trim().toLowerCase(Locale.ROOT);
	}

	public String normalizeVersion(String version) {
		if (version == null || version.isBlank()) {
			return "0.1.0";
		}
		return version.trim();
	}
}
