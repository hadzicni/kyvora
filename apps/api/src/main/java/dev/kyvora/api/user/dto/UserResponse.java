package dev.kyvora.api.user.dto;

import java.time.Instant;
import java.util.UUID;

import dev.kyvora.api.auth.entity.UserRole;

public record UserResponse(
		UUID id,
		String email,
		String displayName,
		UserRole role,
		boolean enabled,
		boolean mustChangePassword,
		Instant lastLoginAt,
		Instant createdAt,
		Instant updatedAt) {
}
