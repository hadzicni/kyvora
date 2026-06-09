package dev.kyvora.api.serverinventory.mapper;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import dev.kyvora.api.agent.dto.AgentHostFactsResponse;
import dev.kyvora.api.agent.entity.AgentHostFacts;
import dev.kyvora.api.serverinventory.dto.ServerInventoryCreateRequest;
import dev.kyvora.api.serverinventory.dto.ServerInventoryResponse;
import dev.kyvora.api.serverinventory.dto.ServerInventoryUpdateRequest;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.entity.ServerStatus;

@Component
public class ServerInventoryMapper {

	public ServerInventory toEntity(ServerInventoryCreateRequest request) {
		return new ServerInventory(
				request.name(),
				request.hostname(),
				request.ipAddress(),
				request.description(),
				request.tags() == null ? null : new LinkedHashSet<>(request.tags()),
				request.operatingSystem(),
				ServerStatus.UNKNOWN,
				null);
	}

	public void updateEntity(ServerInventory entity, ServerInventoryUpdateRequest request) {
		entity.setName(request.name());
		entity.setHostname(request.hostname());
		entity.setIpAddress(request.ipAddress());
		entity.setDescription(request.description());
		entity.setTags(request.tags() == null ? null : new LinkedHashSet<>(request.tags()));
		entity.setOperatingSystem(request.operatingSystem());
	}

	public ServerInventoryResponse toResponse(ServerInventory entity) {
		return toResponse(entity, null);
	}

	public ServerInventoryResponse toResponse(ServerInventory entity, AgentHostFacts facts) {
		return new ServerInventoryResponse(
				entity.getId().toString(),
				entity.getName(),
				entity.getHostname(),
				entity.getIpAddress(),
				entity.getDescription(),
				entity.getTags(),
				entity.getOperatingSystem(),
				entity.getStatus(),
				entity.getLastSeenAt(),
				entity.getCreatedAt(),
				entity.getUpdatedAt(),
				toHostFactsResponse(facts));
	}

	private AgentHostFactsResponse toHostFactsResponse(AgentHostFacts facts) {
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

	public List<ServerInventoryResponse> toResponses(List<ServerInventory> entities) {
		return entities.stream().map(this::toResponse).toList();
	}

	public String normalizeHostname(String hostname) {
		return hostname == null ? null : hostname.trim().toLowerCase(Locale.ROOT);
	}

	public List<String> normalizeTags(Collection<String> tags) {
		if (tags == null) {
			return List.of();
		}
		return tags.stream()
				.map(tag -> tag == null ? null : tag.trim())
				.filter(tag -> tag != null && !tag.isBlank())
				.distinct()
				.collect(Collectors.toList());
	}
}
