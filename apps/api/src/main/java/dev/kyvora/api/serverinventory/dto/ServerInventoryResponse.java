package dev.kyvora.api.serverinventory.dto;

import java.time.Instant;
import java.util.List;

import dev.kyvora.api.serverinventory.entity.ServerStatus;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Server inventory entry returned by the API.")
public record ServerInventoryResponse(
		@Schema(description = "Server inventory entry identifier.", example = "00000000-0000-0000-0000-000000000001")
		String id,
		@Schema(description = "Human-readable server name.", example = "Web 01")
		String name,
		@Schema(description = "DNS hostname.", example = "web01.example.com")
		String hostname,
		@Schema(description = "IPv4 address assigned to the server.", example = "10.0.0.10")
		String ipAddress,
		@Schema(description = "Operational notes for the server.", example = "Primary web server")
		String description,
		@Schema(description = "Tags used for filtering and grouping.", example = "[\"prod\", \"web\"]")
		List<String> tags,
		@Schema(description = "Operating system name or family.", example = "Ubuntu 24.04")
		String operatingSystem,
		@Schema(description = "Current server status.", example = "ONLINE")
		ServerStatus status,
		@Schema(description = "Time when Kyvora last observed the server.", example = "2026-06-07T00:00:00Z")
		Instant lastSeenAt,
		@Schema(description = "Time when the inventory entry was created.", example = "2026-06-07T00:00:00Z")
		Instant createdAt,
		@Schema(description = "Time when the inventory entry was last updated.", example = "2026-06-07T01:00:00Z")
		Instant updatedAt) {
}
