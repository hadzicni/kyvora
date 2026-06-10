package dev.kyvora.api.auth.service;

import java.util.UUID;

import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.entity.UserRole;

public interface UserService {

	User findEnabledByEmail(String email);

	User findEnabledById(UUID id);

	User create(String email, String rawPassword, String displayName, UserRole role);
}
