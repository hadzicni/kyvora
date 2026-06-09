package dev.kyvora.api.user.service;

import java.util.List;
import java.util.UUID;

import dev.kyvora.api.auth.security.AuthenticatedUser;
import dev.kyvora.api.user.dto.ChangePasswordRequest;
import dev.kyvora.api.user.dto.CreateUserRequest;
import dev.kyvora.api.user.dto.ResetPasswordRequest;
import dev.kyvora.api.user.dto.UpdateUserRequest;
import dev.kyvora.api.user.dto.UserResponse;

public interface UserManagementService {

	List<UserResponse> findAll();

	UserResponse findById(UUID id);

	UserResponse create(CreateUserRequest request);

	UserResponse update(UUID id, UpdateUserRequest request);

	UserResponse disable(UUID id, AuthenticatedUser actor);

	UserResponse enable(UUID id);

	void resetPassword(UUID id, ResetPasswordRequest request);

	void changeOwnPassword(AuthenticatedUser user, ChangePasswordRequest request);
}
