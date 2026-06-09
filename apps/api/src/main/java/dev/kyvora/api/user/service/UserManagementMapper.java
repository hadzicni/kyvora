package dev.kyvora.api.user.service;

import org.springframework.stereotype.Component;

import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.user.dto.UserResponse;

@Component
class UserManagementMapper {

	UserResponse toResponse(User user) {
		return new UserResponse(
				user.getId(),
				user.getEmail(),
				user.getDisplayName(),
				user.getRole(),
				user.isEnabled(),
				user.getLastLoginAt(),
				user.getCreatedAt(),
				user.getUpdatedAt());
	}
}
