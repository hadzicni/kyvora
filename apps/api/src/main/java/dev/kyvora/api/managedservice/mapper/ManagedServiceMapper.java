package dev.kyvora.api.managedservice.mapper;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import dev.kyvora.api.managedservice.dto.ManagedServiceCreateRequest;
import dev.kyvora.api.managedservice.dto.ManagedServiceResponse;
import dev.kyvora.api.managedservice.dto.ManagedServiceUpdateRequest;
import dev.kyvora.api.managedservice.dto.LinkedServerResponse;
import dev.kyvora.api.managedservice.entity.ManagedService;
import dev.kyvora.api.serverinventory.entity.ServerInventory;

@Component
public class ManagedServiceMapper {

	public ManagedService toEntity(ManagedServiceCreateRequest request, ServerInventory linkedServer) {
		return new ManagedService(
				trimToNull(request.name()),
				trimToNull(request.description()),
				trimToNull(request.url()),
				normalizeHostname(request.hostname()),
				trimToNull(request.ipAddress()),
				request.port(),
				request.protocol(),
				request.category(),
				request.status(),
				new LinkedHashSet<>(normalizeTags(request.tags())),
				trimToNull(request.notes()),
				linkedServer);
	}

	public void updateEntity(ManagedService entity, ManagedServiceUpdateRequest request, ServerInventory linkedServer) {
		entity.setName(trimToNull(request.name()));
		entity.setDescription(trimToNull(request.description()));
		entity.setUrl(trimToNull(request.url()));
		entity.setHostname(normalizeHostname(request.hostname()));
		entity.setIpAddress(trimToNull(request.ipAddress()));
		entity.setPort(request.port());
		entity.setProtocol(request.protocol());
		entity.setCategory(request.category());
		entity.setStatus(request.status());
		entity.setTags(new LinkedHashSet<>(normalizeTags(request.tags())));
		entity.setNotes(trimToNull(request.notes()));
		entity.setLinkedServer(linkedServer);
	}

	public ManagedServiceResponse toResponse(ManagedService entity) {
		return new ManagedServiceResponse(
				entity.getId().toString(),
				entity.getName(),
				entity.getDescription(),
				entity.getUrl(),
				entity.getHostname(),
				entity.getIpAddress(),
				entity.getPort(),
				entity.getProtocol(),
				entity.getCategory(),
				entity.getStatus(),
				entity.getTags(),
				entity.getNotes(),
				toLinkedServerResponse(entity.getLinkedServer()),
				entity.getCreatedAt(),
				entity.getUpdatedAt());
	}

	public String normalizeHostname(String hostname) {
		String value = trimToNull(hostname);
		return value == null ? null : value.toLowerCase(Locale.ROOT);
	}

	public List<String> normalizeTags(Collection<String> tags) {
		if (tags == null) {
			return List.of();
		}
		return tags.stream()
				.map(this::trimToNull)
				.filter(tag -> tag != null && !tag.isBlank())
				.distinct()
				.collect(Collectors.toList());
	}

	private LinkedServerResponse toLinkedServerResponse(ServerInventory server) {
		if (server == null) {
			return null;
		}
		return new LinkedServerResponse(
				server.getId().toString(),
				server.getName(),
				server.getHostname(),
				server.getIpAddress());
	}

	private String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
