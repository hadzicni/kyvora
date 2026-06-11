package dev.kyvora.api.user.dto;

import java.util.Set;

import dev.kyvora.api.auth.entity.PermissionPreset;
import dev.kyvora.api.auth.entity.UserPermission;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
		@NotBlank @Email String email,
		@NotBlank @Size(max = 120) String displayName,
		PermissionPreset permissionPreset,
		Set<UserPermission> permissions,
		@NotBlank @Size(min = 8) String temporaryPassword,
		Boolean mustChangePassword) {
}
