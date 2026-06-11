package dev.kyvora.api.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.entity.PermissionPreset;
import dev.kyvora.api.auth.repository.UserRepository;

@Component
public class BootstrapAdminRunner implements CommandLineRunner {

	private static final Logger log = LoggerFactory.getLogger(BootstrapAdminRunner.class);
	private static final String FIRST_ADMIN_EMAIL = "admin@kyvora.local";
	private static final String FIRST_ADMIN_DISPLAY_NAME = "Kyvora Admin";

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final TemporaryPasswordGenerator temporaryPasswordGenerator;

	public BootstrapAdminRunner(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			TemporaryPasswordGenerator temporaryPasswordGenerator) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.temporaryPasswordGenerator = temporaryPasswordGenerator;
	}

	@Override
	@Transactional
	public void run(String... args) {
		if (userRepository.count() > 0) {
			log.info("Skipping first admin bootstrap because users already exist.");
			return;
		}

		String temporaryPassword = temporaryPasswordGenerator.generate();
		User admin = new User(
				FIRST_ADMIN_EMAIL,
				passwordEncoder.encode(temporaryPassword),
				FIRST_ADMIN_DISPLAY_NAME,
				PermissionPreset.ADMIN.permissions(),
				true);
		admin.setMustChangePassword(true);
		userRepository.save(admin);

		log.warn("""
				============================================================
				Kyvora first admin created
				Email: {}
				Temporary password: {}
				This password is shown only once. Log in and change it immediately.
				============================================================
				""", FIRST_ADMIN_EMAIL, temporaryPassword);
	}
}
