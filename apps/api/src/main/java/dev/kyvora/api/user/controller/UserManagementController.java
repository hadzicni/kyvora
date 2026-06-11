package dev.kyvora.api.user.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.auth.security.AuthenticatedUser;
import dev.kyvora.api.config.openapi.OpenApiConfig;
import dev.kyvora.api.user.dto.CreateUserRequest;
import dev.kyvora.api.user.dto.ResetPasswordRequest;
import dev.kyvora.api.user.dto.UpdateUserRequest;
import dev.kyvora.api.user.dto.UserResponse;
import dev.kyvora.api.user.service.UserManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/users")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH_SCHEME)
@Tag(name = "Users", description = "Admin-managed user accounts.")
public class UserManagementController {

	private final UserManagementService service;

	public UserManagementController(UserManagementService service) {
		this.service = service;
	}

	@GetMapping
	@PreAuthorize("@permissions.canReadUsers(authentication)")
	@Operation(summary = "List users")
	public ResponseEntity<List<UserResponse>> findAll() {
		return ResponseEntity.ok(service.findAll());
	}

	@GetMapping("/{id}")
	@PreAuthorize("@permissions.canReadUsers(authentication)")
	@Operation(summary = "Get user")
	public ResponseEntity<UserResponse> findById(@PathVariable UUID id) {
		return ResponseEntity.ok(service.findById(id));
	}

	@PostMapping
	@PreAuthorize("@permissions.canCreateUsers(authentication)")
	@Operation(summary = "Create user")
	public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
	}

	@PutMapping("/{id}")
	@PreAuthorize("@permissions.canUpdateUsers(authentication)")
	@Operation(summary = "Update user")
	public ResponseEntity<UserResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest request) {
		return ResponseEntity.ok(service.update(id, request));
	}

	@PostMapping("/{id}/disable")
	@PreAuthorize("@permissions.canDisableUsers(authentication)")
	@Operation(summary = "Disable user")
	public ResponseEntity<UserResponse> disable(
			@PathVariable UUID id,
			@AuthenticationPrincipal AuthenticatedUser actor) {
		return ResponseEntity.ok(service.disable(id, actor));
	}

	@PostMapping("/{id}/enable")
	@PreAuthorize("@permissions.canEnableUsers(authentication)")
	@Operation(summary = "Enable user")
	public ResponseEntity<UserResponse> enable(@PathVariable UUID id) {
		return ResponseEntity.ok(service.enable(id));
	}

	@PostMapping("/{id}/reset-password")
	@PreAuthorize("@permissions.canResetUserPasswords(authentication)")
	@Operation(summary = "Reset user password")
	public ResponseEntity<Void> resetPassword(@PathVariable UUID id, @Valid @RequestBody ResetPasswordRequest request) {
		service.resetPassword(id, request);
		return ResponseEntity.noContent().build();
	}
}
