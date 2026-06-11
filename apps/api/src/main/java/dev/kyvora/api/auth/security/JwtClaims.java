package dev.kyvora.api.auth.security;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import dev.kyvora.api.auth.entity.UserPermission;

public record JwtClaims(
		UUID userId,
		String email,
		String displayName,
		Set<UserPermission> permissions,
		Instant expiresAt) {
}
