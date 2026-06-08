package dev.kyvora.api.status.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.status.dto.StatusResponse;
import dev.kyvora.api.status.service.StatusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/status")
@Tag(name = "Status", description = "Kyvora API status and release metadata.")
public class StatusController {

	private final StatusService statusService;

	public StatusController(StatusService statusService) {
		this.statusService = statusService;
	}

	@GetMapping
	@Operation(
			summary = "Get API status",
			responses = {
					@ApiResponse(responseCode = "200", description = "Status returned"),
					@ApiResponse(responseCode = "401", description = "Authentication is required")
			})
	public ResponseEntity<StatusResponse> status() {
		return ResponseEntity.ok(statusService.status());
	}
}
