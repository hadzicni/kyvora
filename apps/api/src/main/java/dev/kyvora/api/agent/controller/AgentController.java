package dev.kyvora.api.agent.controller;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.agent.dto.AgentEnrollmentResponse;
import dev.kyvora.api.agent.dto.AgentHeartbeatRequest;
import dev.kyvora.api.agent.dto.AgentPageResponse;
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
@Tag(name = "Agent Management", description = "Register agents and receive agent heartbeats.")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH_SCHEME)
public class AgentController {

	public static final String AGENT_TOKEN_HEADER = "X-Kyvora-Agent-Token";

	private final AgentService service;

	public AgentController(AgentService service) {
		this.service = service;
	}

	@GetMapping
	@Operation(
			summary = "List agents",
			description = "Returns a paginated list of registered agents.",
			responses = {
					@ApiResponse(responseCode = "200", description = "Agent page returned"),
					@ApiResponse(responseCode = "400", description = "Invalid pagination parameter",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
					@ApiResponse(responseCode = "401", description = "Authentication is required",
							content = @Content)
			})
	public ResponseEntity<AgentPageResponse> findAll(
			@Parameter(description = "Pagination and sorting options. Supports page, size, and sort query parameters.")
			@PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(AgentPageResponse.from(service.findAll(pageable)));
	}

	@GetMapping("/{id}")
	@Operation(
			summary = "Get an agent",
			responses = {
					@ApiResponse(responseCode = "200", description = "Agent returned"),
					@ApiResponse(responseCode = "401", description = "Authentication is required",
							content = @Content),
					@ApiResponse(responseCode = "404", description = "Agent was not found",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
			})
	public ResponseEntity<AgentResponse> findById(
			@Parameter(description = "Agent identifier.", example = "00000000-0000-0000-0000-000000000001")
			@PathVariable UUID id) {
		return ResponseEntity.ok(service.findById(id));
	}

	@PostMapping
	@Operation(
			summary = "Enroll an agent",
			description = "Creates an agent record and returns a one-time plaintext agent token. The token is never stored in plaintext and is shown only in this response.",
			responses = {
					@ApiResponse(responseCode = "201", description = "Agent enrolled"),
					@ApiResponse(responseCode = "400", description = "Request body failed validation",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
					@ApiResponse(responseCode = "401", description = "Authentication is required",
							content = @Content),
					@ApiResponse(responseCode = "409", description = "Request conflicts with existing agent data",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
			})
	public ResponseEntity<AgentEnrollmentResponse> enroll(@Valid @RequestBody AgentRegisterRequest request) {
		AgentEnrollmentResponse enrolled = service.enroll(request);
		return ResponseEntity.created(java.net.URI.create("/api/v1/agents/" + enrolled.agent().id())).body(enrolled);
	}

	@PostMapping("/{id}/heartbeat")
	@Operation(
			summary = "Receive an agent heartbeat",
			description = "Authenticates with the X-Kyvora-Agent-Token header. User JWTs are not accepted for agent heartbeat authentication.",
			security = {},
			responses = {
					@ApiResponse(responseCode = "200", description = "Heartbeat received"),
					@ApiResponse(responseCode = "400", description = "Request body failed validation",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
					@ApiResponse(responseCode = "401", description = "Agent token is missing or invalid",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
					@ApiResponse(responseCode = "403", description = "Agent token is revoked",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
					@ApiResponse(responseCode = "404", description = "Agent was not found",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
			})
	public ResponseEntity<AgentResponse> heartbeat(
			@Parameter(description = "Agent identifier.", example = "00000000-0000-0000-0000-000000000001")
			@PathVariable UUID id,
			@Parameter(description = "One-time enrollment token assigned to the agent.", required = true)
			@RequestHeader(value = AGENT_TOKEN_HEADER, required = false) String agentToken,
			@Valid @RequestBody AgentHeartbeatRequest request) {
		return ResponseEntity.ok(service.heartbeat(id, agentToken, request));
	}
}
