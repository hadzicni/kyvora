package dev.kyvora.api.auditlog.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import dev.kyvora.api.auditlog.dto.AuditLogFilter;
import dev.kyvora.api.auditlog.dto.AuditLogResponse;
import dev.kyvora.api.auditlog.entity.AuditEventType;
import dev.kyvora.api.auditlog.service.AuditLogService;
import dev.kyvora.api.config.openapi.OpenApiConfig;
import dev.kyvora.api.serverinventory.exception.ApiErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@Validated
@RestController
@RequestMapping("/api/v1/audit-logs")
@Tag(name = "Audit Logs", description = "Read persistent audit events.")
@SecurityRequirement(name = OpenApiConfig.BASIC_AUTH_SCHEME)
public class AuditLogController {

	private final AuditLogService service;

	public AuditLogController(AuditLogService service) {
		this.service = service;
	}

	@GetMapping
	@Operation(
			summary = "List audit logs",
			description = "Returns a paginated list of audit logs, optionally filtered by aggregate and event type.",
			responses = {
					@ApiResponse(responseCode = "200", description = "Audit log page returned"),
					@ApiResponse(responseCode = "400", description = "Invalid filter or pagination parameter",
							content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
					@ApiResponse(responseCode = "401", description = "Authentication is required",
							content = @Content)
			})
	public ResponseEntity<Page<AuditLogResponse>> findAll(
			@Parameter(description = "Aggregate type filter.", example = "SERVER")
			@RequestParam(required = false) String aggregateType,
			@Parameter(description = "Aggregate identifier filter.", example = "00000000-0000-0000-0000-000000000001")
			@RequestParam(required = false) UUID aggregateId,
			@Parameter(description = "Event type filter.", example = "SERVER_CREATED")
			@RequestParam(required = false) AuditEventType eventType,
			@Parameter(description = "Pagination and sorting options. Supports page, size, and sort query parameters.")
			@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
		return ResponseEntity.ok(service.findAll(new AuditLogFilter(aggregateType, aggregateId, eventType), pageable));
	}
}
