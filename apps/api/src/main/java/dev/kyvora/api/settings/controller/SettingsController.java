package dev.kyvora.api.settings.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.config.openapi.OpenApiConfig;
import dev.kyvora.api.serverinventory.exception.ApiErrorResponse;
import dev.kyvora.api.settings.dto.SettingsResponse;
import dev.kyvora.api.settings.dto.UpdateSettingsRequest;
import dev.kyvora.api.settings.service.SettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/v1/settings")
@Tag(name = "System Settings", description = "Read and update database-backed operational settings.")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH_SCHEME)
public class SettingsController {

	private final SettingsService service;

	public SettingsController(SettingsService service) {
		this.service = service;
	}

	@GetMapping
	@Operation(
			summary = "Get system settings",
			responses = {
					@ApiResponse(responseCode = "200", description = "Settings returned"),
					@ApiResponse(responseCode = "401", description = "Authentication is required", content = @Content)
			})
	public ResponseEntity<SettingsResponse> findAll() {
		return ResponseEntity.ok(service.findAll());
	}

	@PutMapping
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(
			summary = "Update system settings",
			description = "Updates supported operational settings. Secrets and agent tokens are not accepted here.",
			responses = {
					@ApiResponse(responseCode = "200", description = "Updated settings returned"),
					@ApiResponse(responseCode = "400", description = "Request body failed validation",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
					@ApiResponse(responseCode = "401", description = "Authentication is required", content = @Content),
					@ApiResponse(responseCode = "403", description = "ADMIN role is required", content = @Content)
			})
	public ResponseEntity<SettingsResponse> update(@Valid @RequestBody UpdateSettingsRequest request) {
		return ResponseEntity.ok(service.update(request));
	}
}
