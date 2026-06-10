package dev.kyvora.api.managedservice.dto;

import java.util.List;
import java.util.UUID;

import dev.kyvora.api.managedservice.entity.ManagedServiceCategory;
import dev.kyvora.api.managedservice.entity.ManagedServiceProtocol;
import dev.kyvora.api.managedservice.entity.ManagedServiceStatus;

public record ManagedServiceFilter(
		String q,
		String name,
		String hostname,
		String ipAddress,
		ManagedServiceProtocol protocol,
		ManagedServiceCategory category,
		ManagedServiceStatus status,
		List<String> tags,
		UUID linkedServerId) {
}
