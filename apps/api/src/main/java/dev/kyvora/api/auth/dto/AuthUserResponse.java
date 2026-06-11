package dev.kyvora.api.auth.dto;

import java.util.Set;
import java.util.UUID;

import dev.kyvora.api.auth.entity.UserPermission;

public record AuthUserResponse(
		UUID id,
		String email,
		String displayName,
		Set<UserPermission> permissions,
		boolean mustChangePassword) {
}
