package dev.kyvora.api.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import dev.kyvora.api.auth.entity.UserRole;

@Component
@Profile("local")
public class BootstrapAdminRunner implements CommandLineRunner {

	private final UserService userService;
	private final String email;
	private final String password;
	private final String displayName;

	public BootstrapAdminRunner(
			UserService userService,
			@Value("${KYVORA_BOOTSTRAP_ADMIN_EMAIL:admin@kyvora.local}") String email,
			@Value("${KYVORA_BOOTSTRAP_ADMIN_PASSWORD:admin-password}") String password,
			@Value("${KYVORA_BOOTSTRAP_ADMIN_DISPLAY_NAME:Kyvora Admin}") String displayName) {
		this.userService = userService;
		this.email = email;
		this.password = password;
		this.displayName = displayName;
	}

	@Override
	public void run(String... args) {
		if (!userService.hasUsers()) {
			userService.create(email, password, displayName, UserRole.ADMIN);
		}
	}
}
