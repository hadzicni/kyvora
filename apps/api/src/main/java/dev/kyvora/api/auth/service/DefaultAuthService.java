package dev.kyvora.api.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.auditlog.entity.AuditEventType;
import dev.kyvora.api.auditlog.service.AuditLogService;
import dev.kyvora.api.auth.dto.AuthUserResponse;
import dev.kyvora.api.auth.dto.LoginRequest;
import dev.kyvora.api.auth.dto.LoginResponse;
import dev.kyvora.api.auth.dto.RefreshRequest;
import dev.kyvora.api.auth.dto.RefreshResponse;
import dev.kyvora.api.auth.entity.RefreshToken;
import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.repository.UserRepository;

@Service
@Transactional
public class DefaultAuthService implements AuthService {

	private static final String BEARER_TOKEN_TYPE = "Bearer";

	private final UserService userService;
	private final RefreshTokenService refreshTokenService;
	private final JwtService jwtService;
	private final PasswordEncoder passwordEncoder;
	private final UserMapper userMapper;
	private final AuditLogService auditLogService;
	private final UserRepository userRepository;

	public DefaultAuthService(
			UserService userService,
			RefreshTokenService refreshTokenService,
			JwtService jwtService,
			PasswordEncoder passwordEncoder,
			UserMapper userMapper,
			AuditLogService auditLogService,
			UserRepository userRepository) {
		this.userService = userService;
		this.refreshTokenService = refreshTokenService;
		this.jwtService = jwtService;
		this.passwordEncoder = passwordEncoder;
		this.userMapper = userMapper;
		this.auditLogService = auditLogService;
		this.userRepository = userRepository;
	}

	@Override
	public LoginResponse login(LoginRequest request) {
		User user;
		try {
			user = userService.findEnabledByEmail(request.email());
		}
		catch (InvalidCredentialsException exception) {
			userRepository.findByEmailIgnoreCase(request.email())
					.filter(foundUser -> !foundUser.isEnabled())
					.ifPresentOrElse(
							disabledUser -> auditLogService.recordAuthEvent(
									AuditEventType.USER_LOGIN_BLOCKED_DISABLED,
									disabledUser.getId(),
									disabledUser.getEmail(),
									"User login blocked for disabled account"),
							() -> auditLogService.recordAuthEvent(
									AuditEventType.USER_LOGIN_FAILED,
									null,
									request.email(),
									"User login failed"));
			throw exception;
		}

		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			auditLogService.recordAuthEvent(AuditEventType.USER_LOGIN_FAILED, user.getId(), user.getEmail(), "User login failed");
			throw new InvalidCredentialsException("Invalid email or password");
		}

		user.markLoginSuccessful();
		auditLogService.recordAuthEvent(AuditEventType.USER_LOGIN_SUCCEEDED, user.getId(), user.getEmail(), "User login succeeded");
		return loginResponse(user, refreshTokenService.create(user));
	}

	@Override
	public RefreshResponse refresh(RefreshRequest request) {
		RefreshToken oldToken = refreshTokenService.consume(request.refreshToken());
		User user = oldToken.getUser();
		String newRefreshToken = refreshTokenService.create(user);
		auditLogService.recordAuthEvent(AuditEventType.TOKEN_REFRESHED, user.getId(), user.getEmail(), "Token refreshed");
		return refreshResponse(user, newRefreshToken);
	}

	@Override
	public void logout(String refreshToken) {
		refreshTokenService.revoke(refreshToken);
		auditLogService.recordAuthEvent(AuditEventType.USER_LOGOUT, null, null, "User logout");
	}

	@Override
	@Transactional(readOnly = true)
	public AuthUserResponse me(java.util.UUID userId) {
		return userMapper.toResponse(userService.findEnabledById(userId));
	}

	private LoginResponse loginResponse(User user, String refreshToken) {
		return new LoginResponse(
				jwtService.createAccessToken(user),
				refreshToken,
				BEARER_TOKEN_TYPE,
				jwtService.getAccessTokenTtlSeconds(),
				userMapper.toResponse(user));
	}

	private RefreshResponse refreshResponse(User user, String refreshToken) {
		return new RefreshResponse(
				jwtService.createAccessToken(user),
				refreshToken,
				BEARER_TOKEN_TYPE,
				jwtService.getAccessTokenTtlSeconds(),
				userMapper.toResponse(user));
	}
}
