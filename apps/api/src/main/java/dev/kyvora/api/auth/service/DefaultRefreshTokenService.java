package dev.kyvora.api.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.auth.entity.RefreshToken;
import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.repository.RefreshTokenRepository;

@Service
@Transactional
public class DefaultRefreshTokenService implements RefreshTokenService {

	private static final SecureRandom SECURE_RANDOM = new SecureRandom();
	private static final Base64.Encoder TOKEN_ENCODER = Base64.getUrlEncoder().withoutPadding();

	private final RefreshTokenRepository repository;
	private final long refreshTokenTtlSeconds;

	public DefaultRefreshTokenService(
			RefreshTokenRepository repository,
			@Value("${KYVORA_REFRESH_TOKEN_TTL_SECONDS:2592000}") long refreshTokenTtlSeconds) {
		this.repository = repository;
		this.refreshTokenTtlSeconds = refreshTokenTtlSeconds;
	}

	@Override
	public String create(User user) {
		byte[] tokenBytes = new byte[32];
		SECURE_RANDOM.nextBytes(tokenBytes);
		String rawToken = TOKEN_ENCODER.encodeToString(tokenBytes);
		repository.save(new RefreshToken(user, hash(rawToken), Instant.now().plusSeconds(refreshTokenTtlSeconds)));
		return rawToken;
	}

	@Override
	public RefreshToken consume(String rawRefreshToken) {
		RefreshToken token = repository.findByTokenHash(hash(rawRefreshToken))
				.orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));
		Instant now = Instant.now();
		if (token.getRevokedAt() != null || !token.getExpiresAt().isAfter(now) || !token.getUser().isEnabled()) {
			throw new InvalidTokenException("Invalid refresh token");
		}
		token.revoke(now);
		return token;
	}

	@Override
	public void revoke(String rawRefreshToken) {
		repository.findByTokenHash(hash(rawRefreshToken))
				.filter(token -> token.getRevokedAt() == null)
				.ifPresent(token -> token.revoke(Instant.now()));
	}

	private String hash(String rawToken) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
					.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
		}
		catch (Exception exception) {
			throw new IllegalStateException("Could not hash refresh token", exception);
		}
	}
}
