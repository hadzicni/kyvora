package dev.kyvora.api.auth.service;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.entity.UserPermission;
import dev.kyvora.api.auth.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@Slf4j
public class DefaultUserService implements UserService {

	private final UserRepository repository;
	private final PasswordEncoder passwordEncoder;

	public DefaultUserService(UserRepository repository, PasswordEncoder passwordEncoder) {
		this.repository = repository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	@Transactional(readOnly = true)
	public User findEnabledByEmail(String email) {
		return repository.findByEmailIgnoreCase(normalizeEmail(email))
				.filter(User::isEnabled)
				.orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));
	}

	@Override
	@Transactional(readOnly = true)
	public User findEnabledById(UUID id) {
		return repository.findById(id)
				.filter(User::isEnabled)
				.orElseThrow(() -> new InvalidTokenException("Invalid or expired token"));
	}

	@Override
	public User create(String email, String rawPassword, String displayName, Set<UserPermission> permissions) {
		User saved = repository.save(new User(
				normalizeEmail(email),
				passwordEncoder.encode(rawPassword),
				displayName,
				permissions,
				true));
		log.info("Created enabled user {}", saved.getId());
		return saved;
	}

	private String normalizeEmail(String email) {
		return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
	}
}
