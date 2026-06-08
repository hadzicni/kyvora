package dev.kyvora.api.auth.security;

import java.time.Instant;
import java.util.UUID;

import dev.kyvora.api.auth.entity.UserRole;

public record JwtClaims(
		UUID userId,
		String email,
		String displayName,
		UserRole role,
		Instant expiresAt) {
}
