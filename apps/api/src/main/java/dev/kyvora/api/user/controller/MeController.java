package dev.kyvora.api.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.auth.security.AuthenticatedUser;
import dev.kyvora.api.config.openapi.OpenApiConfig;
import dev.kyvora.api.user.dto.ChangePasswordRequest;
import dev.kyvora.api.user.service.UserManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/me")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH_SCHEME)
@Tag(name = "Me", description = "Self-service current user actions.")
public class MeController {

	private final UserManagementService service;

	public MeController(UserManagementService service) {
		this.service = service;
	}

	@PostMapping("/change-password")
	@Operation(summary = "Change own password")
	public ResponseEntity<Void> changePassword(
			@AuthenticationPrincipal AuthenticatedUser user,
			@Valid @RequestBody ChangePasswordRequest request) {
		service.changeOwnPassword(user, request);
		return ResponseEntity.noContent().build();
	}
}
