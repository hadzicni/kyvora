package dev.kyvora.api.auth.service;

import org.springframework.stereotype.Component;

import dev.kyvora.api.auth.dto.AuthUserResponse;
import dev.kyvora.api.auth.entity.User;

@Component
public class UserMapper {

	public AuthUserResponse toResponse(User user) {
		return new AuthUserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole());
	}
}
