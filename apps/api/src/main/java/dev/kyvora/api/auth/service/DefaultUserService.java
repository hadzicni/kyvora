package dev.kyvora.api.auth.service;

import java.util.Locale;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.entity.UserRole;
import dev.kyvora.api.auth.repository.UserRepository;

@Service
@Transactional
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
	public User create(String email, String rawPassword, String displayName, UserRole role) {
		return repository.save(new User(
				normalizeEmail(email),
				passwordEncoder.encode(rawPassword),
				displayName,
				role,
				true));
	}

	@Override
	@Transactional(readOnly = true)
	public boolean hasUsers() {
		return repository.count() > 0;
	}

	private String normalizeEmail(String email) {
		return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
	}
}
