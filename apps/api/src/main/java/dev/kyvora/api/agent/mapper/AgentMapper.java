package dev.kyvora.api.agent.mapper;

import java.util.Locale;

import org.springframework.stereotype.Component;

import dev.kyvora.api.agent.dto.AgentRegisterRequest;
import dev.kyvora.api.agent.dto.AgentHostFactsResponse;
import dev.kyvora.api.agent.dto.AgentResponse;
import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.agent.entity.AgentHostFacts;
import dev.kyvora.api.agent.entity.AgentStatus;
import dev.kyvora.api.serverinventory.entity.ServerInventory;

@Component
public class AgentMapper {

	public Agent toEntity(AgentRegisterRequest request, ServerInventory server) {
		return new Agent(
				normalizeName(request.name(), server),
				normalizeHostname(server.getHostname()),
				"unknown",
				AgentStatus.UNKNOWN,
				server,
				normalizeBaseUrl(request.baseUrl()),
				request.sharedSecret().trim());
	}

	public AgentResponse toResponse(Agent entity) {
		ServerInventory server = entity.getServer();
		return new AgentResponse(
				entity.getId().toString(),
				entity.getName(),
				server == null ? null : server.getId().toString(),
				server == null ? null : server.getName(),
				server == null ? null : server.getHostname(),
				entity.getHostname(),
				entity.getVersion(),
				entity.getStatus(),
				entity.getLastSeenAt(),
				entity.getBaseUrl(),
				entity.isPullEnabled(),
				entity.getLastPullAt(),
				entity.getLastSuccessfulPullAt(),
				entity.getLastPullError(),
				entity.getCapabilities(),
				entity.getRegisteredAt(),
				entity.getUpdatedAt(),
				toHostFactsResponse(entity.getHostFacts()));
	}

	public AgentHostFactsResponse toHostFactsResponse(AgentHostFacts facts) {
		if (facts == null) {
			return null;
		}
		return new AgentHostFactsResponse(
				facts.getHostname(),
				facts.getOperatingSystem(),
				facts.getPlatform(),
				facts.getKernelVersion(),
				facts.getArchitecture(),
				facts.getCpuCount(),
				facts.getMemoryTotalBytes(),
				facts.getDiskTotalBytes(),
				facts.getDiskFreeBytes(),
				facts.getUptimeSeconds(),
				facts.getIpAddresses(),
				facts.getAgentVersion(),
				facts.getCollectedAt(),
				facts.getUpdatedAt());
	}

	public String normalizeHostname(String hostname) {
		if (hostname == null || hostname.isBlank()) {
			return null;
		}
		return hostname.trim().toLowerCase(Locale.ROOT);
	}

	public String normalizeName(String name, ServerInventory server) {
		if (name == null || name.isBlank()) {
			return server.getName().trim() + " Agent";
		}
		return name.trim();
	}

	public String normalizeVersion(String version) {
		if (version == null || version.isBlank()) {
			return "0.1.0";
		}
		return version.trim();
	}

	public String normalizeBaseUrl(String baseUrl) {
		return baseUrl == null ? null : baseUrl.trim().replaceAll("/+$", "");
	}
}
