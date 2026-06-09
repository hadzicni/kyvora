package dev.kyvora.api.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
		@NotBlank @Size(min = 8) String newTemporaryPassword) {
}
