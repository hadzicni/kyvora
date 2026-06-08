package dev.kyvora.api.auth.dto;

public record LoginResponse(
		String accessToken,
		String refreshToken,
		String tokenType,
		long expiresIn,
		AuthUserResponse user) {
}
