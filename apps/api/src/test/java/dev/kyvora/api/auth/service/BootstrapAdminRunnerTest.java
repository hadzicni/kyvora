package dev.kyvora.api.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.concurrent.atomic.AtomicBoolean;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.entity.UserPermission;
import dev.kyvora.api.auth.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class BootstrapAdminRunnerTest {

	private static final String GENERATED_PASSWORD = "generated-temporary-password";
	private static final String PASSWORD_HASH = "$2a$10$hashed-password";

	@Mock
	private UserRepository userRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Test
	void createsAdminWithGeneratedPasswordWhenUsersTableIsEmpty() {
		when(userRepository.count()).thenReturn(0L);
		when(passwordEncoder.encode(GENERATED_PASSWORD)).thenReturn(PASSWORD_HASH);

		var runner = new BootstrapAdminRunner(
				userRepository,
				passwordEncoder,
				() -> GENERATED_PASSWORD);

		runner.run();

		ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
		verify(userRepository).save(userCaptor.capture());
		User saved = userCaptor.getValue();

		assertThat(saved.getEmail()).isEqualTo("admin@kyvora.local");
		assertThat(saved.getDisplayName()).isEqualTo("Kyvora Admin");
		assertThat(saved.getPermissions()).contains(UserPermission.USER_UPDATE, UserPermission.SETTINGS_UPDATE);
		assertThat(saved.isEnabled()).isTrue();
		assertThat(saved.isMustChangePassword()).isTrue();
		assertThat(saved.getPasswordHash()).isEqualTo(PASSWORD_HASH);
		assertThat(saved.getPasswordHash()).isNotEqualTo(GENERATED_PASSWORD);
	}

	@Test
	void skipsBootstrapWhenUsersAlreadyExist() {
		when(userRepository.count()).thenReturn(1L);
		AtomicBoolean generatedPassword = new AtomicBoolean(false);

		var runner = new BootstrapAdminRunner(
				userRepository,
				passwordEncoder,
				() -> {
					generatedPassword.set(true);
					return GENERATED_PASSWORD;
				});

		runner.run();

		assertThat(generatedPassword.get()).isFalse();
		verify(passwordEncoder, never()).encode(any());
		verify(userRepository, never()).save(any());
	}
}
