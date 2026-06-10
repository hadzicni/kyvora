package dev.kyvora.api.managedservice.dto;

import java.util.List;
import java.util.UUID;

import dev.kyvora.api.managedservice.entity.ManagedServiceCategory;
import dev.kyvora.api.managedservice.entity.ManagedServiceProtocol;

public record ManagedServiceFilter(
		String q,
		String name,
		String hostname,
		String ipAddress,
		ManagedServiceProtocol protocol,
		ManagedServiceCategory category,
		List<String> tags,
		UUID linkedServerId) {
}
