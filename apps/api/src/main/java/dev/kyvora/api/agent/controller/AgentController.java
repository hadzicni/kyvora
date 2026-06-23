package dev.kyvora.api.agent.controller;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.agent.dto.AgentPageResponse;
import dev.kyvora.api.agent.dto.AgentConnectionTestRequest;
import dev.kyvora.api.agent.dto.AgentConnectionTestResponse;
import dev.kyvora.api.agent.dto.AgentConnectionUpdateRequest;
import dev.kyvora.api.agent.dto.AgentPullResponse;
import dev.kyvora.api.agent.dto.AgentRegisterRequest;
import dev.kyvora.api.agent.dto.AgentResponse;
import dev.kyvora.api.agent.service.AgentService;
import dev.kyvora.api.config.openapi.OpenApiConfig;
import dev.kyvora.api.serverinventory.exception.ApiErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/v1/agents")
@Tag(name = "Agent Management", description = "Configure pull-based agents and trigger agent pulls.")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH_SCHEME)
public class AgentController {

	private final AgentService service;

	public AgentController(AgentService service) {
		this.service = service;
	}

	@GetMapping
	@PreAuthorize("@permissions.canReadAgents(authentication)")
	@Operation(summary = "List agents")
	public ResponseEntity<AgentPageResponse> findAll(
			@Parameter(description = "Pagination and sorting options. Supports page, size, and sort query parameters.")
			@PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(AgentPageResponse.from(service.findAll(pageable)));
	}

	@GetMapping("/{id}")
	@PreAuthorize("@permissions.canReadAgents(authentication)")
	@Operation(summary = "Get an agent")
	public ResponseEntity<AgentResponse> findById(
			@Parameter(description = "Agent identifier.", example = "00000000-0000-0000-0000-000000000001")
			@PathVariable UUID id) {
		return ResponseEntity.ok(service.findById(id));
	}

	@PostMapping
	@PreAuthorize("@permissions.canEnrollAgents(authentication)")
	@Operation(
			summary = "Configure a pull-based agent",
			description = "Creates an agent connection record. Shared secrets are accepted in requests but never returned in responses.",
			responses = {
					@ApiResponse(responseCode = "201", description = "Agent configured"),
					@ApiResponse(responseCode = "400", description = "Request body failed validation",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
					@ApiResponse(responseCode = "401", description = "Authentication is required", content = @Content),
					@ApiResponse(responseCode = "409", description = "Request conflicts with existing agent data",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
			})
	public ResponseEntity<AgentResponse> create(@Valid @RequestBody AgentRegisterRequest request) {
		AgentResponse created = service.create(request);
		return ResponseEntity.created(java.net.URI.create("/api/v1/agents/" + created.id())).body(created);
	}

	@PostMapping("/test-connection")
	@PreAuthorize("@permissions.canPullAgents(authentication)")
	@Operation(summary = "Test unsaved agent connection details from the Kyvora API")
	public ResponseEntity<AgentConnectionTestResponse> testConnection(
			@Valid @RequestBody AgentConnectionTestRequest request) {
		return ResponseEntity.ok(service.testConnection(request));
	}

	@PutMapping("/{id}/connection")
	@PreAuthorize("@permissions.canEnrollAgents(authentication)")
	@Operation(summary = "Update an agent connection", description = "Omit the shared secret to retain the existing saved value.")
	public ResponseEntity<AgentResponse> updateConnection(
			@PathVariable UUID id,
			@Valid @RequestBody AgentConnectionUpdateRequest request) {
		return ResponseEntity.ok(service.updateConnection(id, request));
	}

	@PostMapping("/{id}/pull")
	@PreAuthorize("@permissions.canPullAgents(authentication)")
	@Operation(
			summary = "Pull data from an agent",
			description = "Calls the secured agent HTTP API and updates agent/server status, capabilities, and host facts.")
	public ResponseEntity<AgentPullResponse> pull(
			@Parameter(description = "Agent identifier.", example = "00000000-0000-0000-0000-000000000001")
			@PathVariable UUID id) {
		return ResponseEntity.ok(service.pull(id));
	}

	@DeleteMapping("/{id}")
	@PreAuthorize("@permissions.canRemoveAgents(authentication)")
	@Operation(
			summary = "Remove an agent from Kyvora",
			description = "Stops pulls and removes the agent record from Kyvora. This does not uninstall the Linux systemd service from the managed host.")
	public ResponseEntity<Void> remove(
			@Parameter(description = "Agent identifier.", example = "00000000-0000-0000-0000-000000000001")
			@PathVariable UUID id) {
		service.remove(id);
		return ResponseEntity.noContent().build();
	}
}
