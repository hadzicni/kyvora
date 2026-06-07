package dev.kyvora.api.serverinventory.dto;

import java.time.Instant;
import java.util.List;

import dev.kyvora.api.serverinventory.entity.ServerStatus;

public record ServerInventoryResponse(
		String id,
		String name,
		String hostname,
		String ipAddress,
		String description,
		List<String> tags,
		String operatingSystem,
 		ServerStatus status,
		Instant lastSeenAt,
		Instant createdAt,
		Instant updatedAt) {
}
