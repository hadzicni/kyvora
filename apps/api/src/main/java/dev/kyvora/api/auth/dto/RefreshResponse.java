package dev.kyvora.api.auth.dto;

public record RefreshResponse(
		String accessToken,
		String refreshToken,
		String tokenType,
		long expiresIn,
		AuthUserResponse user) {
}
