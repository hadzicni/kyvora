package dev.kyvora.api.auth.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SecureTemporaryPasswordGeneratorTest {

	@Test
	void generatesUrlSafeTemporaryPassword() {
		String password = new SecureTemporaryPasswordGenerator().generate();

		assertThat(password).hasSize(32);
		assertThat(password).matches("[A-Za-z0-9_-]+");
	}
}
