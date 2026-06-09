package dev.kyvora.api.user.dto;

import dev.kyvora.api.auth.entity.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
		@NotBlank @Size(max = 120) String displayName,
		@NotNull UserRole role) {
}
