package dev.kyvora.api.auth.dto;

import java.util.UUID;

import dev.kyvora.api.auth.entity.UserRole;

public record AuthUserResponse(
		UUID id,
		String email,
		String displayName,
		UserRole role,
		boolean mustChangePassword) {
}
