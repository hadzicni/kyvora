package dev.kyvora.api.managedservice.dto;

import java.time.Instant;
import java.util.List;

import dev.kyvora.api.managedservice.entity.ManagedServiceCategory;
import dev.kyvora.api.managedservice.entity.ManagedServiceProtocol;

public record ManagedServiceResponse(
		String id,
		String name,
		String description,
		String url,
		String hostname,
		String ipAddress,
		Integer port,
		ManagedServiceProtocol protocol,
		ManagedServiceCategory category,
		List<String> tags,
		String notes,
		LinkedServerResponse linkedServer,
		Instant createdAt,
		Instant updatedAt) {
}
