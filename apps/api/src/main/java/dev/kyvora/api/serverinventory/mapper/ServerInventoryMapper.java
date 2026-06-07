package dev.kyvora.api.serverinventory.mapper;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import dev.kyvora.api.serverinventory.dto.ServerInventoryCreateRequest;
import dev.kyvora.api.serverinventory.dto.ServerInventoryResponse;
import dev.kyvora.api.serverinventory.dto.ServerInventoryUpdateRequest;
import dev.kyvora.api.serverinventory.entity.ServerInventory;

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
				request.status(),
				null);
	}

	public void updateEntity(ServerInventory entity, ServerInventoryUpdateRequest request) {
		entity.setName(request.name());
		entity.setHostname(request.hostname());
		entity.setIpAddress(request.ipAddress());
		entity.setDescription(request.description());
		entity.setTags(request.tags() == null ? null : new LinkedHashSet<>(request.tags()));
		entity.setOperatingSystem(request.operatingSystem());
		entity.setStatus(request.status());
	}

	public ServerInventoryResponse toResponse(ServerInventory entity) {
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
				entity.getUpdatedAt());
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
