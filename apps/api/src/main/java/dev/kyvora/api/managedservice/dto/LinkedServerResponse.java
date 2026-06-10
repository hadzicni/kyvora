package dev.kyvora.api.managedservice.dto;

public record LinkedServerResponse(
		String id,
		String name,
		String hostname,
		String ipAddress) {
}
