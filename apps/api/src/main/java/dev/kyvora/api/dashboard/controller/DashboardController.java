package dev.kyvora.api.dashboard.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.config.openapi.OpenApiConfig;
import dev.kyvora.api.dashboard.dto.DashboardSummaryResponse;
import dev.kyvora.api.dashboard.service.DashboardSummaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard", description = "Summary metrics for the Kyvora dashboard.")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH_SCHEME)
public class DashboardController {

	private final DashboardSummaryService service;

	public DashboardController(DashboardSummaryService service) {
		this.service = service;
	}

	@GetMapping("/summary")
	@PreAuthorize("@permissions.canReadDashboard(authentication)")
	@Operation(
			summary = "Get dashboard summary metrics",
			responses = {
					@ApiResponse(responseCode = "200", description = "Dashboard summary returned"),
					@ApiResponse(responseCode = "401", description = "Authentication is required")
			})
	public ResponseEntity<DashboardSummaryResponse> getSummary() {
		return ResponseEntity.ok(service.getSummary());
	}
}
