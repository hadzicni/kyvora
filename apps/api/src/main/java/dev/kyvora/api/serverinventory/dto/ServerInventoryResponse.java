package dev.kyvora.api.serverinventory.dto;

import dev.kyvora.api.serverinventory.entity.ServerStatus;

public record ServerInventoryResponse(
		String id,
		String name,
		String hostname,
		String ipAddress,
		ServerStatus status) {
}
