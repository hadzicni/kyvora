package dev.kyvora.api.agent.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.stereotype.Service;

@Service
public class AgentTokenService {

	private static final int TOKEN_BYTES = 32;

	private final SecureRandom secureRandom = new SecureRandom();

	public String generateToken() {
		byte[] bytes = new byte[TOKEN_BYTES];
		secureRandom.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	public String hash(String token) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		}
		catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 is not available", exception);
		}
	}

	public boolean matches(String token, String expectedHash) {
		if (token == null || token.isBlank() || expectedHash == null || expectedHash.isBlank()) {
			return false;
		}
		byte[] actual = hash(token).getBytes(StandardCharsets.UTF_8);
		byte[] expected = expectedHash.getBytes(StandardCharsets.UTF_8);
		return MessageDigest.isEqual(actual, expected);
	}
}
