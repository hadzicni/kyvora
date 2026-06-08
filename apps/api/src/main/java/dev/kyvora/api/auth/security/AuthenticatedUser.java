package dev.kyvora.api.auth.security;

import java.util.UUID;

import dev.kyvora.api.auth.entity.UserRole;

public record AuthenticatedUser(
		UUID id,
		String email,
		String displayName,
		UserRole role) {
}
