package dev.kyvora.api.networkmap.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.config.openapi.OpenApiConfig;
import dev.kyvora.api.networkmap.dto.NetworkMapResponse;
import dev.kyvora.api.networkmap.service.NetworkMapService;
import dev.kyvora.api.serverinventory.exception.ApiErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/network-map")
@Tag(name = "Network Map", description = "Read-only topology view derived from inventory and host facts.")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH_SCHEME)
public class NetworkMapController {

	private final NetworkMapService service;

	public NetworkMapController(NetworkMapService service) {
		this.service = service;
	}

	@GetMapping
	@PreAuthorize("@permissions.canReadNetworkMap(authentication)")
	@Operation(
			summary = "Get the network map",
			description = "Returns a frontend-friendly topology snapshot. This endpoint does not perform network scanning.",
			responses = {
					@ApiResponse(responseCode = "200", description = "Network map returned"),
					@ApiResponse(responseCode = "401", description = "Authentication is required", content = @Content),
					@ApiResponse(responseCode = "403", description = "Insufficient permissions",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
			})
	public ResponseEntity<NetworkMapResponse> getNetworkMap() {
		return ResponseEntity.ok(service.getNetworkMap());
	}
}
