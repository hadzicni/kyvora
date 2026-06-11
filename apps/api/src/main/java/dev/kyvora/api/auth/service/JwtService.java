package dev.kyvora.api.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Collection;
import java.util.Set;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.entity.UserPermission;
import dev.kyvora.api.auth.security.JwtClaims;

@Service
public class JwtService {

	private static final String HMAC_ALGORITHM = "HmacSHA256";
	private static final Base64.Encoder BASE64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
	private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();
	private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
	};

	private final ObjectMapper objectMapper;
	private final byte[] secret;
	private final long accessTokenTtlSeconds;

	public JwtService(
			ObjectMapper objectMapper,
			@Value("${KYVORA_JWT_SECRET:}") String secret,
			@Value("${KYVORA_JWT_ACCESS_TOKEN_TTL_SECONDS:900}") long accessTokenTtlSeconds) {
		if (secret == null || secret.length() < 32) {
			throw new IllegalStateException("KYVORA_JWT_SECRET must be set to at least 32 characters");
		}
		this.objectMapper = objectMapper;
		this.secret = secret.getBytes(StandardCharsets.UTF_8);
		this.accessTokenTtlSeconds = accessTokenTtlSeconds;
	}

	public String createAccessToken(User user) {
		Instant now = Instant.now();
		Instant expiresAt = now.plusSeconds(accessTokenTtlSeconds);

		Map<String, Object> header = new LinkedHashMap<>();
		header.put("alg", "HS256");
		header.put("typ", "JWT");

		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("sub", user.getEmail());
		payload.put("uid", user.getId().toString());
		payload.put("name", user.getDisplayName());
		payload.put("permissions", user.getPermissions().stream().map(Enum::name).sorted().toList());
		payload.put("iat", now.getEpochSecond());
		payload.put("exp", expiresAt.getEpochSecond());

		String unsignedToken = base64Json(header) + "." + base64Json(payload);
		return unsignedToken + "." + sign(unsignedToken);
	}

	public JwtClaims validate(String token) {
		String[] parts = token == null ? new String[0] : token.split("\\.");
		if (parts.length != 3) {
			throw new InvalidTokenException("Invalid or expired token");
		}

		String unsignedToken = parts[0] + "." + parts[1];
		if (!MessageDigest.isEqual(sign(unsignedToken).getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
			throw new InvalidTokenException("Invalid or expired token");
		}

		Map<String, Object> payload = parseJson(parts[1]);
		Instant expiresAt = Instant.ofEpochSecond(numberClaim(payload, "exp").longValue());
		if (!expiresAt.isAfter(Instant.now())) {
			throw new InvalidTokenException("Invalid or expired token");
		}

		return new JwtClaims(
				UUID.fromString(stringClaim(payload, "uid")),
				stringClaim(payload, "sub"),
				stringClaim(payload, "name"),
				permissionsClaim(payload, "permissions"),
				expiresAt);
	}

	public long getAccessTokenTtlSeconds() {
		return accessTokenTtlSeconds;
	}

	private String base64Json(Map<String, Object> value) {
		try {
			return BASE64_URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(value));
		}
		catch (Exception exception) {
			throw new IllegalStateException("Could not encode JWT", exception);
		}
	}

	private Map<String, Object> parseJson(String value) {
		try {
			return objectMapper.readValue(BASE64_URL_DECODER.decode(value), MAP_TYPE);
		}
		catch (Exception exception) {
			throw new InvalidTokenException("Invalid or expired token");
		}
	}

	private String sign(String unsignedToken) {
		try {
			Mac mac = Mac.getInstance(HMAC_ALGORITHM);
			mac.init(new SecretKeySpec(secret, HMAC_ALGORITHM));
			return BASE64_URL_ENCODER.encodeToString(mac.doFinal(unsignedToken.getBytes(StandardCharsets.UTF_8)));
		}
		catch (Exception exception) {
			throw new IllegalStateException("Could not sign JWT", exception);
		}
	}

	private String stringClaim(Map<String, Object> payload, String name) {
		Object value = payload.get(name);
		if (value instanceof String stringValue && !stringValue.isBlank()) {
			return stringValue;
		}
		throw new InvalidTokenException("Invalid or expired token");
	}

	private Number numberClaim(Map<String, Object> payload, String name) {
		Object value = payload.get(name);
		if (value instanceof Number numberValue) {
			return numberValue;
		}
		throw new InvalidTokenException("Invalid or expired token");
	}

	private Set<UserPermission> permissionsClaim(Map<String, Object> payload, String name) {
		Object value = payload.get(name);
		if (value instanceof Collection<?> permissions) {
			try {
				return permissions.stream()
						.filter(String.class::isInstance)
						.map(String.class::cast)
						.map(UserPermission::valueOf)
						.collect(java.util.stream.Collectors.toUnmodifiableSet());
			}
			catch (IllegalArgumentException exception) {
				throw new InvalidTokenException("Invalid or expired token");
			}
		}
		throw new InvalidTokenException("Invalid or expired token");
	}
}
