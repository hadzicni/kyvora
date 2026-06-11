package dev.kyvora.api.user.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import dev.kyvora.api.auth.entity.UserPermission;

public record UserResponse(
		UUID id,
		String email,
		String displayName,
		Set<UserPermission> permissions,
		boolean enabled,
		boolean mustChangePassword,
		Instant lastLoginAt,
		Instant createdAt,
		Instant updatedAt) {
}
