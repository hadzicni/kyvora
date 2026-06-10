package dev.kyvora.api.auth.service;

import java.security.SecureRandom;
import java.util.Base64;

import org.springframework.stereotype.Component;

@Component
public class SecureTemporaryPasswordGenerator implements TemporaryPasswordGenerator {

	private static final int RANDOM_BYTE_COUNT = 24;
	private final SecureRandom secureRandom = new SecureRandom();

	@Override
	public String generate() {
		byte[] bytes = new byte[RANDOM_BYTE_COUNT];
		secureRandom.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}
}
