package dev.kyvora.api.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.auth.dto.AuthUserResponse;
import dev.kyvora.api.auth.dto.LoginRequest;
import dev.kyvora.api.auth.dto.LoginResponse;
import dev.kyvora.api.auth.dto.LogoutRequest;
import dev.kyvora.api.auth.dto.RefreshRequest;
import dev.kyvora.api.auth.dto.RefreshResponse;
import dev.kyvora.api.auth.security.AuthenticatedUser;
import dev.kyvora.api.auth.service.AuthService;
import dev.kyvora.api.config.openapi.OpenApiConfig;
import dev.kyvora.api.serverinventory.exception.ApiErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Authenticate users and manage JWT sessions.")
public class AuthController {

	private final AuthService service;

	public AuthController(AuthService service) {
		this.service = service;
	}

	@PostMapping("/login")
	@Operation(
			summary = "Log in",
			responses = {
					@ApiResponse(responseCode = "200", description = "Authentication tokens returned"),
					@ApiResponse(responseCode = "400", description = "Request body failed validation",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
					@ApiResponse(responseCode = "401", description = "Invalid email or password",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
			})
	public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
		return ResponseEntity.ok(service.login(request));
	}

	@PostMapping("/refresh")
	@Operation(
			summary = "Refresh tokens",
			responses = {
					@ApiResponse(responseCode = "200", description = "New authentication tokens returned"),
					@ApiResponse(responseCode = "400", description = "Request body failed validation",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
					@ApiResponse(responseCode = "401", description = "Refresh token is invalid or expired",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
			})
	public ResponseEntity<RefreshResponse> refresh(@Valid @RequestBody RefreshRequest request) {
		return ResponseEntity.ok(service.refresh(request));
	}

	@PostMapping("/logout")
	@Operation(summary = "Log out", responses = {
			@ApiResponse(responseCode = "204", description = "Refresh token revoked"),
			@ApiResponse(responseCode = "401", description = "Authentication is required", content = @Content)
	})
	@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH_SCHEME)
	public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request) {
		service.logout(request.refreshToken());
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/me")
	@Operation(summary = "Get current user", responses = {
			@ApiResponse(responseCode = "200", description = "Current user returned"),
			@ApiResponse(responseCode = "401", description = "Authentication is required", content = @Content)
	})
	@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH_SCHEME)
	public ResponseEntity<AuthUserResponse> me(@AuthenticationPrincipal AuthenticatedUser user) {
		return ResponseEntity.ok(service.me(user.id()));
	}
}
