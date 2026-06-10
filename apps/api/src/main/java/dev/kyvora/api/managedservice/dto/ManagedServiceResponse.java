package dev.kyvora.api.managedservice.dto;

import java.time.Instant;
import java.util.List;

import dev.kyvora.api.managedservice.entity.ManagedServiceCategory;
import dev.kyvora.api.managedservice.entity.ManagedServiceProtocol;
import dev.kyvora.api.managedservice.entity.ManagedServiceStatus;

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
		ManagedServiceStatus status,
		List<String> tags,
		String notes,
		LinkedServerResponse linkedServer,
		Instant createdAt,
		Instant updatedAt) {
}
