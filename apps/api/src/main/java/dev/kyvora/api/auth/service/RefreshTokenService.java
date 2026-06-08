package dev.kyvora.api.auth.service;

import java.time.Instant;

import dev.kyvora.api.auth.entity.RefreshToken;
import dev.kyvora.api.auth.entity.User;

public interface RefreshTokenService {

	String create(User user);

	RefreshToken consume(String rawRefreshToken);

	void revoke(String rawRefreshToken);
}
