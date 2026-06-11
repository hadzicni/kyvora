package dev.kyvora.api.user.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.auditlog.entity.AuditEventType;
import dev.kyvora.api.auditlog.service.AuditLogService;
import dev.kyvora.api.auth.entity.PermissionPreset;
import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.entity.UserPermission;
import dev.kyvora.api.auth.exception.UserManagementException;
import dev.kyvora.api.auth.exception.UserNotFoundException;
import dev.kyvora.api.auth.repository.RefreshTokenRepository;
import dev.kyvora.api.auth.repository.UserRepository;
import dev.kyvora.api.auth.security.AuthenticatedUser;
import dev.kyvora.api.auth.service.InvalidCredentialsException;
import dev.kyvora.api.user.dto.ChangePasswordRequest;
import dev.kyvora.api.user.dto.CreateUserRequest;
import dev.kyvora.api.user.dto.ResetPasswordRequest;
import dev.kyvora.api.user.dto.UpdateUserRequest;
import dev.kyvora.api.user.dto.UserResponse;

@Service
@Transactional
class DefaultUserManagementService implements UserManagementService {

	private final UserRepository userRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final UserManagementMapper mapper;
	private final AuditLogService auditLogService;

	DefaultUserManagementService(
			UserRepository userRepository,
			RefreshTokenRepository refreshTokenRepository,
			PasswordEncoder passwordEncoder,
			UserManagementMapper mapper,
			AuditLogService auditLogService) {
		this.userRepository = userRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.passwordEncoder = passwordEncoder;
		this.mapper = mapper;
		this.auditLogService = auditLogService;
	}

	@Override
	@Transactional(readOnly = true)
	public List<UserResponse> findAll() {
		return userRepository.findAll(Sort.by(Sort.Direction.ASC, "email")).stream()
				.map(mapper::toResponse)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public UserResponse findById(UUID id) {
		return mapper.toResponse(findUser(id));
	}

	@Override
	public UserResponse create(CreateUserRequest request) {
		Set<UserPermission> permissions = resolvePermissions(request.permissionPreset(), request.permissions());
		String email = normalizeEmail(request.email());
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new UserManagementException("Email is already in use");
		}

		User saved = userRepository.save(new User(
				email,
				passwordEncoder.encode(request.temporaryPassword()),
				request.displayName().trim(),
				permissions,
				true));
		saved.setMustChangePassword(request.mustChangePassword() == null || request.mustChangePassword());
		auditLogService.recordUserEvent(AuditEventType.USER_CREATED, saved.getId(), currentUserActor(), "User created", metadata(saved));
		return mapper.toResponse(saved);
	}

	@Override
	public UserResponse update(UUID id, UpdateUserRequest request) {
		Set<UserPermission> permissions = resolvePermissions(request.permissionPreset(), request.permissions());
		User user = findUser(id);
		Set<UserPermission> previousPermissions = user.getPermissions();
		if (previousPermissions.contains(UserPermission.USER_UPDATE)
				&& !permissions.contains(UserPermission.USER_UPDATE)
				&& user.isEnabled()) {
			ensureAnotherEnabledUserManager(user.getId(), "Cannot remove the last enabled user manager");
		}

		user.setDisplayName(request.displayName().trim());
		user.setPermissions(permissions);
		auditLogService.recordUserEvent(AuditEventType.USER_UPDATED, user.getId(), currentUserActor(), "User updated", metadata(user,
				Map.of("previousPermissions", permissionNames(previousPermissions))));
		return mapper.toResponse(user);
	}

	@Override
	public UserResponse disable(UUID id, AuthenticatedUser actor) {
		User user = findUser(id);
		if (user.getPermissions().contains(UserPermission.USER_UPDATE) && user.isEnabled()) {
			ensureAnotherEnabledUserManager(user.getId(), "Cannot disable the last enabled user manager");
		}
		if (actor != null && actor.id().equals(user.getId()) && user.getPermissions().contains(UserPermission.USER_UPDATE)) {
			ensureAnotherEnabledUserManager(user.getId(), "Cannot disable yourself as the only enabled user manager");
		}

		user.setEnabled(false);
		refreshTokenRepository.deleteByUser(user);
		auditLogService.recordUserEvent(AuditEventType.USER_DISABLED, user.getId(), actorEmail(actor), "User disabled", metadata(user));
		return mapper.toResponse(user);
	}

	@Override
	public UserResponse enable(UUID id) {
		User user = findUser(id);
		user.setEnabled(true);
		auditLogService.recordUserEvent(AuditEventType.USER_ENABLED, user.getId(), currentUserActor(), "User enabled", metadata(user));
		return mapper.toResponse(user);
	}

	@Override
	public void resetPassword(UUID id, ResetPasswordRequest request) {
		User user = findUser(id);
		user.setPasswordHash(passwordEncoder.encode(request.newTemporaryPassword()));
		user.setMustChangePassword(true);
		refreshTokenRepository.deleteByUser(user);
		auditLogService.recordUserEvent(AuditEventType.USER_PASSWORD_RESET, user.getId(), currentUserActor(), "User password reset", metadata(user));
	}

	@Override
	public void changeOwnPassword(AuthenticatedUser principal, ChangePasswordRequest request) {
		User user = findUser(principal.id());
		if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
			throw new InvalidCredentialsException("Current password is incorrect");
		}
		if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
			throw new UserManagementException("New password must be different from the current password");
		}

		user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
		user.setMustChangePassword(false);
		refreshTokenRepository.deleteByUser(user);
		auditLogService.recordUserEvent(AuditEventType.USER_PASSWORD_CHANGED, user.getId(), principal.email(), "User password changed", metadata(user));
	}

	private User findUser(UUID id) {
		return userRepository.findById(id)
				.orElseThrow(() -> new UserNotFoundException("User not found"));
	}

	private Set<UserPermission> resolvePermissions(PermissionPreset preset, Set<UserPermission> permissions) {
		Set<UserPermission> resolved = permissions == null || permissions.isEmpty()
				? (preset == null ? Set.of() : preset.permissions())
				: Set.copyOf(permissions);
		if (resolved.isEmpty()) {
			throw new UserManagementException("At least one permission is required");
		}
		return resolved;
	}

	private void ensureAnotherEnabledUserManager(UUID userId, String message) {
		long enabledUserManagers = userRepository.countEnabledUsersWithPermission(UserPermission.USER_UPDATE);
		if (enabledUserManagers <= 1 && userRepository.findById(userId)
				.filter(user -> user.getPermissions().contains(UserPermission.USER_UPDATE) && user.isEnabled())
				.isPresent()) {
			throw new UserManagementException(message);
		}
	}

	private Map<String, Object> metadata(User user) {
		return metadata(user, Map.of());
	}

	private Map<String, Object> metadata(User user, Map<String, Object> extra) {
		Map<String, Object> metadata = new LinkedHashMap<>();
		metadata.put("userId", user.getId().toString());
		metadata.put("email", user.getEmail());
		metadata.put("permissions", permissionNames(user.getPermissions()));
		metadata.put("enabled", user.isEnabled());
		metadata.put("mustChangePassword", user.isMustChangePassword());
		metadata.putAll(extra);
		return metadata;
	}

	private String currentUserActor() {
		return null;
	}

	private String actorEmail(AuthenticatedUser actor) {
		return actor == null ? null : actor.email();
	}

	private String normalizeEmail(String email) {
		return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
	}

	private List<String> permissionNames(Set<UserPermission> permissions) {
		return permissions.stream().map(Enum::name).sorted().toList();
	}
}
