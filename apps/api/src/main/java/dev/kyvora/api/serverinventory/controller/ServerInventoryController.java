package dev.kyvora.api.serverinventory.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.config.openapi.OpenApiConfig;
import dev.kyvora.api.serverinventory.dto.ServerInventoryCreateRequest;
import dev.kyvora.api.serverinventory.dto.ServerInventoryFilter;
import dev.kyvora.api.serverinventory.dto.ServerInventoryPageResponse;
import dev.kyvora.api.serverinventory.dto.ServerInventoryResponse;
import dev.kyvora.api.serverinventory.dto.ServerInventoryUpdateRequest;
import dev.kyvora.api.serverinventory.entity.ServerStatus;
import dev.kyvora.api.serverinventory.service.ServerInventoryService;
import dev.kyvora.api.serverinventory.exception.ApiErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/v1/servers")
@Tag(name = "Server Inventory", description = "Manage servers registered in the Kyvora inventory.")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH_SCHEME)
public class ServerInventoryController {

	private final ServerInventoryService service;

	public ServerInventoryController(ServerInventoryService service) {
		this.service = service;
	}

	@GetMapping
	@Operation(
			summary = "List server inventory entries",
			description = "Returns a paginated list of servers, optionally filtered by inventory fields.",
			responses = {
					@ApiResponse(responseCode = "200", description = "Server inventory page returned"),
					@ApiResponse(responseCode = "400", description = "Invalid filter or pagination parameter",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
					@ApiResponse(responseCode = "401", description = "Authentication is required",
							content = @Content)
			})
	public ResponseEntity<ServerInventoryPageResponse> findAll(
			@Parameter(description = "Case-insensitive search across name, hostname, and IP address.", example = "web")
			@RequestParam(required = false, name = "q") String q,
			@Parameter(description = "Case-insensitive partial match on the display name.", example = "web")
			@RequestParam(required = false) String name,
			@Parameter(description = "Case-insensitive partial match on hostname.", example = "web01.example.com")
			@RequestParam(required = false) String hostname,
			@Parameter(description = "Exact IPv4 address filter.", example = "10.0.0.10")
			@RequestParam(required = false) String ipAddress,
			@Parameter(description = "Server lifecycle status.", example = "ONLINE")
			@RequestParam(required = false) ServerStatus status,
			@Parameter(description = "Filters entries containing any of the supplied tags.",
					array = @ArraySchema(schema = @Schema(example = "prod")))
			@RequestParam(required = false, name = "tags") List<String> tags,
			@Parameter(description = "Pagination and sorting options. Supports page, size, and sort query parameters.")
			@PageableDefault(size = 20) Pageable pageable) {
		ServerInventoryFilter filter = new ServerInventoryFilter(q, name, hostname, ipAddress, status, tags);
		return ResponseEntity.ok(ServerInventoryPageResponse.from(service.findAll(filter, pageable)));
	}

	@GetMapping("/{id}")
	@Operation(
			summary = "Get a server inventory entry",
			responses = {
					@ApiResponse(responseCode = "200", description = "Server inventory entry returned"),
					@ApiResponse(responseCode = "401", description = "Authentication is required",
							content = @Content),
					@ApiResponse(responseCode = "404", description = "Server inventory entry was not found",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
			})
	public ResponseEntity<ServerInventoryResponse> findById(
			@Parameter(description = "Server inventory entry identifier.", example = "00000000-0000-0000-0000-000000000001")
			@PathVariable UUID id) {
		return ResponseEntity.ok(service.findById(id));
	}

	@PostMapping
	@Operation(
			summary = "Create a server inventory entry",
			responses = {
					@ApiResponse(responseCode = "201", description = "Server inventory entry created"),
					@ApiResponse(responseCode = "400", description = "Request body failed validation",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
					@ApiResponse(responseCode = "401", description = "Authentication is required",
							content = @Content),
					@ApiResponse(responseCode = "409", description = "Request conflicts with existing inventory data",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
			})
	public ResponseEntity<ServerInventoryResponse> create(@Valid @RequestBody ServerInventoryCreateRequest request) {
		ServerInventoryResponse created = service.create(request);
		return ResponseEntity.created(URI.create("/api/v1/servers/" + created.id())).body(created);
	}

	@PutMapping("/{id}")
	@Operation(
			summary = "Update a server inventory entry",
			responses = {
					@ApiResponse(responseCode = "200", description = "Server inventory entry updated"),
					@ApiResponse(responseCode = "400", description = "Request body failed validation",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
					@ApiResponse(responseCode = "401", description = "Authentication is required",
							content = @Content),
					@ApiResponse(responseCode = "404", description = "Server inventory entry was not found",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
					@ApiResponse(responseCode = "409", description = "Request conflicts with existing inventory data",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
			})
	public ResponseEntity<ServerInventoryResponse> update(
			@Parameter(description = "Server inventory entry identifier.", example = "00000000-0000-0000-0000-000000000001")
			@PathVariable UUID id,
			@Valid @RequestBody ServerInventoryUpdateRequest request) {
		return ResponseEntity.ok(service.update(id, request));
	}

	@DeleteMapping("/{id}")
	@Operation(
			summary = "Delete a server inventory entry",
			responses = {
					@ApiResponse(responseCode = "204", description = "Server inventory entry deleted"),
					@ApiResponse(responseCode = "401", description = "Authentication is required",
							content = @Content),
					@ApiResponse(responseCode = "404", description = "Server inventory entry was not found",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
			})
	public ResponseEntity<Void> delete(
			@Parameter(description = "Server inventory entry identifier.", example = "00000000-0000-0000-0000-000000000001")
			@PathVariable UUID id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}
}
