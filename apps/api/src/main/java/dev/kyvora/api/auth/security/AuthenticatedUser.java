package dev.kyvora.api.auth.security;

import java.util.Set;
import java.util.UUID;

import dev.kyvora.api.auth.entity.UserPermission;

public record AuthenticatedUser(
		UUID id,
		String email,
		String displayName,
		Set<UserPermission> permissions,
		boolean mustChangePassword) {
}
