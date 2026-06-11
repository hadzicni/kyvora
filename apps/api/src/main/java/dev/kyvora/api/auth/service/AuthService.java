package dev.kyvora.api.auth.service;

import java.util.UUID;

import dev.kyvora.api.auth.dto.AuthUserResponse;
import dev.kyvora.api.auth.dto.LoginRequest;
import dev.kyvora.api.auth.dto.LoginResponse;
import dev.kyvora.api.auth.dto.RefreshRequest;
import dev.kyvora.api.auth.dto.RefreshResponse;

public interface AuthService {

	LoginResponse login(LoginRequest request);

	RefreshResponse refresh(RefreshRequest request);

	void logout(String refreshToken);

	AuthUserResponse me(UUID userId);
}
