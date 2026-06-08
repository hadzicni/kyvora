package dev.kyvora.api.serverinventory.dto;

import java.util.List;

import dev.kyvora.api.serverinventory.entity.ServerStatus;

public record ServerInventoryFilter(
		String q,
		String name,
		String hostname,
		String ipAddress,
		ServerStatus status,
		List<String> tags) {
}
