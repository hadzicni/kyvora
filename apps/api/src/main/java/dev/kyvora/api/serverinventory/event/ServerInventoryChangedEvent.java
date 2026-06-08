package dev.kyvora.api.serverinventory.event;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.entity.ServerStatus;

public record ServerInventoryChangedEvent(
		ServerInventoryEventType type,
		Instant occurredAt,
		UUID serverId,
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

	public static ServerInventoryChangedEvent from(ServerInventoryEventType type, ServerInventory server) {
		return new ServerInventoryChangedEvent(
				type,
				Instant.now(),
				server.getId(),
				server.getName(),
				server.getHostname(),
				server.getIpAddress(),
				server.getDescription(),
				List.copyOf(server.getTags()),
				server.getOperatingSystem(),
				server.getStatus(),
				server.getLastSeenAt(),
				server.getCreatedAt(),
				server.getUpdatedAt());
	}
}
